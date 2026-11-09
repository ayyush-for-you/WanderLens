"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, LogOut, Settings, Shield, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Profile } from "@/types/database";

interface NavbarProps {
  profile?: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 flex items-center px-6 md:px-10 justify-between ${
        scrolled
          ? "bg-[#101B2B]/90 backdrop-blur-md border-b border-white/10 shadow-lg"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2.5 text-decoration-none">
        <div className="w-8 h-8 rounded-xl bg-[#B99A65] flex items-center justify-center text-[#101B2B] font-bold shadow-md">
          <Compass className="w-4 h-4" />
        </div>
        <span className="font-['Playfair_Display'] text-xl font-bold tracking-tight text-white">
          Wander<span className="text-[#B99A65]">Lens</span>
        </span>
      </Link>

      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex items-center gap-1">
        {[
          { href: "/discover", label: "Discover" },
          { href: "/scan", label: "Monument Scan" },
          { href: "/communities", label: "Communities" },
          { href: "/groups", label: "Travel Groups" },
        ].map(({ href, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-full text-xs font-['Manrope'] font-medium transition-all ${
                isActive
                  ? "text-[#B99A65] bg-[#B99A65]/10 border border-[#B99A65]/30 font-bold"
                  : "text-[#D9C7AC]/80 hover:text-white hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* SOS Quick Button */}
        <Link
          href="/sos"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E76F51]/15 border border-[#E76F51]/40 text-[#E76F51] text-[11px] font-bold tracking-wider uppercase font-mono transition-transform hover:scale-105 active:scale-95 shadow"
        >
          <span className="w-2 h-2 rounded-full bg-[#E76F51] animate-ping" />
          <span>SOS</span>
        </Link>

        {profile ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full border border-[#B99A65]/50 flex items-center justify-center text-[#101B2B] text-xs font-bold font-['Manrope'] shadow-md cursor-pointer transition-transform hover:scale-105"
              style={{
                background: profile.avatar_url
                  ? `url(${profile.avatar_url}) center/cover`
                  : "linear-gradient(135deg, #B99A65, #D9C7AC)",
              }}
              aria-label="User Menu"
            >
              {!profile.avatar_url && profile.display_name.charAt(0).toUpperCase()}
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-52 p-2 rounded-2xl bg-[#101B2B] border border-[#B99A65]/30 shadow-2xl space-y-1 font-['Manrope']">
                  <div className="p-3 border-b border-white/10">
                    <p className="text-xs font-bold text-white font-['Playfair_Display']">
                      {profile.display_name}
                    </p>
                    <p className="text-[10px] text-[#D9C7AC]/70 font-mono mt-0.5">
                      Role: {profile.role}
                    </p>
                  </div>

                  <Link
                    href="/mode-select"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#D9C7AC] hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span>🧭 Switch Travel Mode</span>
                  </Link>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#D9C7AC] hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#B99A65]" />
                    <span>My Account</span>
                  </Link>

                  {(profile.role === "admin" || profile.role === "moderator") && (
                    <Link
                      href={profile.role === "admin" ? "/admin" : "/moderator"}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#B99A65] hover:bg-white/5 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{profile.role === "admin" ? "Admin Console" : "Mod Queue"}</span>
                    </Link>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#E76F51] hover:bg-[#E76F51]/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-5 py-2 rounded-full btn-luxury-outline text-xs font-['Manrope']"
          >
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
