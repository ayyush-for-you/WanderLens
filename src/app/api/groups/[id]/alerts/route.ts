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

    // Verify membership
    const { data: member } = await supabase
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

    const isMember = member && member.status === "accepted";
    const isModOrAdmin = profile?.role === "moderator" || profile?.role === "admin";

    if (!isMember && !isModOrAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: alerts, error } = await supabase
      .from("group_alerts")
      .select("*, profiles!group_alerts_from_user_fkey(id, display_name, avatar_url)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ alerts: alerts || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch alerts" }, { status: 500 });
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

    // Verify membership
    const { data: member } = await supabase
      .from("group_members")
      .select("status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!member || member.status !== "accepted") {
      return NextResponse.json(
        { error: "Only accepted group members can broadcast alerts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, body: alertBody, to_user } = body;

    if (!type || !["need_help", "regroup", "custom_message"].includes(type)) {
      return NextResponse.json(
        { error: "Alert type must be need_help, regroup, or custom_message" },
        { status: 400 }
      );
    }

    if (type === "custom_message" && (!alertBody || !alertBody.trim())) {
      return NextResponse.json(
        { error: "Message body is required for custom alerts" },
        { status: 400 }
      );
    }

    const { data: alert, error } = await supabase
      .from("group_alerts")
      .insert({
        group_id: groupId,
        from_user: user.id,
        to_user: to_user || null,
        type,
        body: alertBody ? alertBody.trim().slice(0, 500) : null,
      })
      .select("*, profiles!group_alerts_from_user_fkey(id, display_name, avatar_url)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ alert }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send alert" }, { status: 500 });
  }
}

