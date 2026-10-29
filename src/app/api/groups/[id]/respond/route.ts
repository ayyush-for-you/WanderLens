import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await context.params;
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
      return NextResponse.json({ error: "Verify your email to join travel groups" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body; // "accept" | "decline" | "leave"

    if (!["accept", "decline", "leave"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be accept, decline, or leave" }, { status: 400 });
    }

    // Check membership
    const { data: membership } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "You are not an invited or existing member of this group" }, { status: 404 });
    }

    if (action === "accept") {
      const { data: updated, error } = await supabase
        .from("group_members")
        .update({ status: "accepted" })
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, member: updated });
    }

    // decline or leave
    // 1. Purge user location from group_locations immediately
    await supabase
      .from("group_locations")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    // 2. Set status to left and sharing_on to false
    const { data: updated, error } = await supabase
      .from("group_members")
      .update({ status: "left", sharing_on: false })
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, member: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to respond to group invitation" }, { status: 500 });
  }
}

