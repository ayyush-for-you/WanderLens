import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const query = typeof body.query === "string" ? body.query.trim() : "";

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Enter a display name or email address to invite" },
        { status: 400 }
      );
    }

    // Check group exists and requester is owner or accepted member
    const { data: group } = await supabase
      .from("travel_groups")
      .select("id, owner_id")
      .eq("id", groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isOwner = group.owner_id === user.id;
    if (!isOwner) {
      const { data: membership } = await supabase
        .from("group_members")
        .select("status")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

      if (membership?.status !== "accepted") {
        return NextResponse.json(
          { error: "Only group members can invite others" },
          { status: 403 }
        );
      }
    }

    const admin = createAdminClient();
    let targetUserId: string | null = null;
    let targetDisplayName = query;

    // 1. If query looks like an email, look up via auth admin
    if (query.includes("@")) {
      const { data: usersData } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const matchedUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === query.toLowerCase()
      );
      if (matchedUser) {
        targetUserId = matchedUser.id;
        targetDisplayName =
          (matchedUser.user_metadata?.display_name as string) ||
          matchedUser.email ||
          query;
      }
    }

    // 2. Otherwise (or if email lookup didn't match), search profiles by display_name
    if (!targetUserId) {
      const { data: matchedProfiles } = await admin
        .from("profiles")
        .select("id, display_name")
        .ilike("display_name", query)
        .limit(1);

      if (matchedProfiles && matchedProfiles.length > 0) {
        targetUserId = matchedProfiles[0].id;
        targetDisplayName = matchedProfiles[0].display_name || query;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: `No user found matching "${query}"` },
        { status: 404 }
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "You are already in this group" },
        { status: 400 }
      );
    }

    // Check blocks in either direction
    const { data: blocks } = await admin
      .from("blocks")
      .select("blocker_id, blocked_id")
      .or(
        `and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id})`
      );

    if (blocks && blocks.length > 0) {
      return NextResponse.json(
        { error: "Cannot invite this user due to block settings" },
        { status: 403 }
      );
    }

    // Check existing membership
    const { data: existingMember } = await admin
      .from("group_members")
      .select("status")
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .single();

    if (existingMember?.status === "accepted") {
      return NextResponse.json(
        { error: `${targetDisplayName} is already a member of this group` },
        { status: 400 }
      );
    }

    if (existingMember?.status === "invited") {
      return NextResponse.json(
        { error: `${targetDisplayName} has already been invited` },
        { status: 400 }
      );
    }

    const { error: insertErr } = await admin
      .from("group_members")
      .upsert(
        {
          group_id: groupId,
          user_id: targetUserId,
          status: "invited",
          sharing_on: false,
        } as any,
        { onConflict: "group_id,user_id" }
      );

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invited: { user_id: targetUserId, display_name: targetDisplayName },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to invite member" },
      { status: 500 }
    );
  }
}
