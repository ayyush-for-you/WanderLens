import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import SosClient from "@/components/sos/SosClient";

export const metadata: Metadata = {
  title: "Emergency SOS | WanderLens",
  description: "Peer-to-peer nearby safety SOS assistance for heritage travellers within 2 km",
};

export default async function SosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/sos");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Navbar profile={profile} />
      <SosClient />
      <BottomNav />
    </>
  );
}
