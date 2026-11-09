import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import SoloDashboard from "@/components/solo/SoloDashboard";

export const metadata = { title: "Solo Mode" };

export default async function SoloPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/solo");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <>
      <Navbar profile={profile} />
      <SoloDashboard profile={profile} />
    </>
  );
}

