import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import ModeSelectClient from "@/components/home/ModeSelectClient";

export default async function ModeSelectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/mode-select");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <>
      <Navbar profile={profile} />
      <ModeSelectClient profile={profile} />
    </>
  );
}

