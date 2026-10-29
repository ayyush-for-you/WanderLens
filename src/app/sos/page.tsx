import { Metadata } from "next";
import SosClient from "@/components/sos/SosClient";

export const metadata: Metadata = {
  title: "Solo Safety & SOS | WanderLens",
  description: "Peer-to-peer nearby safety SOS assistance for heritage travellers within 2 km",
};

export default function SosPage() {
  return <SosClient />;
}

