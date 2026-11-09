"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Mail, Lock, Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

function LoginForm() {
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState("");
  const [shake, setShake]             = useState(false);
  const [isPending, startTransition]  = useTransition();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/mode-select";

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#101B2B] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#B99A65]/10 rounded-full blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Heading */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-2xl bg-[#B99A65] flex items-center justify-center text-[#101B2B] shadow-lg group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-['Playfair_Display'] text-2xl font-bold tracking-tight text-white">
              Wander<span className="text-[#B99A65]">Lens</span>
            </span>
          </Link>
          <h1 className="text-3xl font-normal font-['Playfair_Display'] text-white">
            Welcome Back
          </h1>
          <p className="text-xs text-[#D9C7AC]/70 font-['Manrope'] mt-1">
            Access your curated journal and exploration telemetry
          </p>
        </div>

        {/* Luxury Form Card */}
        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="luxury-glass-dark p-8 sm:p-10 rounded-3xl border border-white/15 shadow-2xl"
        >
          <form onSubmit={handleLogin} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#D9C7AC] font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8E9BAE] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  className="input pl-11"
                  placeholder="traveler@wanderlens.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#D9C7AC] font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8E9BAE] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input pl-11 pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E9BAE] hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-xs text-[#E76F51] font-['Manrope']"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isPending || !email || !password}
              className="w-full py-4 rounded-full btn-luxury-gold text-xs shadow-xl active:scale-95 disabled:opacity-50 mt-2"
            >
              {isPending ? (
                <span className="w-4 h-4 border-2 border-[#101B2B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Journey</span>
                </span>
              )}
            </button>
          </form>

          <div className="divider-label my-6">
            <span>or</span>
          </div>

          <p className="text-center text-xs text-[#D9C7AC]/80 font-['Manrope']">
            Do not have an account yet?{" "}
            <Link href="/signup" className="text-[#B99A65] font-bold hover:underline">
              Register Here →
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#101B2B]" />}>
      <LoginForm />
    </Suspense>
  );
}
