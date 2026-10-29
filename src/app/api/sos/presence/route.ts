import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
        { error: "Verify your email to opt into nearby SOS alerts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { opt_in, latitude, longitude } = body;

    if (opt_in) {
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return NextResponse.json(
          { error: "Valid latitude and longitude required to opt in" },
          { status: 400 }
        );
      }

      // Try RPC first
      const { error: rpcErr } = await supabase.rpc("update_user_presence", {
        p_lat: latitude,
        p_lng: longitude,
      });

      if (rpcErr) {
        // Fallback: round coordinates to 3 decimal places (~100m coarse)
        const coarseLat = Math.round(latitude * 1000) / 1000;
        const coarseLng = Math.round(longitude * 1000) / 1000;
        const pointWkt = `POINT(${coarseLng} ${coarseLat})`;
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        await supabase.from("user_presence").upsert({
          user_id: user.id,
          coarse_location: pointWkt,
          expires_at: expiresAt,
        });

        await supabase.from("profiles").update({ sos_opt_in: true }).eq("id", user.id);
      }

      return NextResponse.json({ success: true, opted_in: true });
    } else {
      // Opt out: delete presence record and toggle flag
      await supabase.from("user_presence").delete().eq("user_id", user.id);
      await supabase.from("profiles").update({ sos_opt_in: false }).eq("id", user.id);

      return NextResponse.json({ success: true, opted_in: false });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update SOS presence" }, { status: 500 });
  }
}

