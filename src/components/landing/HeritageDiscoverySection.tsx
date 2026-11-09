"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Camera } from "lucide-react";

const HERITAGE_DESTINATIONS = [
  {
    id: 1,
    title: "Taj Mahal",
    location: "Agra, Uttar Pradesh",
    era: "Mughal Golden Age (1631 AD)",
    description: "An ivory-white marble mausoleum on the south bank of the Yamuna River, renowned for its flawless symmetry and Pietra Dura floral inlay.",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1000&q=80&auto=format&fit=crop",
    tag: "taj_mahal",
  },
  {
    id: 2,
    title: "Hawa Mahal",
    location: "Jaipur, Rajasthan",
    era: "Rajput Era (1799 AD)",
    description: "The Palace of Winds features 953 honeycombed jharokhas built of pink and red sandstone to let royal ladies observe bazaar festivities unseen.",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1000&q=80&auto=format&fit=crop",
    tag: "hawa_mahal",
  },
  {
    id: 3,
    title: "Qutub Minar",
    location: "New Delhi, Delhi",
    era: "Delhi Sultanate (1192 AD)",
    description: "A 72.5-metre victory minaret built with fluted red sandstone storeys and Quranic calligraphy, standing inside an ancient complex.",
    image: "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=1000&q=80&auto=format&fit=crop",
    tag: "qutub_minar",
  },
  {
    id: 4,
    title: "Red Fort",
    location: "Old Delhi, Delhi",
    era: "Mughal Imperial Seat (1638 AD)",
    description: "The historic fortified palace of Shahjahanabad, boasting the iconic Lahore Gate where India's sovereign flag is hoisted every Independence Day.",
    image: "https://images.unsplash.com/photo-1592635196078-9ffc8f654b9d?w=1000&q=80&auto=format&fit=crop",
    tag: "red_fort",
  },
  {
    id: 5,
    title: "Amer Fort & Palace",
    location: "Amer, Jaipur",
    era: "Rajput-Mughal Fusion (1592 AD)",
    description: "Perched high on Cheel ka Teela, overlooking Maota Lake, famed for the Sheesh Mahal mirror palace and ornate carved gateways.",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1000&q=80&auto=format&fit=crop",
    tag: "amer_fort",
  },
  {
    id: 6,
    title: "Konark Sun Temple",
    location: "Konark, Odisha",
    era: "Eastern Ganga Dynasty (1250 AD)",
    description: "Conceived as a colossal stone chariot of the Sun God Surya with 24 elaborately carved stone wheels drawn by seven horses.",
    image: "https://images.unsplash.com/photo-1600100397608-f010f443b740?w=1000&q=80&auto=format&fit=crop",
    tag: "konark",
  },
];

export default function HeritageDiscoverySection() {
  const [activeDestination, setActiveDestination] = useState(HERITAGE_DESTINATIONS[0]);

  return (
    <section id="heritage-discovery" className="theme-section-dark py-28 md:py-36 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-[#B99A65]" />
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#B99A65] uppercase font-['Manrope']">
                Curated Heritage Catalogue
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal font-['Playfair_Display'] text-[#F5F0E7] leading-tight">
              History Is Waiting{" "}
              <span className="italic font-['Cormorant_Garamond'] text-[#B99A65] font-light">
                to Be Discovered.
              </span>
            </h2>
          </div>

          <Link
            href="/scan"
            className="px-6 py-3 rounded-full btn-luxury-outline text-xs flex items-center gap-2.5 self-start md:self-auto"
          >
            <Camera className="w-4 h-4 text-[#B99A65]" />
            <span>Launch Monument Scanner</span>
          </Link>
        </div>

        {/* Magazine Style Asymmetrical Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Main Showcase Hero (Left 7 Cols) */}
          <div className="md:col-span-7 space-y-4">
            <div className="relative rounded-3xl overflow-hidden aspect-[16/10] border border-white/10 group shadow-2xl">
              <img
                src={activeDestination.image}
                alt={activeDestination.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101B2B] via-transparent to-transparent" />

              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] uppercase tracking-wider font-mono text-[#D9C7AC] border border-white/10">
                {activeDestination.era}
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div>
                  <h3 className="text-2xl sm:text-4xl font-normal font-['Playfair_Display'] text-white">
                    {activeDestination.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#D9C7AC] mt-1 font-['Manrope']">
                    <MapPin className="w-3.5 h-3.5 text-[#B99A65]" />
                    <span>{activeDestination.location}</span>
                  </div>
                </div>

                <Link
                  href="/scan"
                  className="p-3.5 rounded-full bg-[#B99A65] hover:bg-[#caa974] text-[#101B2B] shadow-lg transition-transform hover:scale-110 active:scale-95"
                  title="Scan & Reveal History"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#D9C7AC]/80 font-light leading-relaxed pl-2 font-['Manrope']">
              {activeDestination.description}
            </p>
          </div>

          {/* Interactive Roster (Right 5 Cols) */}
          <div className="md:col-span-5 space-y-3">
            <div className="text-[11px] font-bold tracking-widest text-[#B99A65] uppercase font-mono mb-2">
              Select Destination:
            </div>

            {HERITAGE_DESTINATIONS.map((dest) => {
              const isSelected = dest.id === activeDestination.id;
              return (
                <div
                  key={dest.id}
                  onClick={() => setActiveDestination(dest)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? "bg-[#B99A65]/15 border-[#B99A65] shadow-lg shadow-[#B99A65]/10"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 flex-shrink-0">
                      <img src={dest.image} alt={dest.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold font-['Playfair_Display'] text-white group-hover:text-[#B99A65] transition-colors">
                        {dest.title}
                      </div>
                      <div className="text-[11px] text-[#D9C7AC]/70 font-['Manrope']">{dest.location}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[#B99A65] opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
