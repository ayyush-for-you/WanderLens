"use client";

import { useState, useTransition } from "react";
import { User, Mail, Shield, Bell, CheckCircle, AlertCircle, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { Profile } from "@/types/database";

interface ProfileClientProps {
  profile: Profile;
  email: string;
}

export default function ProfileClient({ profile, email }: ProfileClientProps) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [sosOptIn, setSosOptIn] = useState(profile.sos_opt_in);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const handleSave = async () => {
    if (!displayName.trim() || displayName.trim().length < 2) {
      toast.error("Display name must be at least 2 characters"); return;
    }
    startTransition(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim(), bio: bio.trim() || null })
        .eq("id", profile.id);
      if (error) { toast.error(error.message); } else { toast.success("Profile updated"); }
    });
  };

  const toggleSos = async () => {
    const newVal = !sosOptIn;
    setSosOptIn(newVal);
    const { error } = await supabase
      .from("profiles")
      .update({ sos_opt_in: newVal })
      .eq("id", profile.id);
    if (error) { toast.error(error.message); setSosOptIn(!newVal); }
    else { toast.success(newVal ? "SOS alerts enabled" : "SOS alerts disabled"); }
  };

  const handleResendVerification = async () => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { toast.error(error.message); }
    else { toast.success("Verification email sent!"); }
  };

  return (
    <div className="content-container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            width: 72, height: 72, borderRadius: "50%",
            background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : "var(--gradient-gold)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.75rem", fontWeight: 800, color: "#1a0800",
            marginBottom: 14, boxShadow: "var(--shadow-glow-gold)",
          }}
        >
          {!profile.avatar_url && profile.display_name.charAt(0).toUpperCase()}
        </div>
        <h1 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 4 }}>
          {profile.display_name}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className={`badge ${profile.role === "admin" ? "badge-gold" : profile.role === "moderator" ? "badge-teal" : "badge-muted"}`}>
            {profile.role}
          </span>
          {profile.is_verified ? (
            <span className="badge badge-success"><CheckCircle size={11} /> Verified</span>
          ) : (
            <span className="badge badge-danger"><AlertCircle size={11} /> Unverified</span>
          )}
        </div>
      </div>

      {/* Verification banner */}
      {!profile.is_verified && (
        <div className="alert-box alert-box-warning" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Verify your email to unlock all features</p>
            <button
              className="btn btn-primary btn-sm"
              id="profile-resend-verify-btn"
              onClick={handleResendVerification}
            >
              Resend verification email
            </button>
          </div>
        </div>
      )}

      {/* Profile fields */}
      <section className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 18 }}>
          Profile
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-group">
            <label className="label" htmlFor="profile-display-name">Display name</label>
            <div style={{ position: "relative" }}>
              <User size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                id="profile-display-name"
                className="input"
                style={{ paddingLeft: 40 }}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={60}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="profile-email">Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                id="profile-email"
                className="input"
                style={{ paddingLeft: 40, opacity: 0.6 }}
                value={email}
                disabled
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="profile-bio">Bio</label>
            <textarea
              id="profile-bio"
              className="input"
              rows={3}
              placeholder="Tell other travellers about yourself…"
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={200}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>{bio.length}/200</p>
          </div>

          <button
            id="profile-save-btn"
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? (
              <span className="animate-spin" style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#1a0800", borderRadius: "50%" }} />
            ) : (
              <><Save size={15} /> Save changes</>
            )}
          </button>
        </div>
      </section>

      {/* Safety settings */}
      <section className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 18 }}>
          Safety &amp; Privacy
        </h2>

        {/* SOS opt-in toggle */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Bell size={15} style={{ color: "var(--accent-gold)" }} />
              <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>Receive nearby SOS alerts</p>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              When on, your approximate location (≈100m precision) is stored for 30 minutes so you can receive SOS alerts from nearby travellers.
              Location is auto-deleted when you close the app or after 30 minutes.
            </p>
          </div>
          <button
            id="profile-sos-toggle"
            role="switch"
            aria-checked={sosOptIn}
            onClick={toggleSos}
            disabled={!profile.is_verified}
            style={{
              width: 48, height: 26, borderRadius: 99, border: "none", cursor: "pointer",
              background: sosOptIn ? "var(--accent-teal)" : "rgba(255,255,255,0.1)",
              position: "relative", flexShrink: 0, transition: "background 0.2s",
              opacity: profile.is_verified ? 1 : 0.5,
            }}
          >
            <span
              style={{
                position: "absolute", top: 3, left: sosOptIn ? 25 : 3,
                width: 20, height: 20, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            />
          </button>
        </div>

        {!profile.is_verified && (
          <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginTop: 12 }}>
            Verify your email to enable SOS features.
          </p>
        )}
      </section>
    </div>
  );
}
