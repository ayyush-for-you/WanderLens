"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Shield,
  Bell,
  CheckCircle,
  AlertCircle,
  Save,
  Compass,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { Profile } from "@/types/database";

interface ProfileClientProps {
  profile: Profile;
  email: string;
}

const panelStyle: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 16,
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
};

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 500,
  color: "var(--soft)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  color: "var(--text)",
  padding: "10px 14px",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s ease, background 0.2s ease",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "inherit",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--muted)",
  margin: 0,
};

export default function ProfileClient({ profile, email }: ProfileClientProps) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [sosOptIn, setSosOptIn] = useState(profile.sos_opt_in);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const handleSave = async () => {
    if (!displayName.trim() || displayName.trim().length < 2) {
      toast.error("Display name must be at least 2 characters");
      return;
    }
    startTransition(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim(), bio: bio.trim() || null })
        .eq("id", profile.id);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Profile updated");
      }
    });
  };

  const toggleSos = async () => {
    const newVal = !sosOptIn;
    setSosOptIn(newVal); // optimistic

    if (newVal) {
      if (!("geolocation" in navigator)) {
        toast.error("Geolocation is not supported by your browser. SOS opt-in needs location.");
        setSosOptIn(!newVal);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch("/api/sos/presence", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                opt_in: true,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              toast.error(data.error || "Failed to enable SOS alerts");
              setSosOptIn(false);
            } else {
              const { data: row, error } = await supabase
                .from("profiles")
                .select("sos_opt_in")
                .eq("id", profile.id)
                .single();
              if (error) {
                toast.error(error.message);
                setSosOptIn(!newVal);
              } else {
                setSosOptIn(row?.sos_opt_in ?? false);
                toast.success("SOS alerts enabled");
              }
            }
          } catch (err: any) {
            toast.error(err.message || "Failed to enable SOS alerts");
            setSosOptIn(!newVal);
          }
        },
        (err) => {
          toast.error(`Location permission required: ${err.message}`);
          setSosOptIn(!newVal);
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    } else {
      try {
        const res = await fetch("/api/sos/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opt_in: false }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to disable SOS alerts");
          setSosOptIn(!newVal);
        } else {
          const { data: row, error } = await supabase
            .from("profiles")
            .select("sos_opt_in")
            .eq("id", profile.id)
            .single();
          if (error) {
            toast.error(error.message);
            setSosOptIn(!newVal);
          } else {
            setSosOptIn(row?.sos_opt_in ?? false);
            toast.success("SOS alerts disabled");
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to disable SOS alerts");
        setSosOptIn(!newVal);
      }
    }
  };

  const handleResendVerification = async () => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification email sent!");
    }
  };

  const roleBadgeStyle: React.CSSProperties =
    profile.role === "admin"
      ? {
          color: "#B99A65",
          background: "rgba(185, 154, 101, 0.14)",
          border: "1px solid rgba(185, 154, 101, 0.35)",
        }
      : profile.role === "moderator"
      ? {
          color: "#00C9A7",
          background: "rgba(0, 201, 167, 0.12)",
          border: "1px solid rgba(0, 201, 167, 0.35)",
        }
      : {
          color: "var(--soft)",
          background: "var(--hover)",
          border: "1px solid var(--line)",
        };

  return (
    <div
      style={{
        minHeight: "calc(100dvh - 76px)",
        background: "var(--ink)",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "36px clamp(20px, 3.4vw, 40px) 96px",
        }}
      >
        {/* Profile Header Card */}
        <div
          style={{
            ...panelStyle,
            padding: "24px 24px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 18,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: profile.avatar_url
                  ? `url(${profile.avatar_url}) center/cover`
                  : "linear-gradient(135deg, #B99A65 0%, #8f7242 100%)",
                border: "2px solid rgba(255, 255, 255, 0.18)",
                boxShadow: "0 10px 28px rgba(185, 154, 101, 0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
                fontWeight: 600,
                color: "#0b0f12",
                flexShrink: 0,
              }}
            >
              {!profile.avatar_url && profile.display_name.charAt(0).toUpperCase()}
            </div>

            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: "inherit",
                  fontSize: "clamp(1.35rem, 2.8vw, 1.65rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  margin: "0 0 4px 0",
                  color: "var(--text)",
                }}
              >
                {profile.display_name}
              </h1>
              <p
                style={{
                  fontSize: "0.84rem",
                  color: "var(--muted)",
                  margin: "0 0 10px 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {email}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    ...roleBadgeStyle,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  {profile.role}
                </span>

                {profile.is_verified ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      color: "#00C9A7",
                      background: "rgba(0, 201, 167, 0.1)",
                      border: "1px solid rgba(0, 201, 167, 0.3)",
                      padding: "3px 10px",
                      borderRadius: 999,
                    }}
                  >
                    <CheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      color: "#fca5a5",
                      background: "rgba(220, 38, 38, 0.12)",
                      border: "1px solid rgba(220, 38, 38, 0.35)",
                      padding: "3px 10px",
                      borderRadius: 999,
                    }}
                  >
                    <AlertCircle size={12} /> Unverified
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/mode-select"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 999,
              background: "var(--hover)",
              border: "1px solid var(--line)",
              color: "var(--soft)",
              fontSize: "0.82rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <Compass size={14} style={{ color: "#B99A65" }} />
            Switch Mode
          </Link>
        </div>

        {/* Verification Banner */}
        {!profile.is_verified && (
          <div
            style={{
              ...panelStyle,
              background: "rgba(185, 154, 101, 0.08)",
              borderColor: "rgba(185, 154, 101, 0.35)",
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AlertCircle size={18} style={{ color: "#B99A65", flexShrink: 0 }} />
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", margin: 0 }}>
                Verify your email to unlock posts, groups, and SOS alerts.
              </p>
            </div>
            <button
              id="profile-resend-verify-btn"
              onClick={handleResendVerification}
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 999,
                background: "#fff",
                border: "none",
                color: "#0b0f12",
                fontFamily: "inherit",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Resend verification email
            </button>
          </div>
        )}

        {/* Profile Form Card */}
        <section style={{ ...panelStyle, padding: 24, marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
              paddingBottom: 14,
              borderBottom: "1px solid var(--line)",
            }}
          >
            <User size={15} style={{ color: "#B99A65" }} />
            <h2 style={sectionHeadingStyle}>Account Details</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={fieldLabelStyle} htmlFor="profile-display-name">
                Display name
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={15}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="profile-display-name"
                  style={{ ...inputStyle, paddingLeft: 40 }}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={60}
                />
              </div>
            </div>

            <div>
              <label style={fieldLabelStyle} htmlFor="profile-email">
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={15}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="profile-email"
                  style={{ ...inputStyle, paddingLeft: 40, opacity: 0.6, cursor: "not-allowed" }}
                  value={email}
                  disabled
                />
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <label style={{ ...fieldLabelStyle, marginBottom: 0 }} htmlFor="profile-bio">
                  Bio
                </label>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  {bio.length}/200
                </span>
              </div>
              <textarea
                id="profile-bio"
                rows={3}
                placeholder="Tell other travellers about yourself…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                style={{ ...inputStyle, resize: "vertical", minHeight: 88, lineHeight: 1.5 }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
              <button
                id="profile-save-btn"
                onClick={handleSave}
                disabled={isPending}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  height: 40,
                  padding: "0 22px",
                  borderRadius: 999,
                  background: "#fff",
                  border: "none",
                  color: "#0b0f12",
                  fontFamily: "inherit",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? (
                  <span
                    className="animate-spin"
                    style={{
                      display: "inline-block",
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(0,0,0,0.2)",
                      borderTopColor: "#0b0f12",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  <>
                    <Save size={15} /> Save changes
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Safety & Privacy Card */}
        <section style={{ ...panelStyle, padding: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
              paddingBottom: 14,
              borderBottom: "1px solid var(--line)",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={15} style={{ color: "#00C9A7" }} />
              <h2 style={sectionHeadingStyle}>Safety &amp; Privacy</h2>
            </div>

            <Link
              href="/sos"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "var(--soft)",
                textDecoration: "none",
              }}
            >
              Open SOS Center <ArrowRight size={13} />
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Bell size={15} style={{ color: "#B99A65" }} />
                <p style={{ fontWeight: 500, fontSize: "0.9375rem", margin: 0, color: "var(--text)" }}>
                  Receive nearby SOS alerts
                </p>
              </div>
              <p
                style={{
                  fontSize: "0.84rem",
                  color: "var(--muted)",
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                When enabled, your coarse location (~100m precision) is stored for 30 minutes so
                you can receive emergency alerts from travellers within 2 km. Presence automatically
                expires after 30 minutes.
              </p>
            </div>

            <button
              id="profile-sos-toggle"
              role="switch"
              aria-checked={sosOptIn}
              onClick={toggleSos}
              disabled={!profile.is_verified}
              style={{
                width: 48,
                height: 26,
                borderRadius: 999,
                border: sosOptIn
                  ? "1px solid rgba(0, 201, 167, 0.5)"
                  : "1px solid var(--line)",
                cursor: profile.is_verified ? "pointer" : "not-allowed",
                background: sosOptIn ? "#00C9A7" : "rgba(255, 255, 255, 0.08)",
                position: "relative",
                flexShrink: 0,
                transition: "background 0.2s ease, border-color 0.2s ease",
                opacity: profile.is_verified ? 1 : 0.45,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: sosOptIn ? 23 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s ease",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                }}
              />
            </button>
          </div>

          {!profile.is_verified && (
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 12, marginBottom: 0 }}>
              Verify your email to enable SOS features.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
