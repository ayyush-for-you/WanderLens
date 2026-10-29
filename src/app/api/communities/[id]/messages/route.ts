import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CHAT_RATE_LIMIT_PER_MINUTE } from "@/config/constants";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch community messages
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*, profiles(id, display_name, avatar_url, role)")
      .eq("community_id", communityId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Server-side blocking enforcement:
    // If user is authenticated, query mutual blocks
    let blockedUserIds: string[] = [];
    if (user) {
      const { data: blocks } = await supabase
        .from("blocks")
        .select("blocker_id, blocked_id")
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

      if (blocks) {
        for (const b of blocks) {
          if (b.blocker_id === user.id) blockedUserIds.push(b.blocked_id);
          if (b.blocked_id === user.id) blockedUserIds.push(b.blocker_id);
        }
      }
    }

    // Filter out messages from blocked users
    const filteredMessages = (messages || []).filter(
      (m: any) => !blockedUserIds.includes(m.user_id)
    );

    return NextResponse.json({
      messages: filteredMessages,
      total: filteredMessages.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 1. Verified check
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    if (!profile?.is_verified) {
      return NextResponse.json(
        { error: "Verify your email to participate in community chat" },
        { status: 403 }
      );
    }

    // 2. Community membership check
    const { data: membership } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "You must join this community before sending messages" },
        { status: 403 }
      );
    }

    // 3. Rate limiting (20 messages/min)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: recentMessagesCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneMinuteAgo);

    if (recentMessagesCount && recentMessagesCount >= CHAT_RATE_LIMIT_PER_MINUTE) {
      return NextResponse.json(
        {
          error: `Chat rate limit reached (max ${CHAT_RATE_LIMIT_PER_MINUTE} messages per minute). Please slow down.`,
        },
        { status: 429 }
      );
    }

    const json = await request.json();
    const body = (json.body as string) || "";

    if (!body.trim() || body.length > 2000) {
      return NextResponse.json(
        { error: "Message must be between 1 and 2000 characters" },
        { status: 400 }
      );
    }

    // 4. Insert message
    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert({
        community_id: communityId,
        user_id: user.id,
        body: body.trim(),
        is_hidden: false,
      })
      .select("*, profiles(id, display_name, avatar_url, role)")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

