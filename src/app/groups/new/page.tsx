import { Suspense } from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import CreateGroupPageClient from "@/components/groups/CreateGroupPageClient";
import type { Destination, Profile } from "@/types/database";

export const metadata: Metadata = {
  title: "New Travel Group",
  description: "Create a new travel group for live location sharing and alerts",
};

export default async function NewGroupPage() {
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
        <Suspense
          fallback={
            <div
              style={{
                minHeight: "calc(100dvh - 76px)",
                background: "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                fontSize: "0.9rem",
              }}
            >
              Loading travel group setup…
            </div>
          }
        >
          <CreateGroupPageClient initialDestinations={(destinations as Destination[]) || []} />
        </Suspense>
      </main>
      <BottomNav />
    </>
  );
}
