import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
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

    // Verify ownership
    const { data: alert } = await supabase
      .from("sos_alerts")
      .select("id, sender_id, status")
      .eq("id", sosId)
      .single();

    if (!alert) {
      return NextResponse.json({ error: "SOS alert not found" }, { status: 404 });
    }

    if (alert.sender_id !== user.id) {
      return NextResponse.json({ error: "Only the sender can update the SOS status" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body; // 'resolved' | 'false_alarm'

    if (!["resolved", "false_alarm"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'resolved' or 'false_alarm'" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from("sos_alerts")
      .update({
        status,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", sosId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If marked false_alarm, check false alarm count in last 30 days
    if (status === "false_alarm") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("sos_alerts")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", user.id)
        .eq("status", "false_alarm")
        .gte("created_at", thirtyDaysAgo);

      // Flag for moderator review if >= 3 false alarms per PRD
      if (count !== null && count >= 3) {
        await supabase.from("reports").insert({
          reporter_id: user.id, // automated system flag
          target_type: "user",
          target_id: user.id,
          reason: "repeated_false_alarms",
          details: `User has triggered ${count} false alarms within the last 30 days. Auto-flagged for review.`,
          status: "open",
        });
      }
    }

    return NextResponse.json({ success: true, alert: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to resolve SOS" }, { status: 500 });
  }
}
