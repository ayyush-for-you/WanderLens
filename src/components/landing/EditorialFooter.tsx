"use client";

import React from "react";
import { Compass, ArrowUp } from "lucide-react";

export default function EditorialFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="theme-section-dark border-t border-white/10 pt-20 pb-12 px-6 relative">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Oversized Brand Typography */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#B99A65] flex items-center justify-center text-[#101B2B]">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold font-['Playfair_Display'] tracking-tight text-white">
                Wander<span className="text-[#B99A65]">Lens</span>
              </span>
            </div>
            <p className="text-xs text-[#D9C7AC]/70 max-w-sm leading-relaxed font-['Manrope']">
              A luxury travel and heritage discovery platform combining AI vision, archival storytelling, and real-time cloud travel telemetry.
            </p>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#B99A65] hover:text-white transition-colors self-start md:self-auto cursor-pointer"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Column Directory */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs font-['Manrope']">
          {/* Navigation Links */}
          <div className="space-y-3">
            <div className="font-bold uppercase tracking-wider text-[#B99A65] font-mono text-[11px]">
              Platform Navigation
            </div>
            <ul className="space-y-2 text-[#D9C7AC]/80">
              <li>
                <a href="#brand-story" className="hover:text-white transition-colors">
                  Our Philosophy
                </a>
              </li>
              <li>
                <a href="#heritage-discovery" className="hover:text-white transition-colors">
                  Heritage Discovery
                </a>
              </li>
              <li>
                <a href="#interactive-map" className="hover:text-white transition-colors">
                  Interactive Map
                </a>
              </li>
              <li>
                <a href="#solo-experience" className="hover:text-white transition-colors">
                  Solo Travel Mode
                </a>
              </li>
              <li>
                <a href="#group-experience" className="hover:text-white transition-colors">
                  Group Travel Mode
                </a>
              </li>
            </ul>
          </div>

          {/* Curated Heritage */}
          <div className="space-y-3">
            <div className="font-bold uppercase tracking-wider text-[#B99A65] font-mono text-[11px]">
              Featured Monuments
            </div>
            <ul className="space-y-2 text-[#D9C7AC]/80">
              <li>Hawa Mahal, Jaipur</li>
              <li>Taj Mahal, Agra</li>
              <li>Qutub Minar, New Delhi</li>
              <li>Red Fort, Old Delhi</li>
              <li>Amer Fort & Palace</li>
              <li>Konark Sun Temple</li>
            </ul>
          </div>

          {/* Safety & Architecture */}
          <div className="space-y-3">
            <div className="font-bold uppercase tracking-wider text-[#B99A65] font-mono text-[11px]">
              Safety & Architecture
            </div>
            <ul className="space-y-2 text-[#D9C7AC]/80">
              <li>Emergency SOS Dispatch (2km Radius)</li>
              <li>Encrypted WebSocket Sharing</li>
              <li>PostgreSQL Audit Log Ledger</li>
              <li>PostGIS Proximity Search</li>
              <li>FastAPI CLIP Recognition AI</li>
              <li>Row-Level Security (RLS)</li>
            </ul>
          </div>

          {/* Connect & Governance */}
          <div className="space-y-3">
            <div className="font-bold uppercase tracking-wider text-[#B99A65] font-mono text-[11px]">
              Platform Status
            </div>
            <p className="text-[#D9C7AC]/60 text-[11px] leading-relaxed">
              Designed for travelers worldwide. Fully responsive, secure, and compliant with privacy standards.
            </p>
            <div className="pt-2 text-[11px] text-[#B99A65] font-mono">
              Status: All Cloud Services Active ●
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 gap-4 font-mono">
          <div>© 2026 WanderLens. Designed for heritage exploration & safe travel.</div>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer">Privacy Charter</span>
            <span className="hover:text-white cursor-pointer">Security Terms</span>
            <span className="hover:text-white cursor-pointer">AI Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
