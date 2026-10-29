import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ModeratorClient from "@/components/moderator/ModeratorClient";
import type { Profile } from "@/types/database";

export const metadata = { title: "Moderator Queue" };

export default async function ModeratorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/moderator");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) {
    redirect("/");
  }

  const { data: reports } = await supabase
    .from("reports")
    .select("*, profiles!reporter_id(display_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <Navbar profile={profile} />
      <main style={{ paddingTop: 64 }}>
        <ModeratorClient
          currentProfile={profile}
          initialReports={reports ?? []}
        />
      </main>
    </>
  );
}
