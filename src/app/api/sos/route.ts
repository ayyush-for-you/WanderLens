import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SOS_RATE_LIMIT_PER_HOUR, SOS_RADIUS_METRES } from "@/config/constants";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 1. Fetch user's own active SOS alerts
    const { data: myAlerts } = await supabase
      .from("sos_alerts")
      .select("*, sos_responses(helper_id, responded_at, profiles(id, display_name, avatar_url))")
      .eq("sender_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    // 2. Fetch incoming nearby alerts via RPC
    const { data: incomingRpc, error: rpcErr } = await supabase.rpc("get_incoming_sos_alerts");

    let incoming = incomingRpc || [];

    // Fallback if RPC not loaded in local dev
    if (rpcErr) {
      const { data: fallbackAlerts } = await supabase
        .from("sos_alerts")
        .select("id, sender_id, note, created_at, status, profiles(display_name)")
        .eq("status", "active")
        .neq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      incoming = (fallbackAlerts || []).map((a: any) => ({
        id: a.id,
        sender_display_name: a.profiles?.display_name || "Nearby Traveller",
        note: a.note,
        approx_distance_m: 650, // simulated fallback
        created_at: a.created_at,
        has_responded: false,
        latitude: null,
        longitude: null,
      }));
    }

    // 3. Check user's opt-in status and active presence
    const { data: profile } = await supabase
      .from("profiles")
      .select("sos_opt_in, is_verified")
      .eq("id", user.id)
      .single();

    const { data: presence } = await supabase
      .from("user_presence")
      .select("expires_at")
      .eq("user_id", user.id)
      .single();

    const isPresenceActive = presence ? new Date(presence.expires_at) > new Date() : false;

    return NextResponse.json({
      my_active_sos: myAlerts && myAlerts.length > 0 ? myAlerts[0] : null,
      incoming_alerts: incoming,
      sos_opt_in: profile?.sos_opt_in || false,
      is_presence_active: isPresenceActive,
      is_verified: profile?.is_verified || false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch SOS status" }, { status: 500 });
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
        { error: "Only email-verified users can trigger SOS alerts" },
        { status: 403 }
      );
    }

    // Check rate limit: max SOS_RATE_LIMIT_PER_HOUR (3) per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countErr } = await supabase
      .from("sos_alerts")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .gte("created_at", oneHourAgo);

    if (count !== null && count >= SOS_RATE_LIMIT_PER_HOUR) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Maximum ${SOS_RATE_LIMIT_PER_HOUR} SOS alerts allowed per hour. Excess attempts are rejected.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { latitude, longitude, note } = body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json({ error: "Valid GPS coordinates are required" }, { status: 400 });
    }

    // Try RPC first
    const { data: rpcData, error: rpcErr } = await supabase.rpc("create_sos_alert", {
      p_lat: latitude,
      p_lng: longitude,
      p_note: note ? note.trim().slice(0, 200) : null,
    });

    if (!rpcErr && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      return NextResponse.json({ alert: rpcData[0] }, { status: 201 });
    }

    // Fallback: direct insert with PostGIS point
    const pointWkt = `POINT(${longitude} ${latitude})`;
    const { data: newAlert, error: insertErr } = await supabase
      .from("sos_alerts")
      .insert({
        sender_id: user.id,
        coarse_location: pointWkt,
        note: note ? note.trim().slice(0, 200) : null,
        status: "active",
        recipient_count: 0,
      })
      .select()
      .single();

    if (insertErr || !newAlert) {
      return NextResponse.json({ error: insertErr?.message || "Failed to create SOS alert" }, { status: 500 });
    }

    return NextResponse.json({ alert: newAlert }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to trigger SOS" }, { status: 500 });
  }
}
