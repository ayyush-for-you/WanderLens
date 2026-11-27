"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  Users,
  Flag,
  UserX,
  ArrowLeft,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { Profile } from "@/types/database";

interface CommunityChatClientProps {
  communityId: string;
  initialCommunity: any;
  initialMessages: any[];
  initialMembers: any[];
  profile: Profile | null;
}

const panelStyle: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
};

export default function CommunityChatClient({
  communityId,
  initialCommunity,
  initialMessages,
  initialMembers,
  profile,
}: CommunityChatClientProps) {
  const [community] = useState(initialCommunity);
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [members] = useState<any[]>(initialMembers);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Members drawer & Report/Block modals
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [selectedUserToBlock, setSelectedUserToBlock] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Rate limiting tracker
  const [recentSends, setRecentSends] = useState<number[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`community-chat-${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `community_id=eq.${communityId}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url, role")
            .eq("id", newMsg.user_id)
            .single();

          setMessages((prev) => [...prev, { ...newMsg, profiles: senderProfile }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, supabase]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!profile) {
      toast.error("Sign in to send messages");
      return;
    }

    if (!profile.is_verified) {
      toast.error("Verify your email to participate in community chat");
      return;
    }

    const now = Date.now();
    const oneMinAgo = now - 60 * 1000;
    const windowSends = recentSends.filter((t) => t > oneMinAgo);

    if (windowSends.length >= 20) {
      toast.error("Rate limit reached: maximum 20 messages per minute.");
      return;
    }

    setRecentSends([...windowSends, now]);
    setIsSending(true);

    try {
      const res = await fetch(`/api/communities/${communityId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: inputText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setInputText("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  // Block a user
  const handleBlockUser = async () => {
    if (!selectedUserToBlock) return;
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked_id: selectedUserToBlock.id }),
      });

      if (res.ok) {
        toast.success(`Blocked ${selectedUserToBlock.name}. Their messages are hidden.`);
        setMessages((prev) => prev.filter((m) => m.user_id !== selectedUserToBlock.id));
        setSelectedUserToBlock(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Could not block user");
      }
    } catch {
      toast.error("Network error blocking user");
    }
  };

  // Report a message
  const handleReportMessage = async () => {
    if (!reportingMessageId || !reportReason.trim()) return;
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "message",
          target_id: reportingMessageId,
          reason: reportReason.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Message reported to moderators.");
        setReportingMessageId(null);
        setReportReason("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to submit report");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // Leave community
  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this community?")) return;
    try {
      const res = await fetch(`/api/communities/${communityId}/join`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Left community");
        router.push("/communities");
      } else {
        const err = await res.json();
        toast.error(err.error || "Could not leave");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const isOwner = profile?.id === community?.owner_id;

  return (
    <div style={{ background: "var(--ink)", color: "var(--text)", minHeight: "calc(100dvh - 76px)" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100dvh - 76px)",
          maxWidth: 820,
          margin: "0 auto",
          borderLeft: "1px solid var(--line)",
          borderRight: "1px solid var(--line)",
        }}
      >
        {/* ── Chatroom Header ─────────────────────────────────────── */}
        <div
          style={{
            ...panelStyle,
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <Link
              href="/communities"
              aria-label="Back to communities"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--hover)",
                border: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--soft)",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={16} />
            </Link>
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: "inherit",
                  fontSize: "1.05rem",
                  fontWeight: 500,
                  lineHeight: 1.25,
                  margin: 0,
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {community?.name}
              </h1>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--muted)",
                  margin: "2px 0 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <MapPin size={12} style={{ color: "#B99A65" }} />
                <span>{community?.destinations?.name || "Destination"}</span>
                <span>·</span>
                <span>{members.length} {members.length === 1 ? "member" : "members"}</span>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {isOwner && (
              <Link
                href={`/groups/new?community_id=${communityId}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  height: 34,
                  padding: "0 14px",
                  borderRadius: 999,
                  background: "rgba(0, 201, 167, 0.12)",
                  border: "1px solid rgba(0, 201, 167, 0.35)",
                  color: "#00C9A7",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
                title="Convert this community to a travel group with live location sharing"
              >
                <Sparkles size={13} /> Group Mode
              </Link>
            )}

            <button
              onClick={() => setMembersDrawerOpen(true)}
              aria-label="View members"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--hover)",
                border: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--soft)",
                cursor: "pointer",
              }}
              title="View Members"
            >
              <Users size={15} />
            </button>
          </div>
        </div>

        {/* ── Messages Feed ───────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Welcome Banner */}
          <div
            style={{
              padding: "14px 16px",
              textAlign: "center",
              background: "rgba(0, 201, 167, 0.06)",
              border: "1px dashed rgba(0, 201, 167, 0.25)",
              borderRadius: 12,
              marginBottom: 6,
            }}
          >
            <p style={{ fontSize: "0.82rem", color: "var(--soft)", margin: 0, lineHeight: 1.5 }}>
              Welcome to <strong>{community?.name}</strong>. Coordinate plans, ask for local advice,
              and connect safely with verified travellers.
            </p>
          </div>

          {messages.map((msg) => {
            const isMe = msg.user_id === profile?.id;

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                  gap: 3,
                }}
              >
                {!isMe && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 4 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#00C9A7" }}>
                      {msg.profiles?.display_name || "Traveller"}
                    </span>
                    {msg.profiles?.role === "admin" && (
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: 999,
                          background: "rgba(185, 154, 101, 0.14)",
                          border: "1px solid rgba(185, 154, 101, 0.35)",
                          color: "#B99A65",
                        }}
                      >
                        Admin
                      </span>
                    )}
                    {msg.profiles?.role === "moderator" && (
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: 999,
                          background: "rgba(0, 201, 167, 0.12)",
                          border: "1px solid rgba(0, 201, 167, 0.35)",
                          color: "#00C9A7",
                        }}
                      >
                        Mod
                      </span>
                    )}
                  </div>
                )}

                <div
                  style={{
                    position: "relative",
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: isMe ? "rgba(0, 201, 167, 0.14)" : "var(--panel)",
                    color: "var(--text)",
                    border: isMe
                      ? "1px solid rgba(0, 201, 167, 0.32)"
                      : "1px solid var(--line)",
                    wordBreak: "break-word",
                    lineHeight: 1.48,
                    fontSize: "0.9rem",
                  }}
                >
                  {msg.body}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 6,
                      marginTop: 4,
                      fontSize: "0.68rem",
                      color: "var(--muted)",
                    }}
                  >
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {!isMe && (
                      <button
                        onClick={() => setReportingMessageId(msg.id)}
                        aria-label="Report message"
                        style={{
                          background: "none",
                          border: "none",
                          color: "inherit",
                          cursor: "pointer",
                          padding: 0,
                          opacity: 0.75,
                          display: "inline-flex",
                        }}
                        title="Report message"
                      >
                        <Flag size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Composer Bar ────────────────────────────────────────── */}
        <form
          onSubmit={handleSendMessage}
          style={{
            ...panelStyle,
            borderLeft: "none",
            borderRight: "none",
            borderBottom: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
          }}
        >
          <input
            aria-label="Message input"
            placeholder={
              profile?.is_verified
                ? "Type message to community…"
                : "Verify email to send messages"
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending || !profile?.is_verified}
            maxLength={2000}
            style={{
              flex: 1,
              height: 42,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--line)",
              borderRadius: 999,
              color: "var(--text)",
              padding: "0 16px",
              fontSize: "0.875rem",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim() || !profile?.is_verified}
            aria-label="Send message"
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "#fff",
              border: "none",
              color: "#0b0f12",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor:
                isSending || !inputText.trim() || !profile?.is_verified
                  ? "not-allowed"
                  : "pointer",
              opacity: isSending || !inputText.trim() || !profile?.is_verified ? 0.45 : 1,
              flexShrink: 0,
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* ── Members Drawer Modal ────────────────────────────────── */}
      {membersDrawerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(6, 10, 12, 0.78)",
            backdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              height: "100%",
              background: "var(--panel)",
              backdropFilter: "blur(22px) saturate(140%)",
              WebkitBackdropFilter: "blur(22px) saturate(140%)",
              borderLeft: "1px solid var(--line)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "1px solid var(--line)",
              }}
            >
              <h2
                style={{
                  fontFamily: "inherit",
                  fontSize: "1.05rem",
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                Community Members ({members.length})
              </h2>
              <button
                onClick={() => setMembersDrawerOpen(false)}
                aria-label="Close members drawer"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--hover)",
                  border: "1px solid var(--line)",
                  color: "var(--soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {members.map((m) => (
                <div
                  key={m.user_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #B99A65 0%, #8f7242 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#0b0f12",
                      }}
                    >
                      {m.profiles?.display_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.85rem", fontWeight: 500, margin: 0 }}>
                        {m.profiles?.display_name || "Traveller"}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "var(--muted)", margin: 0 }}>
                        {m.role === "owner" ? "Community Creator" : "Member"}
                      </p>
                    </div>
                  </div>

                  {m.user_id !== profile?.id && (
                    <button
                      onClick={() =>
                        setSelectedUserToBlock({
                          id: m.user_id,
                          name: m.profiles?.display_name || "this user",
                        })
                      }
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        height: 28,
                        padding: "0 10px",
                        borderRadius: 999,
                        background: "rgba(220, 38, 38, 0.12)",
                        border: "1px solid rgba(220, 38, 38, 0.35)",
                        color: "#fca5a5",
                        fontFamily: "inherit",
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                      title="Block user"
                    >
                      <UserX size={12} /> Block
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!isOwner && (
              <button
                onClick={handleLeave}
                style={{
                  marginTop: 16,
                  width: "100%",
                  height: 38,
                  borderRadius: 999,
                  background: "rgba(220, 38, 38, 0.1)",
                  border: "1px solid rgba(220, 38, 38, 0.35)",
                  color: "#fca5a5",
                  fontFamily: "inherit",
                  fontSize: "0.84rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Leave Community
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Block Confirmation Dialog ───────────────────────────── */}
      {selectedUserToBlock && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            background: "rgba(6, 10, 12, 0.82)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              ...panelStyle,
              borderRadius: 16,
              maxWidth: 380,
              width: "100%",
              padding: 22,
            }}
          >
            <h3 style={{ fontFamily: "inherit", fontSize: "1.05rem", fontWeight: 500, margin: "0 0 8px 0" }}>
              Block {selectedUserToBlock.name}?
            </h3>
            <p
              style={{
                fontSize: "0.84rem",
                color: "var(--muted)",
                lineHeight: 1.5,
                margin: "0 0 18px 0",
              }}
            >
              Blocked users cannot DM or see each other&apos;s messages in shared spaces, and
              cannot be placed in the same travel group.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleBlockUser}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 999,
                  background: "var(--danger)",
                  border: "none",
                  color: "#fff",
                  fontFamily: "inherit",
                  fontSize: "0.84rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Confirm Block
              </button>
              <button
                onClick={() => setSelectedUserToBlock(null)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 999,
                  background: "var(--hover)",
                  border: "1px solid var(--line)",
                  color: "var(--soft)",
                  fontFamily: "inherit",
                  fontSize: "0.84rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Message Dialog ───────────────────────────────── */}
      {reportingMessageId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            background: "rgba(6, 10, 12, 0.82)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              ...panelStyle,
              borderRadius: 16,
              maxWidth: 400,
              width: "100%",
              padding: 22,
            }}
          >
            <h3 style={{ fontFamily: "inherit", fontSize: "1.05rem", fontWeight: 500, margin: "0 0 6px 0" }}>
              Report Message to Moderators
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: "0 0 12px 0" }}>
              Describe why this message violates WanderLens community standards.
            </p>
            <textarea
              rows={3}
              placeholder="Harassment, spam, commercial advertising, unsafe behavior…"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              maxLength={500}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                color: "var(--text)",
                padding: "10px 12px",
                fontSize: "0.84rem",
                fontFamily: "inherit",
                outline: "none",
                marginBottom: 14,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleReportMessage}
                disabled={!reportReason.trim()}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 999,
                  background: "var(--danger)",
                  border: "none",
                  color: "#fff",
                  fontFamily: "inherit",
                  fontSize: "0.84rem",
                  fontWeight: 500,
                  cursor: reportReason.trim() ? "pointer" : "not-allowed",
                  opacity: reportReason.trim() ? 1 : 0.5,
                }}
              >
                Submit Report
              </button>
              <button
                onClick={() => setReportingMessageId(null)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 999,
                  background: "var(--hover)",
                  border: "1px solid var(--line)",
                  color: "var(--soft)",
                  fontFamily: "inherit",
                  fontSize: "0.84rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
