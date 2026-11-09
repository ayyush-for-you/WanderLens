"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, UserPlus, Mail, Lock, User, CheckCircle, Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const passwordRequirements = [
  { label: "At least 8 characters", check: (p: string) => p.length >= 8 },
  { label: "One uppercase letter",  check: (p: string) => /[A-Z]/.test(p) },
  { label: "One number",            check: (p: string) => /\d/.test(p) },
];

function getPasswordStrength(p: string): number {
  const met = passwordRequirements.filter((r) => r.check(p)).length;
  return (met / passwordRequirements.length) * 100;
}

function getStrengthColor(p: string): string {
  const s = getPasswordStrength(p);
  if (s <= 33) return "#E76F51";
  if (s <= 66) return "#B99A65";
  return "#00C9A7";
}

export default function SignupPage() {
  const [displayName, setDisplayName]   = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [done, setDone]                 = useState(false);
  const [isPending, startTransition]    = useTransition();
  const router = useRouter();

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
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#101B2B]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="luxury-glass-dark p-10 rounded-3xl border border-[#B99A65]/40 max-w-md w-full text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#B99A65]/15 border border-[#B99A65]/40 flex items-center justify-center text-[#B99A65] mx-auto">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-normal font-['Playfair_Display'] text-white">
            Verify Your Inscription
          </h2>
          <p className="text-xs text-[#D9C7AC]/80 leading-relaxed font-['Manrope']">
            We sent an activation link to <strong className="text-white">{email}</strong>.
            Click the link in your inbox to unlock your passport to communities, live groups, and emergency safety telemetry.
          </p>
          <div className="pt-4">
            <Link href="/login" className="px-8 py-3.5 rounded-full btn-luxury-gold text-xs inline-block">
              Proceed to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const strength = getPasswordStrength(password);
  const strengthColor = getStrengthColor(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#101B2B] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#B99A65]/10 rounded-full blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
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
            Begin Your Chapter
          </h1>
          <p className="text-xs text-[#D9C7AC]/70 font-['Manrope'] mt-1">
            Free luxury heritage companion and safety telemetry
          </p>
        </div>

        <div className="luxury-glass-dark p-8 sm:p-10 rounded-3xl border border-white/15 shadow-2xl">
          <form onSubmit={handleSignup} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#D9C7AC] font-mono">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8E9BAE] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  className="input pl-11"
                  placeholder="e.g. Princess Gayatri"
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setErrors((p) => ({ ...p, displayName: "" })); }}
                  required
                  autoComplete="name"
                />
              </div>
              {errors.displayName && <p className="text-xs text-[#E76F51]">{errors.displayName}</p>}
            </div>

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
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                  required
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-[#E76F51]">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#D9C7AC] font-mono">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8E9BAE] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input pl-11 pr-12"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                  required
                  autoComplete="new-password"
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

              {password.length > 0 && (
                <>
                  <div className="pw-strength-bar">
                    <motion.div
                      className="pw-strength-fill"
                      animate={{ width: `${strength}%`, backgroundColor: strengthColor }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="space-y-1 pt-1">
                    {passwordRequirements.map(({ label, check }) => {
                      const met = check(password);
                      return (
                        <div key={label} className="flex items-center gap-2 text-[11px] font-['Manrope']">
                          <CheckCircle className={`w-3 h-3 ${met ? "text-emerald-400" : "text-white/30"}`} />
                          <span className={met ? "text-emerald-300" : "text-white/40"}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {errors.password && <p className="text-xs text-[#E76F51]">{errors.password}</p>}
            </div>

            {errors.form && <p className="text-xs text-[#E76F51]">{errors.form}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 rounded-full btn-luxury-gold text-xs shadow-xl active:scale-95 disabled:opacity-50 mt-2 font-['Manrope']"
            >
              {isPending ? (
                <span className="w-4 h-4 border-2 border-[#101B2B] border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Create Travel Passport</span>
                </span>
              )}
            </button>
          </form>

          <div className="divider-label my-6"><span>or</span></div>

          <p className="text-center text-xs text-[#D9C7AC]/80 font-['Manrope']">
            Already registered?{" "}
            <Link href="/login" className="text-[#B99A65] font-bold hover:underline">
              Sign In Here →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
