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
import PlaceDetailModal from "./PlaceDetailModal";
import DiscoverMap from "./DiscoverMap";

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
    <div className="content-container-wide" style={{ paddingTop: 16, paddingBottom: 60 }}>
      {/* ── Header & Destination Bar ────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span className="badge badge-teal">Community-Ranked</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Formula-verified · No ad bias
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700 }}>
            Discover Hidden Gems
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: 2 }}>
            Lesser-known, high-rated places with genuine traveller appreciation.
          </p>
        </div>

        {/* Destination Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <select
              className="input"
              value={selectedDestinationId}
              onChange={(e) => setSelectedDestinationId(e.target.value)}
              style={{ minWidth: 170, padding: "8px 14px", fontWeight: 700, fontSize: "0.9rem" }}
              aria-label="Select Destination"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  📍 {d.name} ({d.region})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle: List vs Map */}
          <div
            style={{
              display: "flex",
              borderRadius: 8,
              border: "1px solid var(--border)",
              overflow: "hidden",
              background: "#181512",
            }}
          >
            <button
              onClick={() => setViewMode("list")}
              style={{
                padding: "8px 12px",
                border: "none",
                background: viewMode === "list" ? "rgba(255,255,255,0.12)" : "transparent",
                color: viewMode === "list" ? "var(--accent-teal)" : "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.8rem",
                fontWeight: 600,
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
                background: viewMode === "map" ? "rgba(255,255,255,0.12)" : "transparent",
                color: viewMode === "map" ? "var(--accent-teal)" : "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.8rem",
                fontWeight: 600,
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
          marginBottom: 16,
          scrollbarWidth: "none",
        }}
      >
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`chip ${category === key ? "active" : ""}`}
            style={{
              padding: "6px 14px",
              borderRadius: 99,
              fontSize: "0.8125rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
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
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-gold)" }}>
            ✨ {hiddenGemsCount} Hidden Gems
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            out of {places.length} places in {activeDestination?.name}
          </span>
        </div>

        {/* Sort Select */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Sort:
          </span>
          <select
            className="input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ padding: "4px 10px", fontSize: "0.8rem", width: "auto", minHeight: 32 }}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── MAP VIEW OR LIST VIEW ───────────────────────────────── */}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card skeleton" style={{ height: 240, borderRadius: 14 }} />
          ))}
        </div>
      ) : places.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <Compass size={36} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>
            No places found
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: 320, margin: "0 auto 16px" }}>
            No places in this category currently match the hidden gem criteria. Try selecting &quot;All Gems&quot;.
          </p>
          <button onClick={() => setCategory("all")} className="btn btn-secondary btn-sm">
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
              className={`card ${place.is_hidden_gem ? "card-gold" : ""}`}
              style={{
                cursor: "pointer",
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.15s, border-color 0.15s",
              }}
            >
              {/* Card Header & Photo Banner */}
              <div
                style={{
                  height: 120,
                  position: "relative",
                  background: place.is_hidden_gem
                    ? "linear-gradient(135deg, rgba(232,168,56,0.2), rgba(20,18,16,0.9))"
                    : "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(20,18,16,0.9))",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {/* Badges Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <span className="badge badge-muted" style={{ textTransform: "capitalize" }}>
                    {place.category}
                  </span>
                  {place.is_hidden_gem && (
                    <span
                      style={{
                        padding: "3px 9px",
                        borderRadius: 99,
                        background: "var(--gradient-gold)",
                        color: "#1a0800",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                        boxShadow: "0 2px 10px rgba(232,168,56,0.4)",
                      }}
                    >
                      💎 HIDDEN GEM
                    </span>
                  )}
                </div>

                {/* Rating & Distance */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: 99 }}>
                    <Star size={13} fill="#fbbf24" color="#fbbf24" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fff" }}>
                      {place.avg_rating.toFixed(1)}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      ({place.n_ratings})
                    </span>
                  </div>

                  {place.distance_m !== null && (
                    <span
                      style={{
                        fontSize: "0.725rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        background: "rgba(0,0,0,0.6)",
                        padding: "3px 8px",
                        borderRadius: 99,
                      }}
                    >
                      {(place.distance_m / 1000).toFixed(1)} km away
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>
                    {place.name}
                  </h3>
                  {place.description && (
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--text-secondary)",
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
                    borderTop: "1px solid var(--border-soft)",
                    marginTop: 8,
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.725rem",
                      color: place.is_hidden_gem ? "var(--accent-gold)" : "var(--text-muted)",
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
  );
}

