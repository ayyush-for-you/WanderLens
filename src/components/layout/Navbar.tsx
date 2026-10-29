"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Settings, Shield } from "lucide-react";
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <header className="navbar">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mr-auto" style={{ textDecoration: "none" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--gradient-gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 800,
            color: "#1a0800",
            flexShrink: 0,
          }}
        >
          W
        </div>
        <span
          className="font-display"
          style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}
        >
          WanderLens
        </span>
      </Link>

      {/* Desktop nav links */}
      <nav className="hidden md:flex items-center gap-1 mr-4">
        {[
          { href: "/discover", label: "Discover" },
          { href: "/scan", label: "Scan" },
          { href: "/communities", label: "Communities" },
          { href: "/groups", label: "Groups" },
        ].map(({ href, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: "0.875rem",
                fontWeight: 500,
                color: isActive ? "var(--accent-gold)" : "var(--text-secondary)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/sos"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 12px",
            borderRadius: 999,
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#f87171",
            fontSize: "0.75rem",
            fontWeight: 800,
            textDecoration: "none",
            letterSpacing: "0.04em",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} className="animate-pulse" />
          SOS
        </Link>

        {profile ? (
          <div className="relative">
            <button
              id="navbar-profile-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: profile.avatar_url
                  ? `url(${profile.avatar_url}) center/cover`
                  : "var(--gradient-gold)",
                border: "2px solid rgba(232,168,56,0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1a0800",
                fontSize: "0.8125rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
              aria-expanded={menuOpen}
              aria-label="Open profile menu"
            >
              {!profile.avatar_url && profile.display_name.charAt(0).toUpperCase()}
            </button>

            {menuOpen && (
              <>
                {/* Backdrop */}
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 49 }}
                  onClick={() => setMenuOpen(false)}
                />
                {/* Dropdown */}
                <div
                  className="card animate-fade-in-scale"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    minWidth: 200,
                    zIndex: 50,
                    padding: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {profile.display_name}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {profile.role}
                      {!profile.is_verified && (
                        <span style={{ color: "#fbbf24", marginLeft: 6 }}>· Unverified</span>
                      )}
                    </p>
                  </div>

                  {(profile.role === "admin" || profile.role === "moderator") && (
                    <Link
                      href={profile.role === "admin" ? "/admin" : "/moderator"}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, color: "var(--accent-gold)", fontSize: "0.875rem", textDecoration: "none" }}
                    >
                      <Shield size={15} /> {profile.role === "admin" ? "Admin Console" : "Moderator Queue"}
                    </Link>
                  )}

                  <Link
                    href="/profile"
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, color: "var(--text-secondary)", fontSize: "0.875rem", textDecoration: "none" }}
                  >
                    <Settings size={15} /> Settings
                  </Link>

                  <button
                    id="navbar-signout-btn"
                    onClick={handleSignOut}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, color: "#f87171", fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link href="/login">
            <button className="btn btn-primary btn-sm" id="navbar-login-btn">Sign in</button>
          </Link>
        )}
      </div>
    </header>
  );
}
