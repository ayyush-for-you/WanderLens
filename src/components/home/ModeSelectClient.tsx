"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Compass, Users, ArrowRight } from "lucide-react";
import type { Profile } from "@/types/database";

interface ModeSelectClientProps {
  profile: Profile;
}

export default function ModeSelectClient({ profile }: ModeSelectClientProps) {
  const router = useRouter();
  const [leaving, setLeaving] = useState<"solo" | "group" | null>(null);

  const handleSelect = (mode: "solo" | "group") => {
    setLeaving(mode);
    setTimeout(() => {
      if (mode === "solo") router.push("/solo");
      else router.push("/groups");
    }, 350);
  };

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          className="mode-select-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.35 }}
        >
          {/* Editorial Eyebrow */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#B99A65]" />
            <span className="text-[11px] font-bold tracking-[0.25em] text-[#B99A65] uppercase font-['Manrope']">
              Tailored Travel Context
            </span>
          </div>

          <motion.h1
            className="mode-select-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            How do you wish to journey,{" "}
            <span className="italic font-['Cormorant_Garamond'] text-[#B99A65]">
              {profile.display_name.split(" ")[0]}
            </span>
            ?
          </motion.h1>

          <div className="mode-cards">
            {/* Solo Mode Card */}
            <motion.div
              className="mode-card solo group"
              role="button"
              tabIndex={0}
              onClick={() => handleSelect("solo")}
              onKeyDown={(e) => e.key === "Enter" && handleSelect("solo")}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#B99A65]/15 border border-[#B99A65]/30 flex items-center justify-center text-[#B99A65] mb-6 group-hover:scale-110 transition-transform">
                <Compass className="w-8 h-8" />
              </div>
              <h2>SOLO MODE</h2>
              <p>
                Explore freely at your own pace. Private location stream, high-resolution dark maps, and instant 2 km emergency SOS telemetry.
              </p>
              <button className="w-full py-4 rounded-full btn-luxury-gold flex items-center justify-center gap-2 text-xs shadow-lg mt-auto">
                <span>Enter Solo Sanctuary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Group Mode Card */}
            <motion.div
              className="mode-card group"
              role="button"
              tabIndex={0}
              onClick={() => handleSelect("group")}
              onKeyDown={(e) => e.key === "Enter" && handleSelect("group")}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#00C9A7]/15 border border-[#00C9A7]/30 flex items-center justify-center text-[#00C9A7] mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <h2>GROUP MODE</h2>
              <p>
                Synchronized collective travel. Real-time multi-member location tracking, group broadcast alerts, and private party coordination.
              </p>
              <button className="w-full py-4 rounded-full btn-luxury-outline flex items-center justify-center gap-2 text-xs hover:border-[#00C9A7] hover:text-[#00C9A7] mt-auto">
                <span>Enter Travel Party</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-xs text-[#D9C7AC]/60 font-['Manrope']"
          >
            Context can be switched fluidly anytime from the top navigation bar.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
