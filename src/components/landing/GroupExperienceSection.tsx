"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Radio, Bell, ArrowRight } from "lucide-react";

export default function GroupExperienceSection() {
  return (
    <section id="group-experience" className="theme-section-dark py-28 md:py-36 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Editorial Copy */}
          <div className="lg:col-span-6 space-y-6 order-2 lg:order-1">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-[#B99A65]" />
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#B99A65] uppercase font-['Manrope']">
                Group Travel Mode
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal font-['Playfair_Display'] text-[#F5F0E7] leading-tight">
              Together Is a Better{" "}
              <span className="italic font-['Cormorant_Garamond'] text-[#00C9A7] font-light">
                Way to Explore.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#D9C7AC]/90 font-light font-['Manrope'] leading-relaxed">
              Travel together, stay connected and experience every destination without losing sight of your group.
            </p>

            <ul className="space-y-3.5 text-xs sm:text-sm text-[#D9C7AC]/80 pt-2 font-light font-['Manrope']">
              <li className="flex items-center gap-3">
                <Users className="w-4 h-4 text-[#00C9A7] flex-shrink-0" />
                <span>Real-time multi-user location synchronization with low-latency Supabase channels.</span>
              </li>
              <li className="flex items-center gap-3">
                <Radio className="w-4 h-4 text-[#00C9A7] flex-shrink-0" />
                <span>Active member roster with instant online/offline indicators and status badges.</span>
              </li>
              <li className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#00C9A7] flex-shrink-0" />
                <span>One-touch broadcast alerts to the entire group or private member pings.</span>
              </li>
            </ul>

            <div className="pt-4">
              <Link
                href="/groups"
                className="px-8 py-4 rounded-full btn-luxury-gold flex items-center gap-3 text-xs shadow-xl active:scale-95 group w-fit"
              >
                <span>Explore Group Mode</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: Shared Map & Member Preview */}
          <div className="lg:col-span-6 relative order-1 lg:order-2">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20 aspect-[4/3] relative bg-[#0E1522] p-4 flex flex-col justify-between">
              {/* Simulated Map Header */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-[#00C9A7] font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>3 Members Synchronized · Delhi Heritage Corridor</span>
                </div>
              </div>

              {/* Animated Map Markers Gliding across preview */}
              <div className="relative w-full h-44 my-auto flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#B99A65_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Member 1: Alice */}
                <motion.div
                  animate={{
                    x: [0, 40, 10, 0],
                    y: [0, -20, 15, 0],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 left-16 flex items-center gap-1.5"
                >
                  <div className="w-7 h-7 rounded-full bg-[#6C63FF] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                    A
                  </div>
                  <span className="text-[10px] font-mono text-white/80 bg-black/60 px-1.5 py-0.5 rounded">
                    Alice
                  </span>
                </motion.div>

                {/* Member 2: Bob */}
                <motion.div
                  animate={{
                    x: [0, -30, 20, 0],
                    y: [0, 25, -10, 0],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-10 right-20 flex items-center gap-1.5"
                >
                  <div className="w-7 h-7 rounded-full bg-[#00C9A7] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                    B
                  </div>
                  <span className="text-[10px] font-mono text-white/80 bg-black/60 px-1.5 py-0.5 rounded">
                    Bob
                  </span>
                </motion.div>

                {/* Member 3: You */}
                <div className="absolute center flex items-center gap-1.5">
                  <div className="pulse-user-pin" />
                  <span className="text-[10px] font-mono text-[#B99A65] bg-black/70 px-2 py-0.5 rounded font-bold border border-[#B99A65]/40">
                    You
                  </span>
                </div>
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="z-10 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-between text-[11px] text-white/70 font-mono">
                <span>Broadcast Channel: trek-crew-delhi</span>
                <span className="text-emerald-400">Latency &lt; 200ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
