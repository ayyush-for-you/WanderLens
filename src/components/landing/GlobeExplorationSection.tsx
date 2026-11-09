"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";

const HERITAGE_NODES = [
  {
    name: "Jaipur Circuit",
    state: "Rajasthan",
    lat: "26.92° N",
    lng: "75.82° E",
    sites: "Hawa Mahal, Amer Fort, Jantar Mantar",
    x: 44,
    y: 42,
  },
  {
    name: "Delhi Imperial Center",
    state: "Delhi NCR",
    lat: "28.61° N",
    lng: "77.20° E",
    sites: "Qutub Minar, Red Fort, Humayun’s Tomb",
    x: 48,
    y: 36,
  },
  {
    name: "Agra Mughal Heart",
    state: "Uttar Pradesh",
    lat: "27.17° N",
    lng: "78.04° E",
    sites: "Taj Mahal, Agra Fort, Fatehpur Sikri",
    x: 52,
    y: 40,
  },
  {
    name: "Konark Coastal Temple",
    state: "Odisha",
    lat: "19.88° N",
    lng: "86.09° E",
    sites: "Sun Temple Chariot Wheels",
    x: 64,
    y: 56,
  },
];

export default function GlobeExplorationSection() {
  const [activeNode, setActiveNode] = useState(HERITAGE_NODES[0]);

  return (
    <section className="theme-section-dark py-28 md:py-36 px-6 relative border-t border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#B99A65]/30 bg-[#B99A65]/10 text-[#B99A65] text-[11px] font-bold tracking-widest uppercase font-mono">
            <Globe className="w-3.5 h-3.5" />
            <span>Interactive Heritage Sphere</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal font-['Playfair_Display'] text-[#F5F0E7]">
            Constellations of{" "}
            <span className="italic font-['Cormorant_Garamond'] text-[#B99A65] font-light">
              Indian Heritage.
            </span>
          </h2>
          <p className="text-sm text-[#D9C7AC]/70 font-light max-w-xl mx-auto font-['Manrope']">
            Click on any archaeological circuit node across the Indian subcontinent to inspect its telemetry and monumental wonders.
          </p>
        </div>

        {/* Visual Globe / Radar Projection Canvas */}
        <div className="relative max-w-4xl mx-auto aspect-[16/9] rounded-3xl overflow-hidden luxury-glass-dark border border-white/15 p-6 flex items-center justify-center">
          {/* Subtle concentric orbital rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[500px] rounded-full border border-white/5 animate-spin" style={{ animationDuration: "35s" }} />
            <div className="w-[340px] h-[340px] rounded-full border border-[#B99A65]/10" />
            <div className="w-[200px] h-[200px] rounded-full border border-[#B99A65]/15" />
          </div>

          {/* Subcontinent Map Grid Points */}
          <div className="relative w-full h-full">
            {HERITAGE_NODES.map((node) => {
              const isSelected = node.name === activeNode.name;
              return (
                <div
                  key={node.name}
                  onClick={() => setActiveNode(node)}
                  style={{ top: `${node.y}%`, left: `${node.x}%` }}
                  className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 group"
                >
                  <div className="relative flex items-center justify-center">
                    <span
                      className={`w-4 h-4 rounded-full transition-all ${
                        isSelected ? "bg-[#B99A65] scale-125" : "bg-white/40 group-hover:bg-[#B99A65]"
                      }`}
                    />
                    <span
                      className={`absolute w-8 h-8 rounded-full border border-[#B99A65] animate-ping ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono tracking-wider block mt-1.5 whitespace-nowrap ${
                      isSelected ? "text-[#B99A65] font-bold" : "text-white/60 group-hover:text-white"
                    }`}
                  >
                    {node.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active Node Detail Card Overlay */}
          <motion.div
            key={activeNode.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 left-6 right-6 sm:right-auto sm:max-w-sm luxury-glass-dark p-4 rounded-2xl border border-[#B99A65]/40"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-[#B99A65] mb-1">
              <span>{activeNode.state}</span>
              <span>
                {activeNode.lat}, {activeNode.lng}
              </span>
            </div>
            <h4 className="text-base font-bold font-['Playfair_Display'] text-white">
              {activeNode.name}
            </h4>
            <p className="text-xs text-[#D9C7AC]/70 mt-1 font-['Manrope']">{activeNode.sites}</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
