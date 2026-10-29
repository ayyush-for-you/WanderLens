import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const destinationId = searchParams.get("destination_id");
    const q = searchParams.get("q") || "";

    const supabase = await createClient();
    let query = supabase
      .from("communities")
      .select("*, destinations(id, name, region), profiles(id, display_name, avatar_url)")
      .order("created_at", { ascending: false });

    if (destinationId) {
      query = query.eq("destination_id", destinationId);
    }

    if (q.trim()) {
      query = query.ilike("name", `%${q.trim()}%`);
    }

    const { data: communities, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch member counts for each community
    const communityIds = (communities || []).map((c) => c.id);
    let countsMap: Record<string, number> = {};

    if (communityIds.length > 0) {
      const { data: members } = await supabase
        .from("community_members")
        .select("community_id");

      if (members) {
        for (const m of members) {
          countsMap[m.community_id] = (countsMap[m.community_id] || 0) + 1;
        }
      }
    }

    // Check user membership status if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let myCommunities: string[] = [];
    if (user && communityIds.length > 0) {
      const { data: myMemberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      if (myMemberships) {
        myCommunities = myMemberships.map((m) => m.community_id);
      }
    }

    const enriched = (communities || []).map((c: any) => ({
      ...c,
      member_count: countsMap[c.id] || 1, // At least the owner
      is_member: myCommunities.includes(c.id),
      is_owner: user ? c.owner_id === user.id : false,
    }));

    return NextResponse.json({ communities: enriched });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch communities" },
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    if (!profile?.is_verified) {
      return NextResponse.json(
        { error: "Verify your email to create a travel community" },
        { status: 403 }
      );
    }

    const json = await request.json();
    const name = (json.name as string) || "";
    const destinationId = json.destination_id as string;
    const description = (json.description as string) || "";

    if (!name.trim() || name.length < 3 || name.length > 80) {
      return NextResponse.json(
        { error: "Community name must be between 3 and 80 characters" },
        { status: 400 }
      );
    }

    if (!destinationId) {
      return NextResponse.json(
        { error: "destination_id is required" },
        { status: 400 }
      );
    }

    // Insert community
    const { data: community, error: commError } = await supabase
      .from("communities")
      .insert({
        name: name.trim(),
        destination_id: destinationId,
        description: description.trim() || null,
        owner_id: user.id,
      })
      .select("*")
      .single();

    if (commError || !community) {
      return NextResponse.json(
        { error: commError?.message || "Failed to create community" },
        { status: 500 }
      );
    }

    // Auto-add owner as community member with role 'owner'
    await supabase.from("community_members").insert({
      community_id: community.id,
      user_id: user.id,
      role: "owner",
    });

    return NextResponse.json({ success: true, community });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create community" },
      { status: 500 }
    );
  }
}

