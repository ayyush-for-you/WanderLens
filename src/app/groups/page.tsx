import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import GroupsClient from "@/components/groups/GroupsClient";
import type { Destination, Profile } from "@/types/database";

export const metadata: Metadata = {
  title: "Travel Groups",
  description: "Live location radar and alerts for travel groups during active trips",
};

export default async function GroupsPage() {
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
        <GroupsClient initialDestinations={(destinations as Destination[]) || []} />
      </main>
      <BottomNav />
    </>
  );
}
