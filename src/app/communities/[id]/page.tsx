import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import CommunityChatClient from "@/components/communities/CommunityChatClient";
import type { Profile } from "@/types/database";

export const metadata = {
  title: "Community Chat",
  description: "Realtime destination community chatroom.",
};

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: communityId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/communities/${communityId}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch community details
  const { data: community } = await supabase
    .from("communities")
    .select("*, destinations(id, name, region)")
    .eq("id", communityId)
    .single();

  if (!community) {
    redirect("/communities");
  }

  // Fetch members
  const { data: members } = await supabase
    .from("community_members")
    .select("user_id, role, joined_at, profiles(id, display_name, avatar_url, role)")
    .eq("community_id", communityId);

  // Check if current user is member
  const isMember = (members || []).some((m) => m.user_id === user.id);
  if (!isMember) {
    redirect("/communities");
  }

  // Fetch mutual blocks
  const { data: blocks } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

  const blockedUserIds: string[] = [];
  if (blocks) {
    for (const b of blocks) {
      if (b.blocker_id === user.id) blockedUserIds.push(b.blocked_id);
      if (b.blocked_id === user.id) blockedUserIds.push(b.blocker_id);
    }
  }

  // Fetch initial messages
  const { data: rawMessages } = await supabase
    .from("messages")
    .select("*, profiles(id, display_name, avatar_url, role)")
    .eq("community_id", communityId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true })
    .limit(80);

  const initialMessages = (rawMessages || []).filter(
    (m: any) => !blockedUserIds.includes(m.user_id)
  );

  return (
    <>
      <Navbar profile={profile} />
      <main className="page-container" style={{ paddingBottom: 0 }}>
        <CommunityChatClient
          communityId={communityId}
          initialCommunity={community}
          initialMessages={initialMessages}
          initialMembers={members || []}
          profile={profile}
        />
      </main>
    </>
  );
}

