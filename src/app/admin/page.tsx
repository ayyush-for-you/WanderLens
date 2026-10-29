import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AdminClient from "@/components/admin/AdminClient";
import type { Profile } from "@/types/database";

export const metadata = { title: "Admin Console" };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || profile.role !== "admin") redirect("/");

  // Fetch initial data for admin
  const [
    { data: destinations },
    { data: places },
    { data: monuments },
    { data: profiles },
    { data: monumentImages },
  ] = await Promise.all([
    supabase.from("destinations").select("*").order("name"),
    supabase.from("places").select("*, destinations(name)").order("name"),
    supabase.from("monuments").select("*, destinations(name)").order("name"),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("monument_images").select("*, monuments(name)").order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <Navbar profile={profile} />
      <main style={{ paddingTop: 64 }}>
        <AdminClient
          currentProfile={profile}
          initialDestinations={destinations ?? []}
          initialPlaces={places ?? []}
          initialMonuments={monuments ?? []}
          initialProfiles={profiles ?? []}
          initialMonumentImages={monumentImages ?? []}
        />
      </main>
    </>
  );
}
