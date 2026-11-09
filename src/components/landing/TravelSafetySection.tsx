"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  AlertOctagon,
  Radio,
  Users,
  Bell,
  Lock,
  MapPin,
} from "lucide-react";

const SAFETY_PILLARS = [
  {
    icon: AlertOctagon,
    title: "Emergency SOS",
    color: "#E76F51",
    description: "1-second press-and-hold distress trigger broadcasts your exact GPS coordinates to nearby users within 2 km and stores to audit log.",
  },
  {
    icon: Radio,
    title: "Real-Time Location Sharing",
    color: "#00C9A7",
    description: "Encrypted WebSocket streams share your movement strictly within active group rooms — zero location leaks to non-members.",
  },
  {
    icon: Users,
    title: "Group Member Tracking",
    color: "#759BB7",
    description: "Keep visual contact with your travel party across crowded bazaars, remote ruins, and expansive temple corridors.",
  },
  {
    icon: Bell,
    title: "Priority Emergency Alerts",
    color: "#B99A65",
    description: "Instant broadcast alerts for emergency gatherings, regroup pings, or private direct member pings.",
  },
  {
    icon: MapPin,
    title: "Location Awareness",
    color: "#A3B5A0",
    description: "Orient your position on dark Google Maps, tracking your distance from known heritage coordinates.",
  },
  {
    icon: Lock,
    title: "Cloud RBAC & PostGIS",
    color: "#D9C7AC",
    description: "Enterprise data protection with Row-Level Security, parameterized PostGIS geospatial queries, and bcrypt password hashing.",
  },
];

export default function TravelSafetySection() {
  return (
    <section id="travel-safety" className="theme-section-charcoal py-28 md:py-36 px-6 relative overflow-hidden border-t border-white/10">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E76F51]/30 bg-[#E76F51]/10 text-[#E76F51] text-[11px] font-bold tracking-widest uppercase font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>Intelligent Safety Architecture</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal font-['Playfair_Display'] text-[#F5F0E7] leading-tight">
            Explore Freely.{" "}
            <span className="italic font-['Cormorant_Garamond'] text-[#E76F51] font-light">
              Travel Confidently.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-[#D9C7AC]/80 font-light font-['Manrope'] leading-relaxed">
            Exploration and personal safety belong together. WanderLens protects independent and group travelers through a sophisticated telemetry net that never intrudes until you need it.
          </p>
        </div>

        {/* 6 Safety Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAFETY_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="luxury-glass-dark p-6 rounded-2xl border border-white/10 hover:border-[#B99A65]/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${pillar.color}20`, color: pillar.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-['Playfair_Display'] text-white mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-[#D9C7AC]/70 font-light leading-relaxed font-['Manrope']">
                    {pillar.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/40">
                  <span>Pillar 0{idx + 1}</span>
                  <span className="text-emerald-400">Active Node</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Simulated Emergency Command Banner */}
        <div className="p-8 rounded-3xl luxury-glass-dark border border-[#E76F51]/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E76F51]/20 border border-[#E76F51]/40 flex items-center justify-center text-[#E76F51] flex-shrink-0 animate-pulse">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold font-['Playfair_Display'] text-white">
                Emergency SOS Dispatch Net
              </div>
              <div className="text-xs text-[#D9C7AC]/70 font-['Manrope']">
                Rate-limited to 3 triggers per hour to prevent accidental misuse. Protected by database audit logs.
              </div>
            </div>
          </div>

          <Link
            href="/sos"
            className="px-6 py-2.5 rounded-full bg-[#E76F51] hover:bg-[#d65f42] text-white text-xs font-bold font-['Manrope'] uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <span>Test SOS Safety Mode</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
