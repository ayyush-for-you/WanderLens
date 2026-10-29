import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ScanClient from "@/components/scan/ScanClient";
import type { Profile } from "@/types/database";

export const metadata = {
  title: "Monument Scanner",
  description: "Identify heritage monuments with AI camera scan, learn their history, and view historical photos.",
};

export default async function ScanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <>
      <Navbar profile={profile} />
      <main className="page-container">
        <ScanClient profile={profile} />
      </main>
      <BottomNav />
    </>
  );
}
