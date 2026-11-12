import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase client for use in browser/client components.
 * Call this inside a client component; do NOT call at module level.
 */
export function createClient() {
  // Strip BOM (U+FEFF) that PowerShell/Windows may prepend to Vercel env var values
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co").replace(/^\uFEFF/, "").trim();
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder").replace(/^\uFEFF/, "").trim();
  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
