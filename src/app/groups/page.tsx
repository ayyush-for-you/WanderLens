import { Metadata } from "next";
import GroupsClient from "@/components/groups/GroupsClient";

export const metadata: Metadata = {
  title: "Travel Groups | WanderLens",
  description: "Live location radar and alerts for travel groups during active trips",
};

export default function GroupsPage() {
  return <GroupsClient />;
}

