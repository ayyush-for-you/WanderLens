"use client";

import { useState, useEffect } from "react";
import {
  Compass,
  Star,
  MapPin,
  Filter,
  Sparkles,
  Map as MapIcon,
  List as ListIcon,
  ChevronDown,
  Info,
  Clock,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Destination, PlaceCategory, Profile } from "@/types/database";
import type { RankedPlaceResult } from "@/lib/recommendations/ranking";
import dynamic from "next/dynamic";
import PlaceDetailModal from "./PlaceDetailModal";

const DiscoverMap = dynamic(() => import("./DiscoverMap"), { ssr: false });

interface DiscoverClientProps {
  initialDestinations: Destination[];
  profile: Profile | null;
}

const CATEGORIES: { key: PlaceCategory | "all"; label: string }[] = [
  { key: "all", label: "All Gems" },
  { key: "heritage", label: "Heritage" },
  { key: "food", label: "Food & Cafes" },
  { key: "nature", label: "Nature & Parks" },
  { key: "viewpoint", label: "Viewpoints" },
  { key: "market", label: "Bazaars" },
  { key: "culture", label: "Culture" },
  { key: "other", label: "Other" },
];

const SORTS: { key: "hidden_gems" | "top_rated" | "nearest"; label: string }[] = [
  { key: "hidden_gems", label: "Best Hidden Gems (Default)" },
  { key: "top_rated", label: "Top Rated" },
  { key: "nearest", label: "Nearest to Me" },
];

/* ─── Shared style tokens ─────────────────────────────────────────── */
const panelStyle: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 14,
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
};

const selectStyle: React.CSSProperties = {
  colorScheme: "dark",
  height: 40,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  color: "var(--text)",
  padding: "0 12px",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  outline: "none",
  cursor: "pointer",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
};

export default function DiscoverClient({
  initialDestinations,
  profile,
}: DiscoverClientProps) {
  const [destinations] = useState<Destination[]>(initialDestinations);

  // ── Read optional ?destination=<name> query param on first mount ──────────
  // Case-insensitive prefix match: "Delhi" matches "Delhi (National Capital Territory)".
  // Falls back to initialDestinations[0] if no match is found.
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(
    () => {
      const defaultId = initialDestinations[0]?.id || "";
      if (typeof window === "undefined") return defaultId;
      try {
        const param = new URLSearchParams(window.location.search).get("destination");
        if (param) {
          const lower = param.toLowerCase();
          const match = initialDestinations.find((d) =>
            d.name.toLowerCase().startsWith(lower)
          );
          if (match) return match.id;
        }
      } catch {
        // ignore – fall through to default
      }
      return defaultId;
    }
  );

  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"hidden_gems" | "top_rated" | "nearest">("hidden_gems");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Places state
  const [places, setPlaces] = useState<RankedPlaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenGemsCount, setHiddenGemsCount] = useState(0);

  // Active detail modal
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // User coordinates
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Acquire user location for distance calculations
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Ignore permission rejection
        },
        { timeout: 6000 }
      );
    }
  }, []);

  // Fetch recommendations whenever destination, category, sort, or coords change
  const fetchRecommendations = async () => {
    if (!selectedDestinationId) return;
    setLoading(true);

    try {
      let url = `/api/destinations/${selectedDestinationId}/recommendations?sort=${sortBy}`;
      if (category !== "all") url += `&category=${category}`;
      if (coords) url += `&lat=${coords.lat}&lng=${coords.lng}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPlaces(json.places || []);
        setHiddenGemsCount(json.hidden_gems_count || 0);
      } else {
        toast.error("Could not load recommendations");
      }
    } catch {
      toast.error("Network error loading places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedDestinationId, category, sortBy, coords]);

  const activeDestination = destinations.find((d) => d.id === selectedDestinationId);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ink)",
        paddingTop: 96,
        paddingBottom: 64,
        fontFamily: "inherit",
      }}
    >
      {/* ── Shimmer / card-entrance animations ── */}
      <style>{`
        @keyframes wl-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes wl-card-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wl-skeleton {
          background: linear-gradient(
            90deg,
            var(--hover) 25%,
            rgba(255,255,255,0.09) 50%,
            var(--hover) 75%
          );
          background-size: 800px 100%;
          animation: wl-shimmer 1.6s linear infinite;
        }
        .wl-card-enter {
          animation: wl-card-up 0.6s var(--ease) both;
        }
        .wl-chip {
          height: 34px;
          padding: 0 16px;
          border-radius: 999px;
          font-size: 0.8125rem;
          font-weight: 500;
          white-space: nowrap;
          border: 1px solid var(--line);
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
          background: transparent;
          color: var(--soft);
          font-family: inherit;
          display: inline-flex;
          align-items: center;
        }
        .wl-chip:hover {
          background: var(--hover);
          color: #fff;
        }
        .wl-chip.active {
          background: #fff;
          color: #0b0f12;
          border-color: #fff;
        }
        .wl-place-card {
          border-radius: 16px;
          background: var(--panel);
          border: 1px solid var(--line);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition:
            transform 0.35s var(--ease),
            border-color 0.35s ease,
            box-shadow 0.35s ease;
        }
        .wl-place-card:hover,
        .wl-place-card:focus-within {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.18);
          box-shadow: 0 24px 50px -24px rgba(0,0,0,0.7);
        }
        .wl-place-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s var(--ease);
        }
        .wl-place-card:hover .wl-place-card-img,
        .wl-place-card:focus-within .wl-place-card-img {
          transform: scale(1.05);
        }
        @media (prefers-reduced-motion: reduce) {
          .wl-card-enter,
          .wl-skeleton {
            animation: none !important;
          }
          .wl-place-card,
          .wl-place-card-img {
            transition: none !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>

        {/* ── Header & Destination Bar ────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--soft)",
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  padding: "3px 10px",
                }}
              >
                Community-Ranked
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                Formula-verified · No ad bias
              </span>
            </div>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 500,
                color: "var(--text)",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                fontFamily: "inherit",
              }}
            >
              Discover Hidden Gems
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: 6 }}>
              Lesser-known, high-rated places with genuine traveller appreciation.
            </p>
          </div>

          {/* Destination Dropdown + View Mode Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <select
                value={selectedDestinationId}
                onChange={(e) => setSelectedDestinationId(e.target.value)}
                style={{ ...selectStyle, colorScheme: "dark", minWidth: 180, paddingRight: 32, fontWeight: 500 }}
                aria-label="Select Destination"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.region})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted)",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* View Mode Toggle: List vs Map */}
            <div
              style={{
                display: "flex",
                height: 40,
                borderRadius: 10,
                border: "1px solid var(--line)",
                overflow: "hidden",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: "0 12px",
                  border: "none",
                  background: viewMode === "list" ? "var(--hover)" : "transparent",
                  color: viewMode === "list" ? "var(--text)" : "var(--muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  transition: "background 0.2s ease, color 0.2s ease",
                  fontFamily: "inherit",
                }}
                title="List View"
              >
                <ListIcon size={14} /> List
              </button>
              <button
                onClick={() => setViewMode("map")}
                style={{
                  padding: "0 12px",
                  border: "none",
                  background: viewMode === "map" ? "var(--hover)" : "transparent",
                  color: viewMode === "map" ? "var(--text)" : "var(--muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  transition: "background 0.2s ease, color 0.2s ease",
                  fontFamily: "inherit",
                }}
                title="Map View"
              >
                <MapIcon size={14} /> Map
              </button>
            </div>
          </div>
        </div>

        {/* ── Category Chips Bar ──────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 8,
            marginBottom: 18,
            scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`wl-chip${category === key ? " active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Sort & Sub-heading Bar ──────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={14} style={{ color: "var(--soft)" }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--soft)" }}>
              {hiddenGemsCount} Hidden Gems
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              out of {places.length} places in {activeDestination?.name}
            </span>
          </div>

          {/* Sort Select */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Sort:
            </span>
            <div style={{ position: "relative" }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ ...selectStyle, colorScheme: "dark", height: 36, paddingRight: 28, fontSize: "0.8rem" }}
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── MAP VIEW ───────────────────────────────────────────── */}
        {viewMode === "map" ? (
          <div className="animate-fade-in" style={{ marginBottom: 24 }}>
            <DiscoverMap
              places={places}
              destinationName={activeDestination?.name || "Delhi"}
              onSelectPlace={(id) => setSelectedPlaceId(id)}
            />
          </div>
        ) : null}

        {/* ── Places Cards Grid ───────────────────────────────────── */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="wl-skeleton"
                style={{
                  height: 300,
                  borderRadius: 16,
                  border: "1px solid var(--line)",
                }}
              />
            ))}
          </div>
        ) : places.length === 0 ? (
          <div
            style={{
              ...panelStyle,
              padding: "56px 24px",
              textAlign: "center",
            }}
          >
            <Compass size={36} style={{ color: "var(--muted)", margin: "0 auto 14px" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 500, color: "var(--text)", marginBottom: 6, fontFamily: "inherit" }}>
              No places found
            </h3>
            <p
              style={{
                color: "var(--muted)",
                fontSize: "0.85rem",
                maxWidth: 320,
                margin: "0 auto 20px",
                lineHeight: 1.5,
              }}
            >
              No places in this category currently match the hidden gem criteria. Try selecting &quot;All Gems&quot;.
            </p>
            <button
              onClick={() => setCategory("all")}
              style={{
                height: 36,
                padding: "0 20px",
                background: "var(--hover)",
                border: "1px solid var(--line)",
                borderRadius: 999,
                color: "var(--soft)",
                fontSize: "0.875rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Show All Places
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {places.map((place, idx) => (
              <div
                key={place.id}
                className="wl-place-card wl-card-enter"
                style={{ animationDelay: `${Math.min(idx, 7) * 60}ms` }}
                onClick={() => setSelectedPlaceId(place.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelectedPlaceId(place.id)}
                aria-label={`View details for ${place.name}`}
              >
                {/* ── Image Area (16:10) ── */}
                <div
                  style={{
                    position: "relative",
                    paddingTop: "62.5%", /* 16:10 */
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(135deg, #16222b, #0b1013)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "capitalize" }}>
                        {place.category}
                      </span>
                    </div>

                  {/* Dark gradient overlay at bottom for rating */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(8,11,13,0.82) 0%, rgba(8,11,13,0.1) 50%, rgba(8,11,13,0) 100%)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Top badges row */}
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      right: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Category tag */}
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 500,
                        textTransform: "capitalize",
                        color: "rgba(255,255,255,0.85)",
                        background: "rgba(255,255,255,0.12)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        borderRadius: 999,
                        padding: "3px 9px",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {place.category}
                    </span>

                    {/* Hidden gem badge */}
                    {place.is_hidden_gem && (
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: "#fff",
                          color: "#0b0f12",
                          fontSize: "0.68rem",
                          fontWeight: 500,
                          letterSpacing: "0.03em",
                        }}
                      >
                        Hidden Gem
                      </span>
                    )}
                  </div>

                  {/* Bottom: rating pill + distance */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 10,
                      left: 10,
                      right: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        padding: "3px 8px",
                        borderRadius: 999,
                      }}
                    >
                      <Star size={12} fill="#fff" color="#fff" />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff" }}>
                        {place.avg_rating.toFixed(1)}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)" }}>
                        ({place.n_ratings})
                      </span>
                    </div>

                    {place.distance_m !== null && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 500,
                          color: "rgba(255,255,255,0.8)",
                          background: "rgba(0,0,0,0.55)",
                          backdropFilter: "blur(6px)",
                          WebkitBackdropFilter: "blur(6px)",
                          padding: "3px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {(place.distance_m / 1000).toFixed(1)} km
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Card Body ── */}
                <div
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: 500,
                        color: "var(--text)",
                        marginBottom: 4,
                        lineHeight: 1.3,
                        fontFamily: "inherit",
                      }}
                    >
                      {place.name}
                    </h3>
                    {place.description && (
                      <p
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--muted)",
                          lineHeight: 1.45,
                          marginBottom: 10,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {place.description}
                      </p>
                    )}
                  </div>

                  {/* ── Rationale line ── */}
                  <div
                    style={{
                      paddingTop: 8,
                      borderTop: "1px solid var(--line)",
                      marginTop: 8,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.76rem",
                        color: "var(--muted)",
                        lineHeight: 1.4,
                      }}
                    >
                      {place.recommendation_reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Place Detail & Reviews Modal ────────────────────────── */}
        {selectedPlaceId && (
          <PlaceDetailModal
            placeId={selectedPlaceId}
            profile={profile}
            isOpen={Boolean(selectedPlaceId)}
            onClose={() => {
              setSelectedPlaceId(null);
              fetchRecommendations(); // Refresh stats in case ratings changed
            }}
          />
        )}
      </div>
    </div>
  );
}
