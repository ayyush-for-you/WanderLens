"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
        return;
      }

      toast.success("Welcome back!");
      router.push(redirect);
      router.refresh();
    });
  };

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
            Welcome back
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Sign in to continue your journey
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Email */}
            <div className="form-group">
              <label className="label" htmlFor="login-email">Email</label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
                />
                <input
                  id="login-email"
                  type="email"
                  className={`input ${error ? "input-error" : ""}`}
                  style={{ paddingLeft: 42 }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="label" htmlFor="login-password">Password</label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
                />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className={`input ${error ? "input-error" : ""}`}
                  style={{ paddingLeft: 42, paddingRight: 48 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="error-msg" role="alert" aria-live="polite">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 4 }}
              disabled={isPending || !email || !password}
            >
              {isPending ? (
                <span className="animate-spin" style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#1a0800", borderRadius: "50%" }} />
              ) : (
                <><LogIn size={16} /> Sign in</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider-label" style={{ margin: "20px 0" }}>
            <span>or</span>
          </div>

          <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "var(--accent-gold)", fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="animate-spin" style={{ width: 24, height: 24, border: "2px solid rgba(232,168,56,0.3)", borderTopColor: "var(--accent-gold)", borderRadius: "50%" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
