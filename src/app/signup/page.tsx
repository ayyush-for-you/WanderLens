"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LogoIcon() {
  return (
    <svg width="30" height="26" viewBox="0 0 30 26" fill="none" aria-hidden="true">
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M3.2 19.6C.4 15.8 1.3 8.6 6.6 4.7 11.3 1.2 18.9.9 23.9 4.1c4.7 3 6.3 9 3.6 13.9-2.9 5.3-9.4 7.7-15.4 7-3.8-.4-6.9-2.4-8.9-5.4ZM9.5 17.2l4.3-6.4 2.6 3.6 1.7-2.2 3.4 5z"
      />
    </svg>
  );
}

const passwordRequirements = [
  { label: "At least 8 characters", check: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", check: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", check: (p: string) => /\d/.test(p) },
];

function getPasswordStrength(p: string): number {
  const met = passwordRequirements.filter((r) => r.check(p)).length;
  return (met / passwordRequirements.length) * 100;
}

function getStrengthColor(p: string): string {
  const s = getPasswordStrength(p);
  if (s <= 33) return "#f87171";
  if (s <= 66) return "#fbbf24";
  return "#34d399";
}

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!displayName.trim() || displayName.trim().length < 2)
      errs.displayName = "Name must be at least 2 characters";
    if (!email || !/\S+@\S+\.\S+/.test(email))
      errs.email = "Enter a valid email address";
    if (password.length < 8)
      errs.password = "Password must be at least 8 characters";
    return errs;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
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
          minHeight: "100vh",
          background: "var(--ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "25%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "520px",
            height: "520px",
            background: "radial-gradient(circle, rgba(255,255,255,0.035) 0%, rgba(11,16,19,0) 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: "16px",
            backdropFilter: "blur(22px) saturate(140%)",
            WebkitBackdropFilter: "blur(22px) saturate(140%)",
            padding: "36px 32px",
            textAlign: "center",
            boxShadow: "0 30px 70px -25px rgba(0,0,0,0.65), 0 2px 10px rgba(0,0,0,0.2)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto",
              color: "#ffffff",
            }}
          >
            <Mail size={24} />
          </div>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: 500,
              color: "var(--text)",
              letterSpacing: "-0.015em",
              margin: "0 0 10px 0",
            }}
          >
            Check your email
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: "var(--muted)",
              lineHeight: 1.55,
              margin: "0 0 24px 0",
            }}
          >
            We sent an activation link to <strong style={{ color: "#ffffff" }}>{email}</strong>.
            Click the link in your inbox to unlock your passport to communities, live groups, and emergency safety telemetry.
          </p>

          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "44px",
              borderRadius: "999px",
              background: "#ffffff",
              color: "#0b0f12",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              transition: "background 0.25s ease, transform 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e9eef0";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Proceed to Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  const strength = getPasswordStrength(password);
  const strengthColor = getStrengthColor(password);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "520px",
          height: "520px",
          background: "radial-gradient(circle, rgba(255,255,255,0.035) 0%, rgba(11,16,19,0) 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: "16px",
          backdropFilter: "blur(22px) saturate(140%)",
          WebkitBackdropFilter: "blur(22px) saturate(140%)",
          padding: "32px",
          boxShadow: "0 30px 70px -25px rgba(0,0,0,0.65), 0 2px 10px rgba(0,0,0,0.2)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Top of Card: Logo + Headings */}
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <Link
            href="/"
            aria-label="WanderLens home"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "18px",
              transition: "transform 0.25s ease",
            }}
          >
            <LogoIcon />
          </Link>

          <h1
            style={{
              fontSize: "26px",
              fontWeight: 500,
              color: "var(--text)",
              letterSpacing: "-0.015em",
              lineHeight: 1.25,
              margin: "0 0 6px 0",
            }}
          >
            Create your account
          </h1>
          <p
            style={{
              fontSize: "14.5px",
              color: "var(--muted)",
              lineHeight: 1.45,
              margin: 0,
            }}
          >
            Discover heritage, join communities, and travel safely
          </p>
        </div>

        {/* Global form error message */}
        {errors.form && (
          <div
            role="alert"
            style={{
              background: "rgba(220, 38, 38, 0.1)",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              borderRadius: "8px",
              padding: "10px 12px",
              color: "#fca5a5",
              fontSize: "13px",
              lineHeight: 1.4,
              marginBottom: "18px",
            }}
          >
            {errors.form}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignup} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Full Name input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="displayName"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--muted)",
              }}
            >
              Full Name
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <User
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  color: "var(--muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="displayName"
                type="text"
                name="name"
                placeholder="Princess Gayatri"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setErrors((p) => ({ ...p, displayName: "" }));
                }}
                required
                autoComplete="name"
                style={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--line)",
                  color: "#ffffff",
                  fontSize: "14px",
                  paddingLeft: "42px",
                  paddingRight: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.2s ease, background 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
              />
            </div>
            {errors.displayName && (
              <span style={{ fontSize: "12px", color: "var(--danger)", marginTop: "2px" }}>
                {errors.displayName}
              </span>
            )}
          </div>

          {/* Email input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="email"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--muted)",
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  color: "var(--muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="traveler@wanderlens.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((p) => ({ ...p, email: "" }));
                }}
                required
                autoComplete="email"
                style={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--line)",
                  color: "#ffffff",
                  fontSize: "14px",
                  paddingLeft: "42px",
                  paddingRight: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.2s ease, background 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
              />
            </div>
            {errors.email && (
              <span style={{ fontSize: "12px", color: "var(--danger)", marginTop: "2px" }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Password input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="password"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--muted)",
              }}
            >
              Security Password
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  color: "var(--muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => ({ ...p, password: "" }));
                }}
                required
                autoComplete="new-password"
                style={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--line)",
                  color: "#ffffff",
                  fontSize: "14px",
                  paddingLeft: "42px",
                  paddingRight: "42px",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.2s ease, background 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span style={{ fontSize: "12px", color: "var(--danger)", marginTop: "2px" }}>
                {errors.password}
              </span>
            )}

            {/* Password strength & checklist */}
            {password.length > 0 && (
              <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Strength meter bar */}
                <div
                  style={{
                    width: "100%",
                    height: "3px",
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    animate={{ width: `${strength}%`, backgroundColor: strengthColor }}
                    transition={{ duration: 0.25 }}
                    style={{ height: "100%", borderRadius: "999px" }}
                  />
                </div>

                {/* Checklist */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {passwordRequirements.map(({ label, check }) => {
                    const met = check(password);
                    return (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          color: met ? "#34d399" : "var(--muted)",
                          transition: "color 0.2s ease",
                        }}
                      >
                        <CheckCircle size={13} style={{ opacity: met ? 1 : 0.4 }} />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isPending}
            style={{
              width: "100%",
              height: "44px",
              borderRadius: "999px",
              background: "#ffffff",
              color: "#0b0f12",
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.6 : 1,
              marginTop: "8px",
              transition: "background 0.25s ease, transform 0.25s ease, opacity 0.25s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              if (!isPending) {
                e.currentTarget.style.background = "#e9eef0";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {isPending ? (
              <span
                style={{
                  width: "18px",
                  height: "18px",
                  border: "2px solid rgba(11,15,18,0.25)",
                  borderTopColor: "#0b0f12",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer line */}
        <p
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "13.5px",
            color: "var(--muted)",
            margin: "24px 0 0 0",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              fontWeight: 500,
            }}
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
