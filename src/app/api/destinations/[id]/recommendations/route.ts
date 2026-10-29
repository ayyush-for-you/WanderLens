import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      );
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

    const { data: places, error: placesError } = await placesQuery;

    if (placesError) {
      return NextResponse.json({ error: placesError.message }, { status: 500 });
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

    // Sum activity per place
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
            const parts = locStr
              .replace("POINT(", "")
              .replace(")", "")
              .trim()
              .split(" ");
            const mLng = parseFloat(parts[0]);
            const mLat = parseFloat(parts[1]);
            if (!isNaN(mLng) && !isNaN(mLat)) {
              distanceM = Math.round(
                calculateDistanceMetres(userLat, userLng, mLat, mLng)
              );
            }
          }
        } catch {
          // ignore coordinate parse error
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
    const rankedResults = rankPlaces(rankingInputs, {
      categoryFilter: category,
      sortBy,
    });

    // 6. Fetch top photo for each place (if available from posts)
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

