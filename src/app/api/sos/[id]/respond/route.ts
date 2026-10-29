import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sosId } = await context.params;
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
        { error: "Only email-verified users can respond to SOS alerts" },
        { status: 403 }
      );
    }

    // Check alert exists and is active
    const { data: alert } = await supabase
      .from("sos_alerts")
      .select("id, sender_id, status, coarse_location, profiles!sos_alerts_sender_id_fkey(display_name)")
      .eq("id", sosId)
      .single();

    if (!alert || alert.status !== "active") {
      return NextResponse.json({ error: "This SOS alert is no longer active" }, { status: 404 });
    }

    // Insert response (upsert pattern)
    const { error: respErr } = await supabase.from("sos_responses").upsert({
      sos_id: sosId,
      helper_id: user.id,
      responded_at: new Date().toISOString(),
    });

    if (respErr) {
      return NextResponse.json({ error: respErr.message }, { status: 500 });
    }

    // Parse coordinates from coarse_location
    let lat = null;
    let lng = null;
    if (typeof alert.coarse_location === "string") {
      const match = alert.coarse_location.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (match) {
        lng = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Response recorded. Sender location revealed.",
      sender_name: (alert as any).profiles?.display_name || "Traveller",
      latitude: lat,
      longitude: lng,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to respond to SOS" }, { status: 500 });
  }
}

