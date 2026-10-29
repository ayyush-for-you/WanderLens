import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ProfileClient from "@/components/profile/ProfileClient";
import type { Profile } from "@/types/database";

export const metadata = { title: "Profile & Settings" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/login");

  return (
    <>
      <Navbar profile={profile} />
      <main className="page-container">
        <ProfileClient profile={profile} email={user.email ?? ""} />
      </main>
      <BottomNav />
    </>
  );
}
