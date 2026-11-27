import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ destinations: data || [] });
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

    const body = await request.json();
    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    const rawRegion = typeof body.region === "string" ? body.region.trim() : "";

    if (!rawName || rawName.length < 2 || rawName.length > 80) {
      return NextResponse.json(
        { error: "Destination name must be between 2 and 80 characters" },
        { status: 400 }
      );
    }

    // Reuse existing destination if it matches (case-insensitive)
    const { data: existing } = await supabase
      .from("destinations")
      .select("*")
      .ilike("name", rawName)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ destination: existing[0] });
    }

    const admin = createAdminClient();
    const { data: created, error: insertErr } = await admin
      .from("destinations")
      .insert({
        name: rawName,
        region: rawRegion || "Custom",
        country: "Custom",
        centre: "POINT(77.2090 28.6139)",
        description: "Traveller-added custom destination",
      } as any)
      .select("*")
      .single();

    if (insertErr || !created) {
      return NextResponse.json(
        { error: insertErr?.message || "Failed to create custom destination" },
        { status: 500 }
      );
    }

    return NextResponse.json({ destination: created });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create destination" },
      { status: 500 }
    );
  }
}
