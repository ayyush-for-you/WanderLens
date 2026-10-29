import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Check if user is author or moderator/admin
    const { data: post } = await supabase
      .from("posts")
      .select("user_id, place_id")
      .eq("id", id)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAuthorized =
      post.user_id === user.id ||
      profile?.role === "moderator" ||
      profile?.role === "admin";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "You do not have permission to delete this post" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Post deleted" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete post" },
      { status: 500 }
    );
  }
}

