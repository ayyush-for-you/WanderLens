"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Compass, MapPin, ArrowRight } from "lucide-react";

// Dynamically import Leaflet map preview to avoid SSR issues
const LandingMap = dynamic(() => import("./LandingMapInner"), { ssr: false });

const MAP_MONUMENTS = [
  {
    id: 1,
    name: "Hawa Mahal",
    city: "Jaipur",
    state: "Rajasthan",
    lat: 26.9239,
    lng: 75.8267,
    era: "1799 AD · Rajput Era",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600",
  },
  {
    id: 2,
    name: "Taj Mahal",
    city: "Agra",
    state: "Uttar Pradesh",
    lat: 27.1751,
    lng: 78.0421,
    era: "1631 AD · Mughal Golden Age",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600",
  },
  {
    id: 3,
    name: "Qutub Minar",
    city: "New Delhi",
    state: "Delhi",
    lat: 28.5244,
    lng: 77.1855,
    era: "1192 AD · Delhi Sultanate",
    image: "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=600",
  },
  {
    id: 4,
    name: "Red Fort",
    city: "Old Delhi",
    state: "Delhi",
    lat: 28.6562,
    lng: 77.2410,
    era: "1638 AD · Mughal Imperial",
    image: "https://images.unsplash.com/photo-1592635196078-9ffc8f654b9d?w=600",
  },
  {
    id: 5,
    name: "Humayun's Tomb",
    city: "New Delhi",
    state: "Delhi",
    lat: 28.5933,
    lng: 77.2507,
    era: "1558 AD · Mughal Precursor",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600",
  },
];

export default function InteractiveMapSection() {
  const [selectedMonument, setSelectedMonument] = useState(MAP_MONUMENTS[0]);

  return (
    <section id="interactive-map" className="theme-section-dark py-28 md:py-36 px-6 relative border-t border-white/10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-[#B99A65]" />
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#B99A65] uppercase font-['Manrope']">
                Cartographic Intelligence
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal font-['Playfair_Display'] text-[#F5F0E7] leading-tight">
              The World Is Yours{" "}
              <span className="italic font-['Cormorant_Garamond'] text-[#B99A65] font-light">
                to Explore.
              </span>
            </h2>
          </div>

          <Link
            href="/discover"
            className="px-6 py-3 rounded-full btn-luxury-gold text-xs flex items-center gap-2 self-start md:self-auto"
          >
            <Compass className="w-4 h-4" />
            <span>Open Dedicated Map Room</span>
          </Link>
        </div>

        {/* Map Frame Container */}
        <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl h-[560px] bg-[#0E1522]">
          <LandingMap
            monuments={MAP_MONUMENTS}
            onSelect={(m) => setSelectedMonument(m)}
          />

          {/* Floating Refined Destination Story Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={selectedMonument.id}
            className="absolute bottom-6 left-6 right-6 sm:right-auto sm:max-w-md z-[1000] luxury-glass-dark p-5 rounded-2xl border border-white/20 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/20 flex-shrink-0">
                <img
                  src={selectedMonument.image}
                  alt={selectedMonument.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <span className="text-[10px] font-mono text-[#B99A65] uppercase tracking-wider block">
                  {selectedMonument.era}
                </span>
                <h4 className="text-lg font-bold font-['Playfair_Display'] text-white">
                  {selectedMonument.name}
                </h4>
                <div className="text-[11px] text-[#D9C7AC]/70 flex items-center gap-1.5 mt-0.5 font-['Manrope']">
                  <MapPin className="w-3 h-3 text-[#B99A65]" />
                  <span>
                    {selectedMonument.city}, {selectedMonument.state} · {selectedMonument.lat.toFixed(4)}°N,{" "}
                    {selectedMonument.lng.toFixed(4)}°E
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-white/50 font-mono">Coordinates Verified</span>
              <Link
                href="/scan"
                className="px-3.5 py-1.5 rounded-lg bg-[#B99A65] hover:bg-[#caa974] text-[#101B2B] text-xs font-bold font-['Manrope'] flex items-center gap-1.5 shadow"
              >
                <span>Scan Site</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
