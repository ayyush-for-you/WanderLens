import { Suspense } from "react";
import { Metadata } from "next";
import CreateGroupPageClient from "@/components/groups/CreateGroupPageClient";

export const metadata: Metadata = {
  title: "New Travel Group | WanderLens",
  description: "Create a new travel group for live location sharing and alerts",
};

export default function NewGroupPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
          Loading travel group setup...
        </div>
      }
    >
      <CreateGroupPageClient />
    </Suspense>
  );
}
