import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import GroupLiveMapClient from "@/components/groups/GroupLiveMapClient";
import type { Profile } from "@/types/database";

export const metadata: Metadata = {
  title: "Live Group Radar",
  description: "Live location radar and alerts for travel group members",
};

export default async function GroupLivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      <GroupLiveMapClient groupId={id} />
      <BottomNav />
    </>
  );
}
