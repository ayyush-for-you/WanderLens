"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

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

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/mode-select";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      toast.success("Welcome back to WanderLens!");
      router.push(redirect);
      router.refresh();
    });
  };

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
        animate={shake ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
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
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
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
            Welcome back
          </h1>
          <p
            style={{
              fontSize: "14.5px",
              color: "var(--muted)",
              lineHeight: 1.45,
              margin: 0,
            }}
          >
            Access your curated journal and exploration telemetry
          </p>
        </div>

        {/* Error message */}
        {error && (
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
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
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
                  setError("");
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
              Password
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
                autoComplete="current-password"
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
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isPending || !email || !password}
            style={{
              width: "100%",
              height: "44px",
              borderRadius: "999px",
              background: "#ffffff",
              color: "#0b0f12",
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              cursor: isPending || !email || !password ? "not-allowed" : "pointer",
              opacity: isPending || !email || !password ? 0.6 : 1,
              marginTop: "8px",
              transition: "background 0.25s ease, transform 0.25s ease, opacity 0.25s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              if (!isPending && email && password) {
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
              "Sign In"
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
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              fontWeight: 500,
            }}
          >
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "var(--ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
