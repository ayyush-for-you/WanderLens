import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const supabase = await createClient();
  let query = supabase
    .from("monuments")
    .select("id, name, built_year, builder, style, destinations(id, name, region)")
    .eq("is_published", true)
    .order("name");

  if (q.trim()) {
    query = query.ilike("name", `%${q.trim()}%`);
  }

  const { data, error } = await query.limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ monuments: data || [] });
}

