"use client";

import Link from "next/link";
import { Compass, Scan, Shield, Users, Zap, MapPin, Star, ChevronRight } from "lucide-react";
import type { Profile } from "@/types/database";

const quickActions = [
  {
    id: "scan-action",
    href: "/scan",
    icon: Scan,
    label: "Scan Monument",
    description: "Point camera, get history",
    gradient: "var(--gradient-gold)",
    textColor: "#1a0800",
    glow: "0 8px 32px rgba(232,168,56,0.35)",
  },
  {
    id: "discover-action",
    href: "/discover",
    icon: Compass,
    label: "Discover Gems",
    description: "Low-activity, high-rated places",
    gradient: "var(--gradient-teal)",
    textColor: "#001a18",
    glow: "0 8px 32px rgba(45,212,191,0.3)",
  },
  {
    id: "community-action",
    href: "/communities",
    icon: Users,
    label: "Communities",
    description: "Chat, plan, travel together",
    gradient: "linear-gradient(135deg, #7c3aed, #a855f7)",
    textColor: "#fff",
    glow: "0 8px 32px rgba(168,85,247,0.3)",
  },
  {
    id: "sos-action",
    href: "/sos",
    icon: Shield,
    label: "SOS Nearby",
    description: "Alert travellers around you",
    gradient: "linear-gradient(135deg, #dc2626, #f97316)",
    textColor: "#fff",
    glow: "0 8px 32px rgba(220,38,38,0.3)",
  },
];

const highlights = [
  { icon: Scan, text: "Scan any of 8 curated monuments for deep history" },
  { icon: Star, text: "Discover hidden gems ranked by the community, not by ad spend" },
  { icon: MapPin, text: "Travel with groups — live map, alerts, auto-end sharing" },
  { icon: Shield, text: "SOS reaches real nearby travellers within 2 km" },
];

interface HomeClientProps {
  profile: Profile | null;
}

export default function HomeClient({ profile }: HomeClientProps) {
  return (
    <div className="content-container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      {/* Hero */}
      <div className="animate-fade-in" style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 99,
            background: "rgba(232,168,56,0.1)",
            border: "1px solid rgba(232,168,56,0.2)",
            marginBottom: 16,
          }}
        >
          <Zap size={13} style={{ color: "var(--accent-gold)" }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent-gold)", letterSpacing: "0.05em" }}>
            HERITAGE TRAVEL COMPANION
          </span>
        </div>

        {profile ? (
          <>
            <h1
              className="font-display"
              style={{ fontSize: "clamp(1.6rem, 5vw, 2.2rem)", lineHeight: 1.2, marginBottom: 10 }}
            >
              Welcome back,{" "}
              <span className="text-gradient-gold">{profile.display_name.split(" ")[0]}</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
              Where are you exploring today?
            </p>
          </>
        ) : (
          <>
            <h1
              className="font-display"
              style={{ fontSize: "clamp(1.75rem, 6vw, 2.5rem)", lineHeight: 1.15, marginBottom: 14 }}
            >
              Scan a monument.{" "}
              <span className="text-gradient-gold">Learn its story.</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.65, marginBottom: 20 }}>
              Discover underrated places ranked by real traveller activity.
              Travel safely with groups and nearby SOS.
            </p>
            <div className="flex" style={{ gap: 10 }}>
              <Link href="/signup">
                <button className="btn btn-primary" id="home-signup-btn">
                  Get Started <ChevronRight size={16} />
                </button>
              </Link>
              <Link href="/discover">
                <button className="btn btn-secondary" id="home-explore-btn">Explore</button>
              </Link>
            </div>
          </>
        )}

        {/* Email verification notice */}
        {profile && !profile.is_verified && (
          <div className="alert-box alert-box-warning animate-fade-in" style={{ marginTop: 16 }}>
            <Zap size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 600, marginBottom: 2 }}>Verify your email</p>
              <p style={{ fontSize: "0.8125rem", opacity: 0.85 }}>
                Check your inbox to unlock communities, groups, and SOS.{" "}
                <Link href="/verify" style={{ color: "var(--accent-gold)", fontWeight: 600 }}>
                  Resend email →
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions grid */}
      <section aria-labelledby="quick-actions-heading" style={{ marginBottom: 36 }}>
        <h2
          id="quick-actions-heading"
          style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}
        >
          Quick Actions
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {quickActions.map(({ id, href, icon: Icon, label, description, gradient, textColor, glow }) => (
            <Link key={id} href={href} style={{ textDecoration: "none" }}>
              <button
                id={id}
                className="card card-gold"
                style={{
                  width: "100%",
                  padding: "18px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 10,
                  cursor: "pointer",
                  background: "var(--gradient-card)",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: gradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: glow,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} color={textColor} strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: 2 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    {description}
                  </p>
                </div>
              </button>
            </Link>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section aria-labelledby="highlights-heading">
        <h2
          id="highlights-heading"
          style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}
        >
          What WanderLens does
        </h2>
        <div className="card" style={{ padding: "6px 0" }}>
          {highlights.map(({ icon: Icon, text }, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                borderBottom: i < highlights.length - 1 ? "1px solid var(--border-soft)" : "none",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(232,168,56,0.1)",
                  border: "1px solid rgba(232,168,56,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={15} style={{ color: "var(--accent-gold)" }} />
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Not logged in CTA */}
      {!profile && (
        <div
          className="glass-warm animate-fade-in"
          style={{ borderRadius: "var(--radius-lg)", padding: "24px", marginTop: 28, textAlign: "center" }}
        >
          <p
            className="font-display"
            style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 6 }}
          >
            Join WanderLens
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 16 }}>
            Free forever. No ads. No bookings.
          </p>
          <Link href="/signup">
            <button className="btn btn-primary" id="home-join-btn" style={{ width: "100%" }}>
              Create free account
            </button>
          </Link>
          <p style={{ marginTop: 12, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--accent-gold)", fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      )}
    </div>
  );
}
