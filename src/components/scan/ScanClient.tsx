"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  Upload,
  RefreshCw,
  MapPin,
  Sparkles,
  BookOpen,
  Calendar,
  User,
  Compass,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowLeft,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Profile, Monument, MonumentImage } from "@/types/database";

interface ScanClientProps {
  profile: Profile | null;
}

interface MatchCandidate {
  monument_id: string;
  name: string;
  confidence: number;
  built_year?: number;
  builder?: string;
  destination_name?: string;
  distance_metres?: number;
}

interface ScanResult {
  status: "match" | "candidates" | "no_match";
  confidence_threshold: number;
  confidence: number | null;
  monument: (Monument & { destinations?: { name: string; region: string } }) | null;
  historical_image: MonumentImage | null;
  candidates: MatchCandidate[];
  scan_id: string | null;
}

export default function ScanClient({ profile }: ScanClientProps) {
  // Mode: "capture" | "scanning" | "result" | "saved"
  const [viewState, setViewState] = useState<"capture" | "scanning" | "result" | "saved">("capture");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Selected image
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // GPS state
  const [useGps, setUseGps] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Scan response
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [savedMonuments, setSavedMonuments] = useState<Array<{ id: string; name: string; date: string; destination?: string }>>([]);

  // Manual search fallback
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // AI impression collapsed disclosure state (Phase 7 preparation, strictly labelled)
  const [showAiImpression, setShowAiImpression] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved scans from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("wanderlens_my_monuments");
      if (stored) {
        setSavedMonuments(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Request GPS
  useEffect(() => {
    if (useGps && "geolocation" in navigator) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsLoading(false);
        },
        () => {
          setGpsLoading(false);
        },
        { timeout: 8000 }
      );
    }
  }, [useGps]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access denied or unavailable:", err);
      setCameraError("Camera access unavailable. You can upload an image file instead.");
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Snap photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `monument-scan-${Date.now()}.jpg`, { type: "image/jpeg" });
          setSelectedFile(file);
          setPreviewUrl(canvas.toDataURL("image/jpeg"));
          stopCamera();
        }
      },
      "image/jpeg",
      0.9
    );
  };

  // Handle file picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be under 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      stopCamera();
    }
  };

  // Execute Scan
  const executeScan = async () => {
    if (!selectedFile) {
      toast.error("Please take a photo or select an image first");
      return;
    }

    setViewState("scanning");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      if (coords) {
        formData.append("latitude", coords.lat.toString());
        formData.append("longitude", coords.lng.toString());
      }

      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Recognition failed");
      }

      const data: ScanResult = await res.json();
      setScanResult(data);
      setViewState("result");

      if (data.status === "match") {
        toast.success(`Identified: ${data.monument?.name}`);
      } else if (data.status === "candidates") {
        toast("Found candidate matches. Please verify.", { icon: "🔍" });
      } else {
        toast("Monument not recognized with high confidence.", { icon: "ℹ️" });
      }
    } catch (err: any) {
      toast.error(err.message || "Could not analyze image");
      setViewState("capture");
    }
  };

  // Select a specific monument directly from candidate list
  const selectCandidate = async (monumentId: string) => {
    setViewState("scanning");
    try {
      const res = await fetch(`/api/monuments/${monumentId}`);
      if (!res.ok) throw new Error("Could not load monument details");
      const data = await res.json();

      setScanResult((prev) => ({
        status: "match",
        confidence_threshold: prev?.confidence_threshold || 0.75,
        confidence: 0.95, // user confirmed
        monument: data.monument,
        historical_image: data.historical_image,
        candidates: [],
        scan_id: prev?.scan_id || null,
      }));
      setViewState("result");
    } catch (err: any) {
      toast.error(err.message);
      setViewState("result");
    }
  };

  // Manual search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/monuments?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.monuments || []);
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  // Save to "My Monuments"
  const saveToMyMonuments = () => {
    if (!scanResult?.monument) return;
    const exists = savedMonuments.some((m) => m.id === scanResult.monument?.id);
    if (exists) {
      toast("Already saved in your collection", { icon: "📌" });
      return;
    }

    const newItem = {
      id: scanResult.monument.id,
      name: scanResult.monument.name,
      destination: (scanResult.monument as any)?.destinations?.name || "India",
      date: new Date().toLocaleDateString(),
    };

    const updated = [newItem, ...savedMonuments];
    setSavedMonuments(updated);
    try {
      localStorage.setItem("wanderlens_my_monuments", JSON.stringify(updated));
    } catch {
      // Ignore
    }
    toast.success("Saved to My Monuments!");
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setViewState("capture");
  };

  return (
    <div className="content-container" style={{ paddingTop: 16, paddingBottom: 48 }}>
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <span className="badge badge-gold" style={{ marginBottom: 6 }}>
            CLIP Vision AI
          </span>
          <h1 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 700 }}>
            Monument Scanner
          </h1>
        </div>
        <button
          onClick={() => setViewState(viewState === "saved" ? "capture" : "saved")}
          className="btn btn-secondary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Bookmark size={15} />
          {viewState === "saved" ? "Scanner" : `Saved (${savedMonuments.length})`}
        </button>
      </div>

      {/* ─── SAVED MONUMENTS VIEW ─────────────────────────────────────── */}
      {viewState === "saved" && (
        <div className="animate-fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setViewState("capture")} className="btn btn-secondary btn-sm btn-icon">
              <ArrowLeft size={16} />
            </button>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>My Monuments Collection</h2>
          </div>

          {savedMonuments.length === 0 ? (
            <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
              <Bookmark size={32} style={{ color: "var(--accent-gold)", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 600, marginBottom: 4 }}>No monuments saved yet</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 16 }}>
                Scan monuments and save them to build your personal heritage scrapbook.
              </p>
              <button onClick={() => setViewState("capture")} className="btn btn-primary btn-sm">
                Scan a Monument
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {savedMonuments.map((item) => (
                <div
                  key={item.id}
                  className="card card-gold"
                  style={{
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{item.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
                      {item.destination} · Scanned on {item.date}
                    </p>
                  </div>
                  <button
                    onClick={() => selectCandidate(item.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.8rem" }}
                  >
                    View History
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── SCANNING IN PROGRESS ANIMATION ──────────────────────────── */}
      {viewState === "scanning" && (
        <div
          className="card animate-fade-in"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {previewUrl && (
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 20,
                overflow: "hidden",
                marginBottom: 24,
                position: "relative",
                border: "2px solid var(--accent-gold)",
                boxShadow: "var(--shadow-glow-gold)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Scanning" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {/* Animated scan beam */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: "var(--accent-gold)",
                  boxShadow: "0 0 12px 3px var(--accent-gold)",
                  animation: "scanBeam 1.8s ease-in-out infinite alternate",
                }}
              />
            </div>
          )}

          <div
            style={{
              width: 32,
              height: 32,
              border: "3px solid rgba(232,168,56,0.2)",
              borderTopColor: "var(--accent-gold)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: 16,
            }}
          />
          <h2 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 6 }}>
            Analyzing Monument
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: 300 }}>
            Extracting 512-dim visual features with CLIP and matching against heritage archives...
          </p>
        </div>
      )}

      {/* ─── CAPTURE & UPLOAD VIEW ─────────────────────────────────────── */}
      {viewState === "capture" && (
        <div className="animate-fade-in">
          {/* Viewfinder / Preview Card */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: "hidden",
              marginBottom: 20,
              position: "relative",
              background: "#080706",
              minHeight: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cameraActive ? (
              <div style={{ position: "relative", width: "100%", height: 320 }}>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {/* Target overlay reticle */}
                <div
                  style={{
                    position: "absolute",
                    inset: 40,
                    border: "2px dashed rgba(232,168,56,0.6)",
                    borderRadius: 16,
                    pointerEvents: "none",
                  }}
                />
                <button
                  onClick={stopCamera}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    borderRadius: "50%",
                    color: "#fff",
                    padding: 8,
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            ) : previewUrl ? (
              <div style={{ position: "relative", width: "100%", maxHeight: 340 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Captured monument"
                  style={{ width: "100%", maxHeight: 340, objectFit: "cover" }}
                />
                <button
                  onClick={resetScanner}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "rgba(0,0,0,0.7)",
                    border: "none",
                    borderRadius: "50%",
                    color: "#fff",
                    padding: 8,
                    cursor: "pointer",
                  }}
                  title="Remove image"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(232,168,56,0.1)",
                    border: "1px solid rgba(232,168,56,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Camera size={30} style={{ color: "var(--accent-gold)" }} />
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 6 }}>
                  Capture or Upload Monument
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", maxWidth: 280, margin: "0 auto" }}>
                  Take a photo of monuments like Qutub Minar, Red Fort, Hawa Mahal, Amber Fort and more.
                </p>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="alert-box alert-box-warning" style={{ marginBottom: 16 }}>
              <AlertCircle size={16} />
              <p style={{ fontSize: "0.8125rem" }}>{cameraError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: previewUrl ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {previewUrl ? (
              <button
                id="scan-analyze-btn"
                onClick={executeScan}
                className="btn btn-primary"
                style={{ padding: "14px", fontSize: "1rem", fontWeight: 700 }}
              >
                <Sparkles size={18} /> Identify Monument
              </button>
            ) : cameraActive ? (
              <button
                id="scan-shutter-btn"
                onClick={capturePhoto}
                className="btn btn-primary"
                style={{ gridColumn: "1 / -1", padding: "14px", fontSize: "1rem" }}
              >
                <Camera size={18} /> Capture Photo
              </button>
            ) : (
              <>
                <button
                  id="scan-camera-btn"
                  onClick={startCamera}
                  className="btn btn-primary"
                  style={{ padding: "12px", gap: 8 }}
                >
                  <Camera size={18} /> Take Photo
                </button>
                <button
                  id="scan-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                  style={{ padding: "12px", gap: 8 }}
                >
                  <Upload size={18} /> Upload Image
                </button>
              </>
            )}
          </div>

          {/* GPS Proximity Prior Toggle */}
          <div
            className="card"
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <MapPin size={18} style={{ color: coords ? "var(--accent-teal)" : "var(--text-muted)" }} />
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>GPS Proximity Prior</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {coords
                    ? `Active (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}) +5km boost`
                    : gpsLoading
                    ? "Acquiring GPS location..."
                    : "Boosts score for monuments within 5km"}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={useGps}
              onChange={(e) => setUseGps(e.target.checked)}
              style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--accent-gold)" }}
            />
          </div>

          {/* Curated Monuments Showcase */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              Supported Curated Monuments (8)
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                "Qutub Minar",
                "Red Fort",
                "Humayun's Tomb",
                "India Gate",
                "Lotus Temple",
                "Amber Fort",
                "Hawa Mahal",
                "City Palace",
              ].map((name) => (
                <span key={name} className="badge badge-gold" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── RESULT VIEW ──────────────────────────────────────────────── */}
      {viewState === "result" && scanResult && (
        <div className="animate-fade-in">
          {/* Match Status Banner */}
          {scanResult.status === "match" && scanResult.monument ? (
            <div
              className="card card-gold animate-fade-in-scale"
              style={{ padding: "20px", marginBottom: 20, background: "var(--gradient-card)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <CheckCircle2 size={16} style={{ color: "#4ade80" }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4ade80", textTransform: "uppercase" }}>
                      Confident Match ({Math.round((scanResult.confidence || 0.9) * 100)}%)
                    </span>
                  </div>
                  <h2 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 800 }}>
                    {scanResult.monument.name}
                  </h2>
                  <p style={{ color: "var(--accent-gold)", fontSize: "0.875rem", fontWeight: 600 }}>
                    {(scanResult.monument as any)?.destinations?.name},{" "}
                    {(scanResult.monument as any)?.destinations?.region}
                  </p>
                </div>
                <button
                  onClick={saveToMyMonuments}
                  className="btn btn-secondary btn-sm"
                  title="Save to collection"
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Bookmark size={15} /> Save
                </button>
              </div>

              {/* Key Facts Pill Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginTop: 18,
                  marginBottom: 18,
                }}
              >
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-soft)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: 2 }}>
                    <Calendar size={13} /> Built Year
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                    {scanResult.monument.built_year ? `${scanResult.monument.built_year} CE` : "Unknown"}
                  </p>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-soft)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: 2 }}>
                    <User size={13} /> Builder / Dynasty
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.3 }}>
                    {scanResult.monument.builder || "Historical Ruler"}
                  </p>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-soft)", gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: 2 }}>
                    <Compass size={13} /> Architectural Style
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {scanResult.monument.style || "Indo-Islamic / Rajput"}
                  </p>
                </div>
              </div>

              {/* Short History Section */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--accent-gold)" }}>
                  <BookOpen size={16} />
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    History & Significance
                  </h3>
                </div>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.65, color: "var(--text-secondary)" }}>
                  {scanResult.monument.history_text}
                </p>
              </div>

              {/* ─── HISTORICAL IMAGE WITH PROPER ATTRIBUTION ──────────── */}
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--border-soft)" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-primary)", marginBottom: 10 }}>
                  Historical Archive Image
                </h4>

                {scanResult.historical_image ? (
                  <div
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      background: "#080706",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        scanResult.historical_image.source_url?.includes("http")
                          ? scanResult.historical_image.source_url
                          : `/images/${scanResult.historical_image.storage_path}`
                      }
                      alt={`Historical photograph of ${scanResult.monument.name}`}
                      style={{ width: "100%", maxHeight: 280, objectFit: "cover" }}
                      onError={(e) => {
                        // Fallback placeholder if remote link unavailable
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.5)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <p style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 2 }}>
                        Credit: {scanResult.historical_image.author_credit || "Wikimedia Commons Public Domain"}
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <span className="badge badge-muted" style={{ fontSize: "0.7rem" }}>
                          {scanResult.historical_image.license || "Public Domain"}
                        </span>
                        {scanResult.historical_image.source_url && (
                          <a
                            href={scanResult.historical_image.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--accent-gold)" }}
                          >
                            Source link <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="card"
                    style={{ padding: "16px", textAlign: "center", background: "rgba(255,255,255,0.02)" }}
                  >
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      No historical image available for this monument.
                    </p>
                  </div>
                )}
              </div>

              {/* ─── OPTIONAL AI IMPRESSION (COLLAPSED & LABELLED AS PER PRD) ─── */}
              <div style={{ marginTop: 20 }}>
                <button
                  onClick={() => setShowAiImpression(!showAiImpression)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border-soft)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  <span>AI impression preview (Optional)</span>
                  {showAiImpression ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showAiImpression && (
                  <div
                    className="animate-fade-in"
                    style={{
                      marginTop: 8,
                      padding: 12,
                      borderRadius: 8,
                      background: "rgba(232,168,56,0.05)",
                      border: "1px solid rgba(232,168,56,0.2)",
                    }}
                  >
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-gold)", marginBottom: 4 }}>
                      ⚠️ AI impression, not a historical record.
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                      Synthetic artistic reconstruction will be activated in Phase 7. It is never mixed with authentic photographic archives.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ─── CONFIDENCE BELOW THRESHOLD: TOP 3 CANDIDATES FALLBACK ──── */
            <div className="animate-fade-in" style={{ marginBottom: 24 }}>
              <div className="alert-box alert-box-warning" style={{ marginBottom: 16 }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>Not sure — pick from candidates</p>
                  <p style={{ fontSize: "0.8125rem" }}>
                    The scan confidence was below our {Math.round(scanResult.confidence_threshold * 100)}% threshold. Select the correct monument below or search manually.
                  </p>
                </div>
              </div>

              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 12 }}>
                Top Matches for your photo
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {scanResult.candidates.map((candidate, idx) => (
                  <div
                    key={candidate.monument_id}
                    className="card card-gold"
                    style={{
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span className="badge badge-muted">#{idx + 1}</span>
                        <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>{candidate.name}</h4>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Confidence: {Math.round(candidate.confidence * 100)}%
                        {candidate.built_year && ` · Built ${candidate.built_year}`}
                      </p>
                    </div>
                    <button
                      onClick={() => selectCandidate(candidate.monument_id)}
                      className="btn btn-primary btn-sm"
                      style={{ flexShrink: 0 }}
                    >
                      This is it
                    </button>
                  </div>
                ))}
              </div>

              {/* Manual search bar */}
              <div className="card" style={{ padding: 18 }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 10 }}>
                  Manual Monument Search
                </h4>
                <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search
                      size={16}
                      style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Search monument by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: 38 }}
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary btn-sm" disabled={searchLoading}>
                    {searchLoading ? "..." : "Search"}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {searchResults.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => selectCandidate(m.id)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.03)",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{m.name}</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {m.destinations?.name} · {m.built_year ? `Built ${m.built_year}` : "Historic site"}
                          </p>
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "var(--accent-gold)" }}>Select →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons footer */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={resetScanner} className="btn btn-primary" style={{ flex: 1 }}>
              <RefreshCw size={16} /> Scan Another
            </button>
            <Link href="/discover" style={{ flex: 1 }}>
              <button className="btn btn-secondary" style={{ width: "100%" }}>
                <Compass size={16} /> Discover Gems
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

