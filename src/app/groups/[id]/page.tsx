import { Metadata } from "next";
import GroupLiveMapClient from "@/components/groups/GroupLiveMapClient";

export const metadata: Metadata = {
  title: "Live Group Radar | WanderLens",
  description: "Live location radar and alerts for travel group members",
};

export default async function GroupLivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupLiveMapClient groupId={id} />;
}

