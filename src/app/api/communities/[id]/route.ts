import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await context.params;
    const supabase = await createClient();

    const { data: community, error: commError } = await supabase
      .from("communities")
      .select("*, destinations(id, name, region), profiles(id, display_name, avatar_url)")
      .eq("id", communityId)
      .single();

    if (commError || !community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Fetch members
    const { data: members } = await supabase
      .from("community_members")
      .select("community_id, user_id, role, joined_at, profiles(id, display_name, avatar_url, role)")
      .eq("community_id", communityId)
      .order("joined_at", { ascending: true });

    // Check user membership
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isMember = user
      ? (members || []).some((m) => m.user_id === user.id)
      : false;
    const isOwner = user ? community.owner_id === user.id : false;

    return NextResponse.json({
      community,
      members: members || [],
      member_count: members?.length || 0,
      is_member: isMember,
      is_owner: isOwner,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load community" },
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data: community } = await supabase
      .from("communities")
      .select("owner_id")
      .eq("id", communityId)
      .single();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const canDelete =
      community.owner_id === user.id || profile?.role === "admin";

    if (!canDelete) {
      return NextResponse.json(
        { error: "Only the community creator or platform admin can delete it" },
        { status: 403 }
      );
    }

    await supabase.from("communities").delete().eq("id", communityId);
    return NextResponse.json({ success: true, message: "Community deleted" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete community" },
      { status: 500 }
    );
  }
}

