import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // 1. Fetch place
    const { data: place, error: placeError } = await supabase
      .from("places")
      .select("*, destinations(id, name, region, country)")
      .eq("id", id)
      .single();

    if (placeError || !place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    // 2. Fetch posts for this place with author profile and post images
    const { data: posts } = await supabase
      .from("posts")
      .select("*, profiles(id, display_name, avatar_url, role), post_images(id, storage_path)")
      .eq("place_id", id)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });

    // 3. Check likes for current user (if logged in)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userLikes: string[] = [];
    if (user && posts && posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      if (likes) {
        userLikes = likes.map((l) => l.post_id);
      }
    }

    // 4. Fetch comment counts
    const postIds = (posts || []).map((p) => p.id);
    let commentsCountMap: Record<string, number> = {};
    if (postIds.length > 0) {
      const { data: comments } = await supabase
        .from("comments")
        .select("id, post_id")
        .in("post_id", postIds)
        .eq("is_hidden", false);

      if (comments) {
        for (const c of comments) {
          commentsCountMap[c.post_id] = (commentsCountMap[c.post_id] || 0) + 1;
        }
      }
    }

    const enrichedPosts = (posts || []).map((p: any) => ({
      ...p,
      is_liked_by_me: userLikes.includes(p.id),
      comments_count: commentsCountMap[p.id] || 0,
    }));

    return NextResponse.json({
      place,
      posts: enrichedPosts,
      total_posts: enrichedPosts.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load place details" },
      { status: 500 }
    );
  }
}

