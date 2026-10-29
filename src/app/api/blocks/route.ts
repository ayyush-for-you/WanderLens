import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: blocks, error } = await supabase
      .from("blocks")
      .select("blocked_id, created_at, profiles!blocks_blocked_id_fkey(id, display_name, avatar_url)")
      .eq("blocker_id", user.id);

    if (error) {
      // Fallback query if relation fkey naming differs
      const { data: rawBlocks } = await supabase
        .from("blocks")
        .select("blocked_id, created_at")
        .eq("blocker_id", user.id);

      return NextResponse.json({ blocks: rawBlocks || [] });
    }

    return NextResponse.json({ blocks: blocks || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch blocked users" },
      { status: 500 }
    );
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

    const json = await request.json();
    const targetUserId = json.blocked_id as string;

    if (!targetUserId) {
      return NextResponse.json({ error: "blocked_id is required" }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 });
    }

    const { error: blockError } = await supabase.from("blocks").insert({
      blocker_id: user.id,
      blocked_id: targetUserId,
    });

    if (blockError && !blockError.message.includes("duplicate")) {
      return NextResponse.json({ error: blockError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User blocked. You will no longer see their messages or posts.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to block user" },
      { status: 500 }
    );
  }
}

