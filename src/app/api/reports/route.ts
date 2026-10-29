import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReportTargetType } from "@/types/database";

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
        { error: "Verify your email to report content" },
        { status: 403 }
      );
    }

    const json = await request.json();
    const targetType = json.target_type as ReportTargetType;
    const targetId = json.target_id as string;
    const reason = (json.reason as string) || "";

    if (!targetType || !targetId || !reason.trim()) {
      return NextResponse.json(
        { error: "target_type, target_id, and reason are required" },
        { status: 400 }
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        { error: "Reason cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    // Insert into reports table
    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason: reason.trim(),
        status: "open",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Report submitted to moderation queue",
      report_id: report.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to submit report" },
      { status: 500 }
    );
  }
}

