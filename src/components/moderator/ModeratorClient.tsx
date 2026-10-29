"use client";

import { useState } from "react";
import { AlertTriangle, Check, X, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { Profile, Report, ReportStatus } from "@/types/database";

interface ModeratorClientProps {
  currentProfile: Profile;
  initialReports: (Report & { profiles?: { display_name: string } })[];
}

const ACTIONS = [
  { value: "dismissed", label: "Dismiss" },
  { value: "warned", label: "Warn user" },
  { value: "content_hidden", label: "Hide content" },
  { value: "user_suspended", label: "Suspend user" },
];

export default function ModeratorClient({ currentProfile, initialReports }: ModeratorClientProps) {
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState<"open" | "resolved">("open");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  const displayed = reports.filter(r =>
    r.status === filter &&
    (typeFilter === "all" || r.target_type === typeFilter)
  );

  const handleAction = async (reportId: string, outcome: string) => {
    setLoading(reportId);
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    // 1. Perform underlying content hiding or suspension if requested
    if (outcome === "content_hidden") {
      if (report.target_type === "post") {
        await supabase.from("posts").update({ is_hidden: true }).eq("id", report.target_id);
      } else if (report.target_type === "comment") {
        await supabase.from("comments").update({ is_hidden: true }).eq("id", report.target_id);
      } else if (report.target_type === "message") {
        await supabase.from("messages").update({ is_hidden: true }).eq("id", report.target_id);
      }
    } else if (outcome === "user_suspended") {
      const targetUserId =
        report.target_type === "user" ? report.target_id : null;
      if (targetUserId) {
        const suspendUntil = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
        await supabase.from("profiles").update({ suspended_until: suspendUntil }).eq("id", targetUserId);
      }
    }

    // 2. Mark report resolved
    const { error } = await supabase
      .from("reports")
      .update({
        status: "resolved" as ReportStatus,
        handled_by: currentProfile.id,
        outcome,
      })
      .eq("id", reportId);

    if (error) { toast.error(error.message); } else {
      // 3. Write audit log
      await supabase.rpc("write_audit", {
        p_actor_id: currentProfile.id,
        p_action: `report_${outcome}`,
        p_target_type: report.target_type,
        p_target_id: report.target_id,
        p_meta: { report_id: reportId, outcome },
      });
      setReports(r => r.map(rep => rep.id === reportId ? { ...rep, status: "resolved", outcome, handled_by: currentProfile.id } : rep));
      toast.success(`Report resolved: ${outcome}`);
    }
    setLoading(null);
  };

  return (
    <div className="content-container-wide" style={{ padding: "24px 24px 48px" }}>
      <div style={{ marginBottom: 24 }}>
        <div className="badge badge-teal" style={{ marginBottom: 10 }}>Moderator Queue</div>
        <h1 className="font-display" style={{ fontSize: "1.8rem", fontWeight: 700 }}>Reports</h1>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {(["open", "resolved"] as const).map(s => (
          <button key={s} id={`mod-filter-${s}`} className={`chip ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s === "open" && <span style={{ marginLeft: 4, background: "rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 99, padding: "1px 6px", fontSize: "0.7rem" }}>
              {reports.filter(r => r.status === "open").length}
            </span>}
          </button>
        ))}
        <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />
        {["all", "post", "comment", "message", "user"].map(t => (
          <button key={t} id={`mod-type-${t}`} className={`chip ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Report list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {displayed.map(report => (
          <div key={report.id} className="card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <AlertTriangle size={14} style={{ color: "#f87171", flexShrink: 0 }} />
                  <span className="badge badge-danger">{report.target_type}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    by {(report as any).profiles?.display_name ?? "Unknown"} · {new Date(report.created_at).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.5 }}>{report.reason}</p>
                {report.outcome && (
                  <p style={{ fontSize: "0.8rem", color: "#4ade80", marginTop: 4 }}>Outcome: {report.outcome}</p>
                )}
              </div>
            </div>

            {report.status === "open" && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ACTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    id={`mod-action-${report.id}-${value}`}
                    className="btn btn-secondary btn-sm"
                    disabled={loading === report.id}
                    onClick={() => handleAction(report.id, value)}
                    style={{ fontSize: "0.8rem" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {displayed.length === 0 && (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
            <Check size={32} style={{ color: "var(--accent-teal)", margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-secondary)" }}>
              {filter === "open" ? "No open reports. Queue is clear!" : "No resolved reports yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
