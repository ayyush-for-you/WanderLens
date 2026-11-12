import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase client for use in browser/client components.
 * Call this inside a client component; do NOT call at module level.
 */
export function createClient() {
  // Strip BOM and any non-printable/non-ASCII characters that
  // PowerShell/Windows may embed anywhere in Vercel env var values.
  // Using /[^\x20-\x7E]/g catches U+FEFF, curly quotes, en/em dashes, etc.
  function sanitize(s: string) {
    return s.replace(/[^\x20-\x7E]/g, "").trim();
  }
  const supabaseUrl = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co");
  const supabaseKey = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder");
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
