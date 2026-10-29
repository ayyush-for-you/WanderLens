"use client";

import { useState } from "react";
import {
  MapPin, Building, Landmark, Users, Plus, Pencil, Trash2,
  Check, X, Globe, ChevronDown, BarChart3, Eye, EyeOff, Image as ImageIcon
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { Destination, Place, Monument as MonumentType, MonumentImage, Profile, UserRole, PlaceCategory, ImageKind } from "@/types/database";

type AdminTab = "destinations" | "places" | "monuments" | "images" | "users" | "stats";

interface AdminClientProps {
  currentProfile: Profile;
  initialDestinations: Destination[];
  initialPlaces: (Place & { destinations?: { name: string } })[];
  initialMonuments: (MonumentType & { destinations?: { name: string } })[];
  initialProfiles: Profile[];
  initialMonumentImages?: (MonumentImage & { monuments?: { name: string } })[];
}

const PLACE_CATEGORIES: PlaceCategory[] = ["heritage", "food", "nature", "viewpoint", "market", "culture", "other"];
const USER_ROLES: UserRole[] = ["traveller", "moderator", "admin"];

export default function AdminClient({
  currentProfile,
  initialDestinations,
  initialPlaces,
  initialMonuments,
  initialProfiles,
  initialMonumentImages = [],
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("destinations");
  const [destinations, setDestinations] = useState(initialDestinations);
  const [places, setPlaces] = useState(initialPlaces);
  const [monuments, setMonuments] = useState(initialMonuments);
  const [images, setImages] = useState(initialMonumentImages);
  const [profiles, setProfiles] = useState(initialProfiles);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState<Record<string, string>>({});

  const supabase = createClient();

  const resetForm = () => { setForm({}); setEditingId(null); setCreating(false); };

  // ─── Destination CRUD ─────────────────────────────────────────
  const saveDestination = async () => {
    if (!form.name || !form.region || !form.lat || !form.lng) {
      toast.error("All fields required"); return;
    }
    setLoading(true);
    const payload = {
      name: form.name,
      region: form.region,
      country: form.country || "India",
      description: form.description || null,
      centre: `POINT(${form.lng} ${form.lat})`,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("destinations").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("destinations").insert(payload));
    }
    if (error) { toast.error(error.message); } else {
      toast.success(editingId ? "Destination updated" : "Destination created");
      const { data } = await supabase.from("destinations").select("*").order("name");
      setDestinations(data ?? []);
      resetForm();
    }
    setLoading(false);
  };

  const deleteDestination = async (id: string) => {
    if (!confirm("Delete this destination and all its places/monuments?")) return;
    setLoading(true);
    const { error } = await supabase.from("destinations").delete().eq("id", id);
    if (error) { toast.error(error.message); } else {
      setDestinations((d) => d.filter((x) => x.id !== id));
      toast.success("Deleted");
    }
    setLoading(false);
  };

  // ─── Place CRUD ───────────────────────────────────────────────
  const savePlace = async () => {
    if (!form.name || !form.destination_id || !form.category || !form.lat || !form.lng) {
      toast.error("Required: name, destination, category, coordinates"); return;
    }
    setLoading(true);
    const payload = {
      name: form.name,
      destination_id: form.destination_id,
      category: form.category as PlaceCategory,
      description: form.description || null,
      location: `POINT(${form.lng} ${form.lat})`,
      avg_rating: parseFloat(form.avg_rating || "0"),
      n_ratings: parseInt(form.n_ratings || "0"),
      is_seeded: form.is_seeded === "true",
      is_hidden: form.is_hidden === "true",
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("places").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("places").insert(payload));
    }
    if (error) { toast.error(error.message); } else {
      toast.success(editingId ? "Place updated" : "Place created");
      const { data } = await supabase.from("places").select("*, destinations(name)").order("name");
      setPlaces(data ?? []);
      resetForm();
    }
    setLoading(false);
  };

  const deletePlace = async (id: string) => {
    if (!confirm("Delete this place?")) return;
    setLoading(true);
    const { error } = await supabase.from("places").delete().eq("id", id);
    if (error) { toast.error(error.message); } else {
      setPlaces((p) => p.filter((x) => x.id !== id));
      toast.success("Deleted");
    }
    setLoading(false);
  };

  // ─── Monument CRUD ────────────────────────────────────────────
  const saveMonument = async () => {
    if (!form.name || !form.destination_id || !form.lat || !form.lng || !form.history_text) {
      toast.error("Required: name, destination, coordinates, history text"); return;
    }
    setLoading(true);
    const payload = {
      name: form.name,
      destination_id: form.destination_id,
      location: `POINT(${form.lng} ${form.lat})`,
      built_year: form.built_year ? parseInt(form.built_year) : null,
      builder: form.builder || null,
      style: form.style || null,
      history_text: form.history_text,
      is_published: form.is_published === "true",
    };
    let error;
    if (editingId) {
      // Create revision record
      await supabase.from("monument_revisions").insert({
        monument_id: editingId,
        text: form.history_text,
        edited_by: currentProfile.id,
      });
      await supabase.from("monuments").update({ history_version: (monuments.find(m => m.id === editingId)?.history_version ?? 1) + 1 }).eq("id", editingId);
      ({ error } = await supabase.from("monuments").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("monuments").insert(payload));
    }
    if (error) { toast.error(error.message); } else {
      toast.success(editingId ? "Monument updated" : "Monument created");
      const { data } = await supabase.from("monuments").select("*, destinations(name)").order("name");
      setMonuments(data ?? []);
      resetForm();
    }
    setLoading(false);
  };

  const deleteMonument = async (id: string) => {
    if (!confirm("Delete this monument?")) return;
    setLoading(true);
    const { error } = await supabase.from("monuments").delete().eq("id", id);
    if (error) { toast.error(error.message); } else {
      setMonuments((m) => m.filter((x) => x.id !== id));
      toast.success("Deleted");
    }
    setLoading(false);
  };

  // ─── Image CRUD ───────────────────────────────────────────────
  const saveImage = async () => {
    if (!form.monument_id || !form.storage_path || !form.kind) {
      toast.error("Required: monument, storage path / filename, kind");
      return;
    }
    setLoading(true);
    const payload = {
      monument_id: form.monument_id,
      storage_path: form.storage_path,
      kind: form.kind as ImageKind,
      source_url: form.source_url || null,
      license: form.license || null,
      author_credit: form.author_credit || null,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("monument_images").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("monument_images").insert(payload));
    }
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editingId ? "Image updated" : "Image added");
      const { data } = await supabase.from("monument_images").select("*, monuments(name)").order("created_at", { ascending: false });
      setImages((data as any) ?? []);
      resetForm();
    }
    setLoading(false);
  };

  const deleteImage = async (id: string) => {
    if (!confirm("Delete this image record?")) return;
    setLoading(true);
    const { error } = await supabase.from("monument_images").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      setImages((prev) => prev.filter((img) => img.id !== id));
      toast.success("Image deleted");
    }
    setLoading(false);
  };

  // ─── User management ──────────────────────────────────────────
  const changeUserRole = async (userId: string, role: UserRole) => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
    if (error) { toast.error(error.message); } else {
      setProfiles((p) => p.map((u) => u.id === userId ? { ...u, role } : u));
      toast.success(`Role changed to ${role}`);
    }
    setLoading(false);
  };

  const toggleSuspend = async (user: Profile) => {
    setLoading(true);
    const suspended_until = user.suspended_until ? null : new Date(Date.now() + 7 * 86400 * 1000).toISOString();
    const { error } = await supabase.from("profiles").update({ suspended_until }).eq("id", user.id);
    if (error) { toast.error(error.message); } else {
      setProfiles((p) => p.map((u) => u.id === user.id ? { ...u, suspended_until } : u));
      toast.success(suspended_until ? "User suspended for 7 days" : "User unsuspended");
    }
    setLoading(false);
  };

  // ─── Tab definitions ──────────────────────────────────────────
  const tabs: { key: AdminTab; label: string; count?: number }[] = [
    { key: "destinations", label: "Destinations", count: destinations.length },
    { key: "places", label: "Places", count: places.length },
    { key: "monuments", label: "Monuments", count: monuments.length },
    { key: "images", label: "Images", count: images.length },
    { key: "users", label: "Users", count: profiles.length },
    { key: "stats", label: "Stats" },
  ];

  return (
    <div className="content-container-wide" style={{ padding: "24px 24px 48px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="badge badge-gold" style={{ marginBottom: 10 }}>Admin Console</div>
        <h1 className="font-display" style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: 4 }}>
          Platform Management
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Manage destinations, places, monuments, and users.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            id={`admin-tab-${key}`}
            onClick={() => { setActiveTab(key); resetForm(); }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "1px solid",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              background: activeTab === key ? "rgba(232,168,56,0.12)" : "rgba(255,255,255,0.04)",
              borderColor: activeTab === key ? "rgba(232,168,56,0.35)" : "var(--border)",
              color: activeTab === key ? "var(--accent-gold)" : "var(--text-secondary)",
            }}
          >
            {label}{count !== undefined && <span style={{ marginLeft: 6, opacity: 0.7 }}>({count})</span>}
          </button>
        ))}
      </div>

      {/* ── DESTINATIONS tab ─────────────────────────────────── */}
      {activeTab === "destinations" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Destinations</h2>
            <button
              id="admin-create-destination-btn"
              className="btn btn-primary btn-sm"
              onClick={() => { setCreating(true); setEditingId(null); setForm({ country: "India" }); }}
            >
              <Plus size={15} /> Add destination
            </button>
          </div>

          {/* Create/Edit form */}
          {(creating || editingId) && (
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 14, color: "var(--accent-gold)" }}>
                {editingId ? "Edit Destination" : "New Destination"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="label">Name *</label>
                  <input className="input" placeholder="e.g. Delhi" value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Region *</label>
                  <input className="input" placeholder="State / UT" value={form.region ?? ""} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Country</label>
                  <input className="input" value={form.country ?? "India"} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Latitude *</label>
                  <input className="input" type="number" step="any" placeholder="28.6139" value={form.lat ?? ""} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Longitude *</label>
                  <input className="input" type="number" step="any" placeholder="77.2090" value={form.lng ?? ""} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Description</label>
                  <textarea className="input" rows={2} placeholder="Short description..." value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary btn-sm" onClick={saveDestination} disabled={loading} id="admin-save-destination-btn">
                  {loading ? "Saving…" : <><Check size={14} /> Save</>}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={resetForm}><X size={14} /> Cancel</button>
              </div>
            </div>
          )}

          {/* List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {destinations.map((d) => (
              <div key={d.id} className="card card-gold" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{d.name}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>{d.region}, {d.country}</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-secondary btn-sm btn-icon"
                    id={`admin-edit-dest-${d.id}`}
                    onClick={() => {
                      setEditingId(d.id); setCreating(false);
                      setForm({ name: d.name, region: d.region, country: d.country, description: d.description ?? "" });
                    }}
                  ><Pencil size={14} /></button>
                  <button
                    className="btn btn-danger btn-sm btn-icon"
                    id={`admin-delete-dest-${d.id}`}
                    onClick={() => deleteDestination(d.id)}
                  ><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {destinations.length === 0 && (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 32 }}>No destinations yet. Add one above.</p>
            )}
          </div>
        </div>
      )}

      {/* ── PLACES tab ───────────────────────────────────────── */}
      {activeTab === "places" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Places</h2>
            <button
              id="admin-create-place-btn"
              className="btn btn-primary btn-sm"
              onClick={() => { setCreating(true); setEditingId(null); setForm({ is_seeded: "false", is_hidden: "false", avg_rating: "0", n_ratings: "0" }); }}
            >
              <Plus size={15} /> Add place
            </button>
          </div>

          {(creating || editingId) && (
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 14, color: "var(--accent-gold)" }}>
                {editingId ? "Edit Place" : "New Place"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="label">Name *</label>
                  <input className="input" value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Destination *</label>
                  <select className="input" value={form.destination_id ?? ""} onChange={e => setForm(f => ({ ...f, destination_id: e.target.value }))}>
                    <option value="">Select destination…</option>
                    {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Category *</label>
                  <select className="input" value={form.category ?? ""} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">Select…</option>
                    {PLACE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Latitude *</label>
                  <input className="input" type="number" step="any" value={form.lat ?? ""} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Longitude *</label>
                  <input className="input" type="number" step="any" value={form.lng ?? ""} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Avg Rating (0–5)</label>
                  <input className="input" type="number" step="0.01" min="0" max="5" value={form.avg_rating ?? "0"} onChange={e => setForm(f => ({ ...f, avg_rating: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Number of Ratings</label>
                  <input className="input" type="number" min="0" value={form.n_ratings ?? "0"} onChange={e => setForm(f => ({ ...f, n_ratings: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Seeded?</label>
                  <select className="input" value={form.is_seeded ?? "false"} onChange={e => setForm(f => ({ ...f, is_seeded: e.target.value }))}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Hidden?</label>
                  <select className="input" value={form.is_hidden ?? "false"} onChange={e => setForm(f => ({ ...f, is_hidden: e.target.value }))}>
                    <option value="false">No (visible)</option>
                    <option value="true">Yes (hidden)</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Description</label>
                  <textarea className="input" rows={2} value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary btn-sm" onClick={savePlace} disabled={loading} id="admin-save-place-btn">
                  {loading ? "Saving…" : <><Check size={14} /> Save</>}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={resetForm}><X size={14} /> Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {places.map((p) => (
              <div key={p.id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</p>
                    <span className="badge badge-muted">{p.category}</span>
                    {p.is_seeded && <span className="badge badge-teal">seeded</span>}
                    {p.is_hidden && <span className="badge badge-danger">hidden</span>}
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 2 }}>
                    {(p as any).destinations?.name ?? "—"} · ★ {p.avg_rating.toFixed(1)} ({p.n_ratings} ratings)
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-secondary btn-sm btn-icon"
                    id={`admin-edit-place-${p.id}`}
                    onClick={() => {
                      setEditingId(p.id); setCreating(false);
                      setForm({
                        name: p.name, destination_id: p.destination_id, category: p.category,
                        description: p.description ?? "", avg_rating: String(p.avg_rating),
                        n_ratings: String(p.n_ratings), is_seeded: String(p.is_seeded),
                        is_hidden: String(p.is_hidden),
                      });
                    }}
                  ><Pencil size={14} /></button>
                  <button className="btn btn-danger btn-sm btn-icon" id={`admin-delete-place-${p.id}`} onClick={() => deletePlace(p.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {places.length === 0 && <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 32 }}>No places yet.</p>}
          </div>
        </div>
      )}

      {/* ── MONUMENTS tab ────────────────────────────────────── */}
      {activeTab === "monuments" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Monuments</h2>
            <button
              id="admin-create-monument-btn"
              className="btn btn-primary btn-sm"
              onClick={() => { setCreating(true); setEditingId(null); setForm({ is_published: "false" }); }}
            >
              <Plus size={15} /> Add monument
            </button>
          </div>

          {(creating || editingId) && (
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 14, color: "var(--accent-gold)" }}>
                {editingId ? "Edit Monument" : "New Monument"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="label">Name *</label>
                  <input className="input" value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Destination *</label>
                  <select className="input" value={form.destination_id ?? ""} onChange={e => setForm(f => ({ ...f, destination_id: e.target.value }))}>
                    <option value="">Select destination…</option>
                    {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Latitude *</label>
                  <input className="input" type="number" step="any" value={form.lat ?? ""} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Longitude *</label>
                  <input className="input" type="number" step="any" value={form.lng ?? ""} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Built Year</label>
                  <input className="input" type="number" placeholder="e.g. 1648" value={form.built_year ?? ""} onChange={e => setForm(f => ({ ...f, built_year: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Builder / Dynasty</label>
                  <input className="input" value={form.builder ?? ""} onChange={e => setForm(f => ({ ...f, builder: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Architecture Style</label>
                  <input className="input" value={form.style ?? ""} onChange={e => setForm(f => ({ ...f, style: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Published?</label>
                  <select className="input" value={form.is_published ?? "false"} onChange={e => setForm(f => ({ ...f, is_published: e.target.value }))}>
                    <option value="false">Draft</option>
                    <option value="true">Published</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="label">History text * (150–300 words)</label>
                  <textarea
                    className="input"
                    rows={6}
                    placeholder="Rich monument history…"
                    value={form.history_text ?? ""}
                    onChange={e => setForm(f => ({ ...f, history_text: e.target.value }))}
                  />
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                    {form.history_text?.trim().split(/\s+/).filter(Boolean).length ?? 0} words
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary btn-sm" onClick={saveMonument} disabled={loading} id="admin-save-monument-btn">
                  {loading ? "Saving…" : <><Check size={14} /> Save</>}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={resetForm}><X size={14} /> Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {monuments.map((m) => (
              <div key={m.id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{m.name}</p>
                    <span className={`badge ${m.is_published ? "badge-success" : "badge-muted"}`}>
                      {m.is_published ? "published" : "draft"}
                    </span>
                    <span className="badge badge-muted">v{m.history_version}</span>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 2 }}>
                    {(m as any).destinations?.name ?? "—"} · Built {m.built_year ?? "unknown"} · {m.builder ?? "unknown builder"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-secondary btn-sm btn-icon"
                    id={`admin-edit-monument-${m.id}`}
                    onClick={() => {
                      setEditingId(m.id); setCreating(false);
                      setForm({
                        name: m.name, destination_id: m.destination_id,
                        built_year: m.built_year ? String(m.built_year) : "",
                        builder: m.builder ?? "", style: m.style ?? "",
                        history_text: m.history_text, is_published: String(m.is_published),
                      });
                    }}
                  ><Pencil size={14} /></button>
                  <button className="btn btn-danger btn-sm btn-icon" id={`admin-delete-monument-${m.id}`} onClick={() => deleteMonument(m.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {monuments.length === 0 && <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 32 }}>No monuments yet.</p>}
          </div>
        </div>
      )}

      {/* ── IMAGES tab ───────────────────────────────────────── */}
      {activeTab === "images" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Monument Images & Archives</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Reference photos for CLIP recognition and historic images with license attributions.
              </p>
            </div>
            <button
              id="admin-create-image-btn"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setCreating(true);
                setEditingId(null);
                setForm({ kind: "historic", license: "Public Domain" });
              }}
            >
              <Plus size={15} /> Add image record
            </button>
          </div>

          {(creating || editingId) && (
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 14, color: "var(--accent-gold)" }}>
                {editingId ? "Edit Image" : "New Monument Image"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="label">Monument *</label>
                  <select
                    className="input"
                    value={form.monument_id ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, monument_id: e.target.value }))}
                  >
                    <option value="">Select monument…</option>
                    {monuments.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Kind *</label>
                  <select
                    className="input"
                    value={form.kind ?? "historic"}
                    onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                  >
                    <option value="historic">Historic (shown in scan results)</option>
                    <option value="reference">Reference (used for CLIP indexing)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Storage Path / Identifier *</label>
                  <input
                    className="input"
                    placeholder="monuments/qutub/ref-1.jpg"
                    value={form.storage_path ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, storage_path: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Source URL</label>
                  <input
                    className="input"
                    placeholder="https://commons.wikimedia.org/..."
                    value={form.source_url ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="label">License</label>
                  <input
                    className="input"
                    placeholder="Public Domain / CC BY-SA 4.0"
                    value={form.license ?? "Public Domain"}
                    onChange={(e) => setForm((f) => ({ ...f, license: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Author Credit / Attribution</label>
                  <input
                    className="input"
                    placeholder="Photographer, archive, or year"
                    value={form.author_credit ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, author_credit: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={saveImage}
                  disabled={loading}
                  id="admin-save-image-btn"
                >
                  {loading ? "Saving…" : <><Check size={14} /> Save</>}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={resetForm}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {images.map((img) => (
              <div
                key={img.id}
                className="card"
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {(img as any).monuments?.name || "Monument image"}
                    </p>
                    <span className={`badge ${img.kind === "historic" ? "badge-gold" : "badge-teal"}`}>
                      {img.kind}
                    </span>
                    {img.license && <span className="badge badge-muted">{img.license}</span>}
                    {img.embedding && <span className="badge badge-success">indexed (512d)</span>}
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 2 }}>
                    {img.author_credit || "No author credit"} · Path: {img.storage_path}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-secondary btn-sm btn-icon"
                    onClick={() => {
                      setEditingId(img.id);
                      setCreating(false);
                      setForm({
                        monument_id: img.monument_id,
                        storage_path: img.storage_path,
                        kind: img.kind,
                        source_url: img.source_url ?? "",
                        license: img.license ?? "",
                        author_credit: img.author_credit ?? "",
                      });
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn btn-danger btn-sm btn-icon"
                    onClick={() => deleteImage(img.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {images.length === 0 && (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 32 }}>
                No images stored yet. Click &quot;Add image record&quot; above.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── USERS tab ────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>User Management</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {profiles.map((u) => (
              <div key={u.id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{u.display_name}</p>
                    <span className={`badge ${u.role === "admin" ? "badge-gold" : u.role === "moderator" ? "badge-teal" : "badge-muted"}`}>{u.role}</span>
                    {!u.is_verified && <span className="badge badge-warning" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>unverified</span>}
                    {u.suspended_until && <span className="badge badge-danger">suspended</span>}
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                {u.id !== currentProfile.id && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <select
                      className="input"
                      style={{ minHeight: 36, padding: "4px 10px", width: "auto", fontSize: "0.8125rem" }}
                      value={u.role}
                      onChange={(e) => changeUserRole(u.id, e.target.value as UserRole)}
                      id={`admin-role-select-${u.id}`}
                      aria-label={`Change role for ${u.display_name}`}
                    >
                      {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button
                      className={`btn btn-sm ${u.suspended_until ? "btn-teal" : "btn-danger"}`}
                      id={`admin-suspend-${u.id}`}
                      onClick={() => toggleSuspend(u)}
                    >
                      {u.suspended_until ? "Unsuspend" : "Suspend 7d"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STATS tab ────────────────────────────────────────── */}
      {activeTab === "stats" && (
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>Platform Stats</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { label: "Destinations", value: destinations.length, color: "var(--accent-gold)" },
              { label: "Places", value: places.length, color: "var(--accent-teal)" },
              { label: "Monuments", value: monuments.length, color: "#a855f7" },
              { label: "Users", value: profiles.length, color: "#fb923c" },
              { label: "Published Monuments", value: monuments.filter(m => m.is_published).length, color: "#4ade80" },
              { label: "Seeded Places", value: places.filter(p => p.is_seeded).length, color: "var(--accent-gold)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="card" style={{ padding: "20px 18px" }}>
                <p style={{ fontSize: "2rem", fontWeight: 800, color }}>{value}</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 4 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
