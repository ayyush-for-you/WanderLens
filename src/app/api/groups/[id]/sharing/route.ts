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

    const body = await request.json();
    const { sharing_on } = body;

    if (typeof sharing_on !== "boolean") {
      return NextResponse.json({ error: "sharing_on must be a boolean" }, { status: 400 });
    }

    // Verify membership
    const { data: member } = await supabase
      .from("group_members")
      .select("status, sharing_on")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!member || member.status !== "accepted") {
      return NextResponse.json(
        { error: "Only accepted group members can enable location sharing" },
        { status: 403 }
      );
    }

    // If enabling, verify trip window is active
    if (sharing_on) {
      const { data: group } = await supabase
        .from("travel_groups")
        .select("starts_at, ends_at, status")
        .eq("id", groupId)
        .single();

      if (!group || group.status !== "active") {
        return NextResponse.json({ error: "This trip is not currently active" }, { status: 400 });
      }

      const now = new Date();
      const startsAt = new Date(group.starts_at);
      const endsAt = new Date(group.ends_at);

      if (now < startsAt || now > endsAt) {
        return NextResponse.json(
          { error: "Location sharing is only available during the scheduled trip window" },
          { status: 400 }
        );
      }
    } else {
      // If turning off sharing, remove location row immediately
      await supabase
        .from("group_locations")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);
    }

    // Update member record
    const { data: updated, error } = await supabase
      .from("group_members")
      .update({ sharing_on })
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, sharing_on: updated.sharing_on });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update sharing status" }, { status: 500 });
  }
}

