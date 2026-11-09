"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";

const HISTORICAL_STORIES = [
  {
    era: "1648 AD · Mughal Empire",
    title: "The Mirror Palaces of Shah Jahan",
    monument: "Red Fort & Amer Palace",
    narrative:
      "In the twilight of the Mughal architectural renaissance, Master artisans embedded thousands of Belgian convex mirrors into stucco ceilings so that a single oil lamp would illuminate the entire chamber like a galaxy of stars.",
    quote: "“If there be a paradise on earth, it is this, it is this, it is this.” — Diwan-i-Khas Inscription",
    image: "https://images.unsplash.com/photo-1592635196078-9ffc8f654b9d?w=1000&q=80&auto=format&fit=crop",
  },
  {
    era: "1799 AD · Rajput Royalty",
    title: "A Crown of Winds for Royal Ladies",
    monument: "Hawa Mahal, Jaipur",
    narrative:
      "Without a traditional foundation, Lal Chand Ustad erected a soaring 50-foot screen wall resembling Lord Krishna's crown, pierced by 953 stone-latticed jharokhas that channeled cool desert breezes through the Venturi effect.",
    quote: "“Crafted so the women of the court could witness everyday processions unseen by the gaze of the street.”",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1000&q=80&auto=format&fit=crop",
  },
  {
    era: "1192 AD · Delhi Sultanate",
    title: "The Unyielding Victory Minaret",
    monument: "Qutub Minar Complex",
    narrative:
      "Standing at 72.5 metres, Qutub Minar defied multiple earthquakes and lightning strikes over eight centuries. Each dynasty repaired its fluted columns using distinctive stones — red sandstone, followed by white marble.",
    quote: "“The highest brick victory minaret in the world, etched with Quranic verses and nagari inscriptions.”",
    image: "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=1000&q=80&auto=format&fit=crop",
  },
];

export default function StorytellingSection() {
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const activeStory = HISTORICAL_STORIES[activeStoryIdx];

  return (
    <section id="historical-storytelling" className="theme-section-light py-28 md:py-36 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-[#B99A65]" />
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#B99A65] uppercase font-['Manrope']">
                Historical Storytelling
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal font-['Playfair_Display'] text-[#242321] leading-tight">
              Every Stone{" "}
              <span className="italic font-['Cormorant_Garamond'] text-[#B99A65] font-light">
                Has a Story.
              </span>
            </h2>
          </div>

          {/* Era Navigation Pills */}
          <div className="flex items-center gap-2">
            {HISTORICAL_STORIES.map((s, idx) => (
              <button
                key={s.era}
                onClick={() => setActiveStoryIdx(idx)}
                className={`px-4 py-2 rounded-full text-xs font-semibold font-['Manrope'] transition-all ${
                  idx === activeStoryIdx
                    ? "bg-[#101B2B] text-white shadow-md"
                    : "bg-[#D9C7AC]/30 text-[#242321] hover:bg-[#D9C7AC]/60"
                }`}
              >
                Story 0{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Editorial Story Spread */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStory.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            {/* Story Image */}
            <div className="lg:col-span-7 rounded-3xl overflow-hidden shadow-2xl aspect-[16/10] border-4 border-white relative">
              <img
                src={activeStory.image}
                alt={activeStory.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white text-xs font-serif italic text-white/90 drop-shadow">
                {activeStory.quote}
              </div>
            </div>

            {/* Story Text */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-[#B99A65] uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>{activeStory.era}</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-normal font-['Playfair_Display'] text-[#242321] leading-tight">
                {activeStory.title}
              </h3>

              <div className="flex items-center gap-2 text-xs font-semibold text-[#B99A65] font-['Manrope']">
                <MapPin className="w-3.5 h-3.5" />
                <span>{activeStory.monument}</span>
              </div>

              <p className="text-sm text-[#242321]/80 font-light leading-relaxed font-['Manrope']">
                {activeStory.narrative}
              </p>

              <div className="p-4 rounded-2xl bg-[#D9C7AC]/20 border border-[#D9C7AC]/40 text-xs text-[#242321]/70 italic font-serif">
                Uncovered and verified by Archaeological Survey records on WanderLens.
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
