import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rankPlaces, type PlaceRankingInput } from "@/lib/recommendations/ranking";
import type { PlaceCategory } from "@/types/database";

function calculateDistanceMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const VALID_CATEGORIES: PlaceCategory[] = [
  "heritage",
  "food",
  "nature",
  "viewpoint",
  "market",
  "culture",
  "other",
];

async function discoverPlacesForCustomDestination(destName: string): Promise<
  Array<{
    name: string;
    category: PlaceCategory;
    description: string;
    lat: number;
    lng: number;
    avg_rating: number;
  }>
> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `List 5 real, well-loved hidden gems, cafes, viewpoints, nature spots, or heritage places in "${destName}".
Return ONLY a JSON array of objects with this exact schema:
[
  {
    "name": "Place Name",
    "category": one of ["heritage", "food", "nature", "viewpoint", "market", "culture", "other"],
    "description": "1-2 sentence description of why travellers love it",
    "lat": number (approximate latitude),
    "lng": number (approximate longitude),
    "avg_rating": number between 4.3 and 4.9
  }
]`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(12000),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
              .filter((p) => p?.name && typeof p.lat === "number" && typeof p.lng === "number")
              .slice(0, 6)
              .map((p) => ({
                name: String(p.name).slice(0, 100),
                category: VALID_CATEGORIES.includes(p.category) ? p.category : "other",
                description: String(p.description || `Popular local spot in ${destName}`).slice(0, 300),
                lat: p.lat,
                lng: p.lng,
                avg_rating: Math.min(4.9, Math.max(4.1, Number(p.avg_rating) || 4.6)),
              }));
          }
        }
      }
    } catch (err) {
      console.warn("Gemini place discovery failed, trying Nominatim:", err);
    }
  }

  // Fallback: OpenStreetMap Nominatim web search
  try {
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        `attractions in ${destName}`
      )}&format=json&limit=5`,
      {
        headers: { "User-Agent": "WanderLens/1.0" },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (nomRes.ok) {
      const items = (await nomRes.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
        type?: string;
      }>;
      if (Array.isArray(items) && items.length > 0) {
        return items.map((item, idx) => ({
          name: item.display_name.split(",")[0].trim(),
          category: idx % 2 === 0 ? "viewpoint" : "culture",
          description: `Discovered in ${destName}: ${item.display_name}`,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          avg_rating: 4.5,
        }));
      }
    }
  } catch (err) {
    console.warn("Nominatim search failed:", err);
  }

  return [];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: destinationId } = await context.params;
    const { searchParams } = new URL(request.url);

    const categoryParam = searchParams.get("category");
    const category = (categoryParam && categoryParam !== "all"
      ? categoryParam
      : "all") as PlaceCategory | "all";
    const sortBy = (searchParams.get("sort") || "hidden_gems") as
      | "hidden_gems"
      | "top_rated"
      | "nearest";

    const userLat = searchParams.get("lat")
      ? parseFloat(searchParams.get("lat")!)
      : null;
    const userLng = searchParams.get("lng")
      ? parseFloat(searchParams.get("lng")!)
      : null;

    const supabase = await createClient();

    // 1. Fetch destination details
    const { data: destination } = await supabase
      .from("destinations")
      .select("*")
      .eq("id", destinationId)
      .single();

    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }

    // 2. Fetch places for this destination
    let placesQuery = supabase
      .from("places")
      .select("*")
      .eq("destination_id", destinationId)
      .eq("is_hidden", false);

    if (category !== "all") {
      placesQuery = placesQuery.eq("category", category);
    }

    let { data: places, error: placesError } = await placesQuery;

    if (placesError) {
      return NextResponse.json({ error: placesError.message }, { status: 500 });
    }

    // 2b. If this destination has 0 places in total, auto-populate from AI / web search
    if ((!places || places.length === 0) && category === "all") {
      const discovered = await discoverPlacesForCustomDestination(destination.name);
      if (discovered.length > 0) {
        const admin = createAdminClient();
        const rows = discovered.map((d) => ({
          destination_id: destinationId,
          name: d.name,
          category: d.category,
          location: `POINT(${d.lng} ${d.lat})`,
          description: d.description,
          avg_rating: d.avg_rating,
          n_ratings: 5,
          is_seeded: true,
          is_hidden: false,
        }));

        await admin.from("places").insert(rows as any);
        // Also update destination centre to the first place's coordinates
        await admin
          .from("destinations")
          .update({ centre: `POINT(${discovered[0].lng} ${discovered[0].lat})` } as any)
          .eq("id", destinationId);

        const refetch = await supabase
          .from("places")
          .select("*")
          .eq("destination_id", destinationId)
          .eq("is_hidden", false);
        places = refetch.data || [];
      }
    }

    if (!places || places.length === 0) {
      return NextResponse.json({
        destination,
        places: [],
        total: 0,
        hidden_gems_count: 0,
      });
    }

    // 3. Fetch 30-day activity data for these places
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

    const placeIds = places.map((p) => p.id);
    const { data: activityRows } = await supabase
      .from("place_activity_daily")
      .select("*")
      .in("place_id", placeIds)
      .gte("date", dateStr);

    const activityMap: Record<
      string,
      { posts: number; checkins: number; likes: number; comments: number }
    > = {};

    for (const p of places) {
      activityMap[p.id] = { posts: 0, checkins: 0, likes: 0, comments: 0 };
    }

    if (activityRows) {
      for (const row of activityRows) {
        if (activityMap[row.place_id]) {
          activityMap[row.place_id].posts += row.posts || 0;
          activityMap[row.place_id].checkins += row.checkins || 0;
          activityMap[row.place_id].likes += row.likes || 0;
          activityMap[row.place_id].comments += row.comments || 0;
        }
      }
    }

    // 4. Map into ranking inputs with distance calculation
    const rankingInputs: PlaceRankingInput[] = places.map((p) => {
      let distanceM: number | null = null;

      if (userLat !== null && userLng !== null && p.location) {
        try {
          const locStr = String(p.location);
          if (locStr.includes("POINT")) {
            const parts = locStr.replace("POINT(", "").replace(")", "").trim().split(" ");
            const mLng = parseFloat(parts[0]);
            const mLat = parseFloat(parts[1]);
            if (!isNaN(mLng) && !isNaN(mLat)) {
              distanceM = Math.round(calculateDistanceMetres(userLat, userLng, mLat, mLng));
            }
          }
        } catch {
          // ignore
        }
      }

      const act = activityMap[p.id];
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        destination_id: p.destination_id,
        avg_rating: Number(p.avg_rating),
        n_ratings: p.n_ratings,
        is_seeded: p.is_seeded,
        description: p.description,
        location: p.location,
        distance_m: distanceM,
        posts_30d: act.posts,
        checkins_30d: act.checkins,
        likes_30d: act.likes,
        comments_30d: act.comments,
      };
    });

    // 5. Execute ranking
    const rankedResults = rankPlaces(rankingInputs, { categoryFilter: category, sortBy });

    // 6. Fetch top photo for each place
    const { data: topPostImages } = await supabase
      .from("posts")
      .select("place_id, post_images(storage_path)")
      .in("place_id", placeIds)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });

    const photoMap: Record<string, string> = {};
    if (topPostImages) {
      for (const post of topPostImages as any[]) {
        if (!photoMap[post.place_id] && post.post_images && post.post_images.length > 0) {
          photoMap[post.place_id] = post.post_images[0].storage_path;
        }
      }
    }

    const enrichedResults = rankedResults.map((r) => ({
      ...r,
      top_photo: photoMap[r.id] || null,
    }));

    const hiddenGemsCount = enrichedResults.filter((r) => r.is_hidden_gem).length;

    return NextResponse.json({
      destination,
      places: enrichedResults,
      total: enrichedResults.length,
      hidden_gems_count: hiddenGemsCount,
    });
  } catch (err: any) {
    console.error("Recommendations API error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load recommendations" },
      { status: 500 }
    );
  }
}
