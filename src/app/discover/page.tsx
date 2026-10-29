import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import DiscoverClient from "@/components/discover/DiscoverClient";
import type { Destination, Profile } from "@/types/database";

export const metadata = {
  title: "Discover Hidden Gems",
  description:
    "Explore underrated heritage places, viewpoints, and local spots ranked transparently by community activity.",
};

export default async function DiscoverPage() {
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

  // Fetch all destinations for selector
  const { data: destinations } = await supabase
    .from("destinations")
    .select("*")
    .order("name");

  return (
    <>
      <Navbar profile={profile} />
      <main className="page-container">
        <DiscoverClient
          initialDestinations={destinations || []}
          profile={profile}
        />
      </main>
      <BottomNav />
    </>
  );
}
