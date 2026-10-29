import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GROUP_LOCATION_UPDATE_INTERVAL_SECONDS } from "@/config/constants";

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

    // Verify trip is active and within window
    const { data: group } = await supabase
      .from("travel_groups")
      .select("starts_at, ends_at, status")
      .eq("id", groupId)
      .single();

    if (!group || group.status !== "active") {
      return NextResponse.json({ locations: [], message: "Trip is not active" });
    }

    const now = new Date();
    if (now < new Date(group.starts_at) || now > new Date(group.ends_at)) {
      return NextResponse.json({ locations: [], message: "Trip window has not started or has ended" });
    }

    // Verify caller is an accepted member (or mod/admin)
    const { data: membership } = await supabase
      .from("group_members")
      .select("status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAccepted = membership?.status === "accepted";
    const isModOrAdmin = profile?.role === "moderator" || profile?.role === "admin";

    if (!isAccepted && !isModOrAdmin) {
      return NextResponse.json(
        { error: "Only accepted group members can view locations" },
        { status: 403 }
      );
    }

    // Attempt RPC first, fallback to table query
    const { data: rpcData, error: rpcErr } = await supabase.rpc("get_group_active_locations", {
      p_group_id: groupId,
    });

    if (!rpcErr && rpcData) {
      return NextResponse.json({ locations: rpcData });
    }

    // Fallback: Query group_locations directly
    const { data: locRows, error: locErr } = await supabase
      .from("group_locations")
      .select("user_id, location, updated_at")
      .eq("group_id", groupId);

    if (locErr) {
      return NextResponse.json({ error: locErr.message }, { status: 500 });
    }

    // Filter to only those whose sharing_on is still TRUE
    const { data: activeSharers } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("sharing_on", true)
      .eq("status", "accepted");

    const activeUserSet = new Set((activeSharers || []).map((s) => s.user_id));
    const activeLocations = (locRows || []).filter((l) => activeUserSet.has(l.user_id));

    // Fetch user profiles for display
    const userIds = activeLocations.map((l) => l.user_id);
    let profilesMap = new Map<string, { display_name: string; avatar_url: string | null }>();

    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      if (profs) {
        for (const p of profs) {
          profilesMap.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
        }
      }
    }

    // Parse WKT POINT or format
    const parsed = activeLocations.map((l) => {
      let lat = 0;
      let lng = 0;
      if (typeof l.location === "string") {
        const match = l.location.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (match) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
        }
      }
      const prof = profilesMap.get(l.user_id);
      return {
        user_id: l.user_id,
        display_name: prof?.display_name || "Member",
        avatar_url: prof?.avatar_url || null,
        latitude: lat,
        longitude: lng,
        updated_at: l.updated_at,
      };
    });

    return NextResponse.json({ locations: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch locations" }, { status: 500 });
  }
}

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

    // Verify trip is active and within window
    const { data: group } = await supabase
      .from("travel_groups")
      .select("starts_at, ends_at, status")
      .eq("id", groupId)
      .single();

    if (!group || group.status !== "active") {
      return NextResponse.json({ error: "Trip is not active" }, { status: 400 });
    }

    const now = new Date();
    if (now < new Date(group.starts_at) || now > new Date(group.ends_at)) {
      return NextResponse.json({ error: "Trip window is outside active hours" }, { status: 400 });
    }

    // Verify member has accepted and enabled sharing
    const { data: member } = await supabase
      .from("group_members")
      .select("status, sharing_on")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!member || member.status !== "accepted" || !member.sharing_on) {
      return NextResponse.json(
        { error: "Location sharing must be enabled to send location updates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { latitude, longitude } = body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json({ error: "Valid latitude and longitude are required" }, { status: 400 });
    }

    // Check rate limit: at most once every GROUP_LOCATION_UPDATE_INTERVAL_SECONDS (10s)
    const { data: existingLoc } = await supabase
      .from("group_locations")
      .select("updated_at")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (existingLoc?.updated_at) {
      const lastUpdate = new Date(existingLoc.updated_at).getTime();
      const diffSeconds = (now.getTime() - lastUpdate) / 1000;
      if (diffSeconds < GROUP_LOCATION_UPDATE_INTERVAL_SECONDS) {
        return NextResponse.json(
          {
            error: `Location updates limited to once every ${GROUP_LOCATION_UPDATE_INTERVAL_SECONDS}s`,
            retry_after: Math.ceil(GROUP_LOCATION_UPDATE_INTERVAL_SECONDS - diffSeconds),
          },
          { status: 429 }
        );
      }
    }

    // Try RPC first
    const { error: rpcErr } = await supabase.rpc("update_group_location", {
      p_group_id: groupId,
      p_lat: latitude,
      p_lng: longitude,
    });

    if (rpcErr) {
      // Fallback: direct upsert with WKT point
      const pointWkt = `POINT(${longitude} ${latitude})`;
      const { error: upsertErr } = await supabase.from("group_locations").upsert({
        group_id: groupId,
        user_id: user.id,
        location: pointWkt,
        updated_at: now.toISOString(),
      });

      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, updated_at: now.toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update location" }, { status: 500 });
  }
}

