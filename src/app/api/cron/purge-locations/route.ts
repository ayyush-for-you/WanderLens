import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Call the database function to purge locations for groups ended > 24h
    const { error } = await supabase.rpc("purge_ended_group_locations");

    if (error) {
      // Fallback direct cleanup if RPC not installed
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: endedGroups } = await supabase
        .from("travel_groups")
        .select("id")
        .or(`ends_at.lt.${cutoff},status.in.(ended,cancelled)`);

      if (endedGroups && endedGroups.length > 0) {
        const groupIds = (endedGroups as Array<{ id: string }>).map((g) => g.id);
        await supabase.from("group_locations").delete().in("group_id", groupIds);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Purged locations for ended groups older than 24h or marked ended",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to purge locations" }, { status: 500 });
  }
}
