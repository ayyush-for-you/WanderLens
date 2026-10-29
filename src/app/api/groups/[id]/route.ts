import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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

    // Fetch group
    const { data: group, error: groupErr } = await supabase
      .from("travel_groups")
      .select("*, destinations(id, name, region), profiles!travel_groups_owner_id_fkey(id, display_name, avatar_url)")
      .eq("id", groupId)
      .single();

    if (groupErr || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Fetch members
    const { data: members, error: memErr } = await supabase
      .from("group_members")
      .select("group_id, user_id, status, sharing_on, joined_at, profiles(id, display_name, avatar_url)")
      .eq("group_id", groupId);

    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }

    // Check user role for moderation override
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isModOrAdmin = profile?.role === "moderator" || profile?.role === "admin";
    const myMembership = members?.find((m) => m.user_id === user.id);
    const isOwner = group.owner_id === user.id;

    if (!isOwner && !myMembership && !isModOrAdmin) {
      return NextResponse.json({ error: "Access denied. You are not a member of this group." }, { status: 403 });
    }

    const now = new Date();
    const startsAt = new Date(group.starts_at);
    const endsAt = new Date(group.ends_at);
    const isTripWindowActive = group.status === "active" && startsAt <= now && endsAt >= now;

    return NextResponse.json({
      group: {
        ...group,
        is_owner: isOwner,
        is_active_now: isTripWindowActive,
        my_membership: myMembership || (isOwner ? { status: "accepted", sharing_on: false } : null),
        members: members || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch group" }, { status: 500 });
  }
}

export async function PATCH(
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

    // Check ownership or admin
    const { data: group } = await supabase
      .from("travel_groups")
      .select("id, owner_id, status")
      .eq("id", groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";
    if (group.owner_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Only the group owner or admin can update this group" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.name && typeof body.name === "string") {
      updates.name = body.name.trim();
    }

    if (body.status && ["active", "ended", "cancelled"].includes(body.status)) {
      updates.status = body.status;
    }

    if (body.starts_at) {
      updates.starts_at = new Date(body.starts_at).toISOString();
    }

    if (body.ends_at) {
      updates.ends_at = new Date(body.ends_at).toISOString();
    }

    const { data: updated, error } = await supabase
      .from("travel_groups")
      .update(updates)
      .eq("id", groupId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If trip ended or cancelled, purge location rows immediately
    if (updates.status === "ended" || updates.status === "cancelled") {
      await supabase.from("group_locations").delete().eq("group_id", groupId);
      // Turn sharing_on to false for all members
      await supabase.from("group_members").update({ sharing_on: false }).eq("group_id", groupId);
    }

    return NextResponse.json({ group: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(
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

    const { data: group } = await supabase
      .from("travel_groups")
      .select("id, owner_id")
      .eq("id", groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (group.owner_id !== user.id && profile?.role !== "admin") {
      return NextResponse.json({ error: "Only the owner or admin can delete this group" }, { status: 403 });
    }

    // Delete locations first (also handled by ON DELETE CASCADE)
    await supabase.from("group_locations").delete().eq("group_id", groupId);
    const { error } = await supabase.from("travel_groups").delete().eq("id", groupId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Group deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete group" }, { status: 500 });
  }
}

