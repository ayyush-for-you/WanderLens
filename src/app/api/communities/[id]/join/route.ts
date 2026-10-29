import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    if (!profile?.is_verified) {
      return NextResponse.json(
        { error: "Verify your email to join destination communities" },
        { status: 403 }
      );
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("community_members")
      .select("*")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: "Already a member" });
    }

    // Check if community exists
    const { data: community } = await supabase
      .from("communities")
      .select("id")
      .eq("id", communityId)
      .single();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Insert member
    const { error: insertError } = await supabase
      .from("community_members")
      .insert({
        community_id: communityId,
        user_id: user.id,
        role: "member",
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Joined community" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to join community" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prevent owner from abandoning community without deleting
    const { data: community } = await supabase
      .from("communities")
      .select("owner_id")
      .eq("id", communityId)
      .single();

    if (community?.owner_id === user.id) {
      return NextResponse.json(
        { error: "Community owners cannot leave their community. Delete it instead." },
        { status: 400 }
      );
    }

    await supabase
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, message: "Left community" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to leave community" },
      { status: 500 }
    );
  }
}

