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
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  color: "var(--text)",
  padding: "8px 14px",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  outline: "none",
  cursor: "pointer",
};

export default function DiscoverClient({
  initialDestinations,
  profile,
}: DiscoverClientProps) {
  const [destinations] = useState<Destination[]>(initialDestinations);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(
    initialDestinations[0]?.id || ""
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
      }}
    >
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
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#00C9A7",
                  border: "1px solid rgba(0,201,167,0.35)",
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
                fontSize: "clamp(1.5rem, 5vw, 2rem)",
                fontWeight: 500,
                color: "var(--text)",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              Discover Hidden Gems
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: 4 }}>
              Lesser-known, high-rated places with genuine traveller appreciation.
            </p>
          </div>

          {/* Destination Dropdown + View Mode Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={selectedDestinationId}
              onChange={(e) => setSelectedDestinationId(e.target.value)}
              style={{ ...selectStyle, minWidth: 170, fontWeight: 500 }}
              aria-label="Select Destination"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  📍 {d.name} ({d.region})
                </option>
              ))}
            </select>

            {/* View Mode Toggle: List vs Map */}
            <div
              style={{
                display: "flex",
                borderRadius: 10,
                border: "1px solid var(--line)",
                overflow: "hidden",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: "8px 12px",
                  border: "none",
                  background: viewMode === "list" ? "var(--hover)" : "transparent",
                  color: viewMode === "list" ? "var(--text)" : "var(--muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
                title="List View"
              >
                <ListIcon size={15} /> List
              </button>
              <button
                onClick={() => setViewMode("map")}
                style={{
                  padding: "8px 12px",
                  border: "none",
                  background: viewMode === "map" ? "var(--hover)" : "transparent",
                  color: viewMode === "map" ? "var(--text)" : "var(--muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
                title="Map View"
              >
                <MapIcon size={15} /> Map
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
              style={{
                padding: "6px 16px",
                borderRadius: 999,
                fontSize: "0.8125rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                border: "1px solid",
                cursor: "pointer",
                transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
                background: category === key ? "rgba(255,255,255,0.12)" : "transparent",
                borderColor: category === key ? "rgba(255,255,255,0.3)" : "var(--line)",
                color: category === key ? "var(--text)" : "var(--muted)",
              }}
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
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#B99A65" }}>
              ✨ {hiddenGemsCount} Hidden Gems
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
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ ...selectStyle, padding: "5px 10px", fontSize: "0.8rem" }}
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
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
                style={{
                  height: 240,
                  borderRadius: 14,
                  background: "var(--panel)",
                  border: "1px solid var(--line)",
                  opacity: 0.5,
                  animation: "pulse 1.5s ease-in-out infinite",
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
            <h3 style={{ fontSize: "1.1rem", fontWeight: 500, color: "var(--text)", marginBottom: 6 }}>
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
                background: "var(--hover)",
                border: "1px solid var(--line)",
                borderRadius: 999,
                color: "var(--soft)",
                padding: "8px 20px",
                fontSize: "0.875rem",
                cursor: "pointer",
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
            {places.map((place) => (
              <div
                key={place.id}
                onClick={() => setSelectedPlaceId(place.id)}
                style={{
                  ...panelStyle,
                  cursor: "pointer",
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.15s ease, border-color 0.15s ease",
                  borderColor: place.is_hidden_gem
                    ? "rgba(185,154,101,0.3)"
                    : "var(--line)",
                }}
              >
                {/* Card Header / Gradient Banner */}
                <div
                  style={{
                    height: 120,
                    position: "relative",
                    background: place.is_hidden_gem
                      ? "linear-gradient(135deg, rgba(185,154,101,0.18), rgba(11,16,19,0.95))"
                      : "linear-gradient(135deg, rgba(0,201,167,0.12), rgba(11,16,19,0.95))",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Badges Bar */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "capitalize",
                        color: "var(--muted)",
                        border: "1px solid var(--line)",
                        borderRadius: 999,
                        padding: "2px 8px",
                        background: "rgba(0,0,0,0.3)",
                      }}
                    >
                      {place.category}
                    </span>
                    {place.is_hidden_gem && (
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: "linear-gradient(135deg, #B99A65, #E8C97A)",
                          color: "#1a0800",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          boxShadow: "0 2px 10px rgba(185,154,101,0.35)",
                        }}
                      >
                        💎 HIDDEN GEM
                      </span>
                    )}
                  </div>

                  {/* Rating & Distance */}
                  <div
                    style={{
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
                        padding: "3px 8px",
                        borderRadius: 999,
                      }}
                    >
                      <Star size={13} fill="#fbbf24" color="#fbbf24" />
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                        {place.avg_rating.toFixed(1)}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)" }}>
                        ({place.n_ratings})
                      </span>
                    </div>

                    {place.distance_m !== null && (
                      <span
                        style={{
                          fontSize: "0.725rem",
                          fontWeight: 500,
                          color: "rgba(255,255,255,0.8)",
                          background: "rgba(0,0,0,0.55)",
                          padding: "3px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {(place.distance_m / 1000).toFixed(1)} km away
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
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

                  {/* ── Transparent "Why is this recommended" explanation ── */}
                  <div
                    style={{
                      paddingTop: 8,
                      borderTop: "1px solid var(--line)",
                      marginTop: 8,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.725rem",
                        color: place.is_hidden_gem ? "#B99A65" : "var(--muted)",
                        lineHeight: 1.4,
                      }}
                    >
                      💡 {place.recommendation_reason}
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
