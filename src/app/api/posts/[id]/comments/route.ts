import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await context.params;
    const supabase = await createClient();

    const { data: comments, error } = await supabase
      .from("comments")
      .select("*, profiles(id, display_name, avatar_url, role)")
      .eq("post_id", postId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

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
        { error: "Verify your email to write comments" },
        { status: 403 }
      );
    }

    const json = await request.json();
    const body = (json.body as string) || "";

    if (!body.trim() || body.length > 1000) {
      return NextResponse.json(
        { error: "Comment must be between 1 and 1000 characters" },
        { status: 400 }
      );
    }

    // Get place_id
    const { data: post } = await supabase
      .from("posts")
      .select("place_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Insert comment
    const { data: newComment, error: commentError } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        body: body.trim(),
        is_hidden: false,
      })
      .select("*, profiles(id, display_name, avatar_url, role)")
      .single();

    if (commentError) {
      return NextResponse.json({ error: commentError.message }, { status: 500 });
    }

    // Increment comments on place_activity_daily
    const today = new Date().toISOString().split("T")[0];
    const { data: daily } = await supabase
      .from("place_activity_daily")
      .select("comments")
      .eq("place_id", post.place_id)
      .eq("date", today)
      .single();

    if (daily) {
      await supabase
        .from("place_activity_daily")
        .update({ comments: (daily.comments || 0) + 1 })
        .eq("place_id", post.place_id)
        .eq("date", today);
    } else {
      await supabase.from("place_activity_daily").insert({
        place_id: post.place_id,
        date: today,
        posts: 0,
        checkins: 0,
        likes: 0,
        comments: 1,
      });
    }

    return NextResponse.json({ success: true, comment: newComment });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to post comment" },
      { status: 500 }
    );
  }
}

