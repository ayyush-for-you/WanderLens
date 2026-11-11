/**
 * Navbar — thin wrapper around SiteHeader.
 * All page files pass `profile` here unchanged; SiteHeader handles the UI.
 */
import SiteHeader from "./SiteHeader";
import type { Profile } from "@/types/database";

interface NavbarProps {
  profile?: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  return <SiteHeader profile={profile ?? null} />;
}
