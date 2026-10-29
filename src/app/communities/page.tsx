import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import CommunitiesClient from "@/components/communities/CommunitiesClient";
import type { Profile } from "@/types/database";

export const metadata = {
  title: "Travel Communities",
  description: "Connect with travellers, coordinate trips, and chat in destination communities.",
};

export default async function CommunitiesPage() {
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

  const { data: destinations } = await supabase
    .from("destinations")
    .select("*")
    .order("name");

  return (
    <>
      <Navbar profile={profile} />
      <main className="page-container">
        <CommunitiesClient
          initialDestinations={destinations || []}
          profile={profile}
        />
      </main>
      <BottomNav />
    </>
  );
}
