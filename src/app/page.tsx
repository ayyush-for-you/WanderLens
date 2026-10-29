import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import HomeClient from "@/components/home/HomeClient";
import type { Profile } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
        <HomeClient profile={profile} />
      </main>
      <BottomNav />
    </>
  );
}
