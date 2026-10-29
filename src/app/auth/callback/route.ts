import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Auth callback route — handles email confirmation redirects from Supabase.
 * Supabase redirects here after the user clicks the verification link.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // The handle_user_updated trigger will set is_verified = TRUE automatically.
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Something went wrong — redirect to login with an error hint
  return NextResponse.redirect(
    new URL("/login?error=verification_failed", request.url)
  );
}
