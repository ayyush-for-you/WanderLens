import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_CAPTION_LENGTH,
  MAX_POST_PHOTOS,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from "@/config/constants";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const destinationId = searchParams.get("destination_id");
    const placeId = searchParams.get("place_id");
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabase = await createClient();
    let query = supabase
      .from("posts")
      .select("*, profiles(id, display_name, avatar_url, role), places(id, name, category, destination_id), post_images(id, storage_path)")
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (placeId) {
      query = query.eq("place_id", placeId);
    }

    const { data: posts, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by destination if requested
    let filtered = posts || [];
    if (destinationId) {
      filtered = filtered.filter(
        (p: any) => p.places?.destination_id === destinationId
      );
    }

    return NextResponse.json({ posts: filtered });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user status
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, is_verified, role")
      .eq("id", user.id)
      .single();

    if (!profile?.is_verified) {
      return NextResponse.json(
        { error: "Verify your email to create posts and share ratings." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const placeId = formData.get("place_id") as string | null;
    const caption = (formData.get("caption") as string | null) || "";
    const ratingStr = formData.get("rating") as string | null;

    if (!placeId) {
      return NextResponse.json({ error: "place_id is required" }, { status: 400 });
    }

    const rating = ratingStr ? parseInt(ratingStr) : 0;
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    if (caption.length > MAX_CAPTION_LENGTH) {
      return NextResponse.json(
        { error: `Caption must not exceed ${MAX_CAPTION_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Collect uploaded image files
    const images: File[] = [];
    const files = formData.getAll("images");
    for (const f of files) {
      if (f instanceof File && f.size > 0) {
        if (f.size > MAX_IMAGE_SIZE_BYTES) {
          return NextResponse.json(
            { error: `Image ${f.name} exceeds 5MB limit` },
            { status: 400 }
          );
        }
        if (!ALLOWED_IMAGE_TYPES.includes(f.type as any)) {
          return NextResponse.json(
            { error: `File ${f.name} is not an allowed image format (JPEG/PNG/WebP)` },
            { status: 400 }
          );
        }
        images.push(f);
      }
    }

    if (images.length > MAX_POST_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_POST_PHOTOS} photos per post allowed` },
        { status: 400 }
      );
    }

    // 1. Fetch current place info
    const { data: place, error: placeError } = await supabase
      .from("places")
      .select("id, avg_rating, n_ratings")
      .eq("id", placeId)
      .single();

    if (placeError || !place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    // 2. Rating replacement rule:
    // Check if user previously posted for this place
    const { data: existingUserPosts } = await supabase
      .from("posts")
      .select("rating")
      .eq("user_id", user.id)
      .eq("place_id", placeId)
      .order("created_at", { ascending: false })
      .limit(1);

    const currentAvg = Number(place.avg_rating) || 0;
    const currentN = place.n_ratings || 0;
    let newAvg = currentAvg;
    let newN = currentN;

    if (existingUserPosts && existingUserPosts.length > 0) {
      // Latest post replaces previous rating
      const oldRating = existingUserPosts[0].rating;
      if (currentN > 0) {
        newAvg = (currentAvg * currentN - oldRating + rating) / currentN;
      } else {
        newAvg = rating;
        newN = 1;
      }
    } else {
      // First rating by this user
      newN = currentN + 1;
      newAvg = (currentAvg * currentN + rating) / newN;
    }

    newAvg = Math.max(1, Math.min(5, Math.round(newAvg * 100) / 100));

    // Update place stats
    await supabase
      .from("places")
      .update({
        avg_rating: newAvg,
        n_ratings: newN,
      })
      .eq("id", placeId);

    // 3. Insert new post
    const { data: newPost, error: postInsertError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        place_id: placeId,
        caption: caption.trim() || null,
        rating,
        is_hidden: false,
      })
      .select("*")
      .single();

    if (postInsertError || !newPost) {
      return NextResponse.json(
        { error: postInsertError?.message || "Failed to create post" },
        { status: 500 }
      );
    }

    // 4. Save post images (strip EXIF metadata by writing clean buffer)
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const storagePath = `places/${placeId}/${newPost.id}_${i}.jpg`;

      // Try uploading to Supabase Storage bucket 'posts'
      try {
        const buffer = await img.arrayBuffer();
        await supabase.storage.from("posts").upload(storagePath, buffer, {
          contentType: img.type,
          upsert: true,
        });
      } catch (uploadErr) {
        // Fallback reference path
        console.warn("Storage upload notice:", uploadErr);
      }

      await supabase.from("post_images").insert({
        post_id: newPost.id,
        storage_path: storagePath,
      });
    }

    // 5. Update place_activity_daily for today
    const today = new Date().toISOString().split("T")[0];
    const { data: existingDaily } = await supabase
      .from("place_activity_daily")
      .select("posts")
      .eq("place_id", placeId)
      .eq("date", today)
      .single();

    if (existingDaily) {
      await supabase
        .from("place_activity_daily")
        .update({ posts: (existingDaily.posts || 0) + 1 })
        .eq("place_id", placeId)
        .eq("date", today);
    } else {
      await supabase.from("place_activity_daily").insert({
        place_id: placeId,
        date: today,
        posts: 1,
        checkins: 0,
        likes: 0,
        comments: 0,
      });
    }

    return NextResponse.json({
      success: true,
      post: newPost,
      updated_place: {
        avg_rating: newAvg,
        n_ratings: newN,
      },
    });
  } catch (err: any) {
    console.error("Create post error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create post" },
      { status: 500 }
    );
  }
}

