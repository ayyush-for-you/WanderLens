import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Fetch groups where user is owner OR a member
    const { data: memberRows, error: memberErr } = await supabase
      .from("group_members")
      .select("group_id, status, sharing_on")
      .eq("user_id", user.id);

    if (memberErr) {
      return NextResponse.json({ error: memberErr.message }, { status: 500 });
    }

    const memberGroupIds = (memberRows || []).map((m) => m.group_id);

    const { data: ownedGroups, error: ownedErr } = await supabase
      .from("travel_groups")
      .select("*, destinations(id, name, region), profiles!travel_groups_owner_id_fkey(id, display_name, avatar_url)")
      .eq("owner_id", user.id);

    if (ownedErr) {
      return NextResponse.json({ error: ownedErr.message }, { status: 500 });
    }

    let allGroups = [...(ownedGroups || [])];

    if (memberGroupIds.length > 0) {
      const { data: joinedGroups, error: joinedErr } = await supabase
        .from("travel_groups")
        .select("*, destinations(id, name, region), profiles!travel_groups_owner_id_fkey(id, display_name, avatar_url)")
        .in("id", memberGroupIds);

      if (!joinedErr && joinedGroups) {
        const existingIds = new Set(allGroups.map((g) => g.id));
        for (const g of joinedGroups) {
          if (!existingIds.has(g.id)) {
            allGroups.push(g);
          }
        }
      }
    }

    // Sort by created_at desc
    allGroups.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Attach membership status and active status
    const membershipMap = new Map((memberRows || []).map((m) => [m.group_id, m]));
    const now = new Date();

    const enriched = allGroups.map((g: any) => {
      const membership = membershipMap.get(g.id);
      const isOwner = g.owner_id === user.id;
      const startsAt = new Date(g.starts_at);
      const endsAt = new Date(g.ends_at);
      const isTripWindowActive = g.status === "active" && startsAt <= now && endsAt >= now;

      return {
        ...g,
        is_owner: isOwner,
        membership_status: isOwner ? "accepted" : membership?.status || "invited",
        sharing_on: membership?.sharing_on || false,
        is_active_now: isTripWindowActive,
      };
    });

    return NextResponse.json({ groups: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
        { error: "Verify your email to create travel groups" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, destination_id, starts_at, ends_at, community_id, invited_user_ids } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: "Group name max 100 characters" }, { status: 400 });
    }

    if (!destination_id) {
      return NextResponse.json({ error: "Destination is required" }, { status: 400 });
    }

    if (!starts_at || !ends_at) {
      return NextResponse.json({ error: "Trip start and end times are required" }, { status: 400 });
    }

    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format for trip window" }, { status: 400 });
    }

    if (endDate <= startDate) {
      return NextResponse.json({ error: "Trip end time must be after start time" }, { status: 400 });
    }

    // Verify destination exists
    const { data: destination } = await supabase
      .from("destinations")
      .select("id")
      .eq("id", destination_id)
      .single();

    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }

    // Filter blocked users if any invited
    let validInvites: string[] = [];
    if (Array.isArray(invited_user_ids) && invited_user_ids.length > 0) {
      const candidates = invited_user_ids.filter((uid: string) => uid && uid !== user.id);

      // Check blocks in either direction
      const { data: blocks } = await supabase
        .from("blocks")
        .select("blocker_id, blocked_id")
        .or(
          `and(blocker_id.eq.${user.id},blocked_id.in.(${candidates.join(",")})),and(blocked_id.eq.${user.id},blocker_id.in.(${candidates.join(",")}))`
        );

      const blockedSet = new Set<string>();
      if (blocks) {
        for (const b of blocks) {
          blockedSet.add(b.blocker_id === user.id ? b.blocked_id : b.blocker_id);
        }
      }

      validInvites = candidates.filter((uid) => !blockedSet.has(uid));
    }

    // Insert group
    const { data: newGroup, error: groupErr } = await supabase
      .from("travel_groups")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        destination_id,
        community_id: community_id || null,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        status: "active",
      })
      .select("*, destinations(id, name, region)")
      .single();

    if (groupErr || !newGroup) {
      return NextResponse.json({ error: groupErr?.message || "Failed to create group" }, { status: 500 });
    }

    // Insert owner as accepted member
    await supabase.from("group_members").insert({
      group_id: newGroup.id,
      user_id: user.id,
      status: "accepted",
      sharing_on: false,
    });

    // Insert invites with status 'invited' (consent required, never auto-enrolled)
    if (validInvites.length > 0) {
      const inviteRows = validInvites.map((uid) => ({
        group_id: newGroup.id,
        user_id: uid,
        status: "invited" as const,
        sharing_on: false,
      }));
      await supabase.from("group_members").insert(inviteRows);
    }

    return NextResponse.json({ group: newGroup }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create group" }, { status: 500 });
  }
}

