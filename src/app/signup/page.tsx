"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus, Mail, Lock, User, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const passwordRequirements = [
  { label: "At least 8 characters", check: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", check: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", check: (p: string) => /\d/.test(p) },
];

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!displayName.trim() || displayName.trim().length < 2)
      errs.displayName = "Display name must be at least 2 characters";
    if (!email || !/\S+@\S+\.\S+/.test(email))
      errs.email = "Enter a valid email address";
    if (password.length < 8)
      errs.password = "Password must be at least 8 characters";
    return errs;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrors({ form: error.message });
        return;
      }

      setDone(true);
    });
  };

  if (done) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          background: "radial-gradient(ellipse at 50% 0%, rgba(45,212,191,0.06) 0%, var(--bg-base) 60%)",
        }}
      >
        <div className="card animate-fade-in-scale" style={{ padding: 36, maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(45,212,191,0.1)",
              border: "2px solid rgba(45,212,191,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Mail size={28} style={{ color: "var(--accent-teal)" }} />
          </div>
          <h2 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 10 }}>
            Check your inbox
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 24 }}>
            We sent a verification link to{" "}
            <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
            Click the link to verify your email and unlock all features.
          </p>
          <Link href="/login">
            <button className="btn btn-secondary" style={{ width: "100%" }} id="signup-goto-login-btn">
              Go to Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "radial-gradient(ellipse at 50% 0%, rgba(232,168,56,0.06) 0%, var(--bg-base) 60%)",
      }}
    >
      <div className="animate-fade-in-scale" style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "var(--gradient-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
              color: "#1a0800",
              margin: "0 auto 14px",
              boxShadow: "var(--shadow-glow-gold)",
            }}
          >
            W
          </div>
          <h1 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 6 }}>
            Join WanderLens
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Free travel companion for heritage destinations
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSignup} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Display name */}
            <div className="form-group">
              <label className="label" htmlFor="signup-name">Display name</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input
                  id="signup-name"
                  type="text"
                  className={`input ${errors.displayName ? "input-error" : ""}`}
                  style={{ paddingLeft: 42 }}
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setErrors((p) => ({ ...p, displayName: "" })); }}
                  required
                  autoComplete="name"
                  maxLength={60}
                />
              </div>
              {errors.displayName && <p className="error-msg">{errors.displayName}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="label" htmlFor="signup-email">Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input
                  id="signup-email"
                  type="email"
                  className={`input ${errors.email ? "input-error" : ""}`}
                  style={{ paddingLeft: 42 }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                  required
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="error-msg">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="label" htmlFor="signup-password">Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  className={`input ${errors.password ? "input-error" : ""}`}
                  style={{ paddingLeft: 42, paddingRight: 48 }}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  id="signup-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="error-msg">{errors.password}</p>}

              {/* Password requirements */}
              {password.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  {passwordRequirements.map(({ label, check }) => {
                    const met = check(password);
                    return (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.775rem" }}>
                        <CheckCircle size={12} style={{ color: met ? "#4ade80" : "var(--text-muted)", flexShrink: 0 }} />
                        <span style={{ color: met ? "#4ade80" : "var(--text-muted)" }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form-level error */}
            {errors.form && (
              <p className="error-msg" role="alert">{errors.form}</p>
            )}

            <button
              type="submit"
              id="signup-submit-btn"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 4 }}
              disabled={isPending}
            >
              {isPending ? (
                <span className="animate-spin" style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#1a0800", borderRadius: "50%" }} />
              ) : (
                <><UserPlus size={16} /> Create account</>
              )}
            </button>
          </form>

          <div className="divider-label" style={{ margin: "20px 0" }}><span>or</span></div>

          <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--accent-gold)", fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 20, lineHeight: 1.5 }}>
          By signing up you agree to our{" "}
          <Link href="/terms" style={{ color: "var(--text-secondary)" }}>Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" style={{ color: "var(--text-secondary)" }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
