import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    if (!profile?.is_verified) {
      return NextResponse.json(
        { error: "Verify your email to like posts" },
        { status: 403 }
      );
    }

    // Check if post exists
    const { data: post } = await supabase
      .from("posts")
      .select("id, place_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("post_likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    const today = new Date().toISOString().split("T")[0];
    let isLiked = false;

    if (existingLike) {
      // Unlike
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
      isLiked = false;
    } else {
      // Like
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: user.id,
      });
      isLiked = true;

      // Increment likes on place_activity_daily
      const { data: daily } = await supabase
        .from("place_activity_daily")
        .select("likes")
        .eq("place_id", post.place_id)
        .eq("date", today)
        .single();

      if (daily) {
        await supabase
          .from("place_activity_daily")
          .update({ likes: (daily.likes || 0) + 1 })
          .eq("place_id", post.place_id)
          .eq("date", today);
      } else {
        await supabase.from("place_activity_daily").insert({
          place_id: post.place_id,
          date: today,
          posts: 0,
          checkins: 0,
          likes: 1,
          comments: 0,
        });
      }
    }

    // Count total likes
    const { count } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    return NextResponse.json({
      success: true,
      is_liked: isLiked,
      likes_count: count || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update like status" },
      { status: 500 }
    );
  }
}

