import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: monument, error } = await supabase
    .from("monuments")
    .select("*, destinations(id, name, region, country)")
    .eq("id", id)
    .single();

  if (error || !monument) {
    return NextResponse.json({ error: "Monument not found" }, { status: 404 });
  }

  // Fetch historic images with license metadata
  const { data: images } = await supabase
    .from("monument_images")
    .select("*")
    .eq("monument_id", id)
    .eq("kind", "historic");

  return NextResponse.json({
    monument,
    historical_image: images && images.length > 0 ? images[0] : null,
    images: images || [],
  });
}

