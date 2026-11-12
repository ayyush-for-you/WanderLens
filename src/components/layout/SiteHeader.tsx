"use client";

/**
 * SiteHeader — WanderLens redesign (Phase 2).
 * Morphing dropdown, mobile sheet, auth-aware CTA.
 * CSS transitions only for the dropdown (no Framer Motion).
 * Wrapped in .wl-scope so the Phase 1 scoped reset applies.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { DISCOVER_IMAGES, MODE_IMAGES } from "@/constants/nav-images";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SiteHeaderProps {
  profile: Profile | null;
}

type MenuId = "discover" | "modes" | "destinations";

const MENU_ORDER: MenuId[] = ["discover", "modes", "destinations"];
const PAD = 20; // aligns panel text with trigger: 8px panel-padding + 12px row-padding

// ─── Discover panel rows ──────────────────────────────────────────────────────

const DISCOVER_ROWS = [
  {
    title: "Monument Scanner",
    desc: "Point your camera at any monument and learn its story.",
    href: "/scan",
  },
  {
    title: "Hidden Gems",
    desc: "High-rated places without the crowds.",
    href: "/discover",
  },
  {
    title: "Community Hubs",
    desc: "Destination rooms with travellers and locals.",
    href: "/communities",
  },
  {
    title: "Heritage Map",
    desc: "Explore monuments, viewpoints and food on the map.",
    href: "/discover",
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SiteHeader({ profile }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Mobile sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  // User account dropdown (signed-in state)
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Active discover row index
  const [activeImg, setActiveImg] = useState(0);

  // Refs for dropdown DOM nodes
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const ddRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Record<MenuId, HTMLDivElement | null>>({
    discover: null,
    modes: null,
    destinations: null,
  });
  const triggerRefs = useRef<Record<MenuId, HTMLButtonElement | null>>({
    discover: null,
    modes: null,
    destinations: null,
  });

  // Mutable refs for state machine (not React state — avoids re-renders)
  const currentRef = useRef<MenuId | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Header positioning ──────────────────────────────────────────────────

  const isHome = pathname === "/";

  // ─── Sign-out ────────────────────────────────────────────────────────────

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  // ─── Close sheet and user-menu on route change ────────────────────────────

  useEffect(() => {
    setSheetOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // ─── Close user-menu on outside click ────────────────────────────────────

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as Node;
      if (headerRef.current && !headerRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [userMenuOpen]);

  // ─── Dropdown state machine ───────────────────────────────────────────────

  const place = useCallback((id: MenuId) => {
    const dd = ddRef.current;
    const panel = panelRefs.current[id];
    const trigger = triggerRefs.current[id];
    const header = headerRef.current;
    if (!dd || !panel || !trigger || !header) return;

    const panelW = panel.offsetWidth;
    const panelH = panel.offsetHeight;
    const triggerRect = trigger.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const offsetParentRect = (
      (dd.offsetParent as Element) || header
    ).getBoundingClientRect();

    let x = triggerRect.left - PAD;
    // Clamp so the panel stays within the header
    x = Math.max(headerRect.left + 12, Math.min(x, headerRect.right - panelW - 12));
    x -= offsetParentRect.left;

    dd.style.setProperty("--x", `${x}px`);
    dd.style.setProperty("--w", `${panelW}px`);
    dd.style.setProperty("--h", `${panelH}px`);
  }, []);

  const closeDropdown = useCallback(() => {
    const dd = ddRef.current;
    if (!dd) return;
    dd.classList.remove("open");

    const cur = currentRef.current;
    if (cur) {
      panelRefs.current[cur]?.removeAttribute("data-state");
    }

    MENU_ORDER.forEach((id) => {
      triggerRefs.current[id]?.setAttribute("aria-expanded", "false");
    });
    currentRef.current = null;
  }, []);

  const scheduleClose = useCallback(
    (ms = 140) => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(closeDropdown, ms);
    },
    [closeDropdown]
  );

  const openDropdown = useCallback(
    (id: MenuId) => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

      const dd = ddRef.current;
      if (!dd) return;

      const cur = currentRef.current;

      if (!cur) {
        // ── FIRST OPEN ──
        // Snap everything into starting position silently
        dd.classList.add("instant", "snap");
        MENU_ORDER.forEach((mid) => {
          const p = panelRefs.current[mid];
          if (p) {
            p.classList.add("snap");
            p.removeAttribute("data-state");
          }
        });
        place(id);
        // Force reflow so the browser commits the position before we animate
        void dd.offsetWidth;
        dd.classList.remove("snap");
        MENU_ORDER.forEach((mid) => {
          panelRefs.current[mid]?.classList.remove("snap");
        });
        dd.classList.add("open");
        // Active panel
        panelRefs.current[id]?.setAttribute("data-state", "active");
        // On next frame, remove .instant so width/height transitions re-enable
        requestAnimationFrame(() => {
          dd.classList.remove("instant");
        });
      } else {
        // ── SWITCH ──
        if (cur === id) return; // already on this panel

        const curIdx = MENU_ORDER.indexOf(cur);
        const newIdx = MENU_ORDER.indexOf(id);
        const dir = newIdx > curIdx ? 1 : -1;

        // Exit the current panel
        panelRefs.current[cur]?.setAttribute(
          "data-state",
          dir > 0 ? "exit-left" : "exit-right"
        );

        // Enter the new panel from the opposite edge
        const newPanel = panelRefs.current[id];
        if (newPanel) {
          newPanel.classList.add("snap");
          newPanel.setAttribute("data-state", dir > 0 ? "exit-right" : "exit-left");
          void newPanel.offsetWidth; // force reflow
          newPanel.classList.remove("snap");
          place(id); // container morphs over 0.5s
          newPanel.setAttribute("data-state", "active");
        }
      }

      // aria-expanded housekeeping
      MENU_ORDER.forEach((mid) => {
        triggerRefs.current[mid]?.setAttribute(
          "aria-expanded",
          mid === id ? "true" : "false"
        );
      });
      currentRef.current = id;
    },
    [place]
  );

  const toggleDropdown = useCallback(
    (id: MenuId) => {
      if (currentRef.current === id) {
        closeDropdown();
      } else {
        openDropdown(id);
      }
    },
    [openDropdown, closeDropdown]
  );

  // ─── Global event wiring (outside click, Escape, resize) ─────────────────

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const nav = navRef.current;
      if (!nav) return;
      if (!nav.contains(e.target as Node)) {
        closeDropdown();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const cur = currentRef.current;
        if (cur) {
          closeDropdown();
          triggerRefs.current[cur]?.focus();
        }
        setSheetOpen(false);
      }
    };

    const handleResize = () => {
      const cur = currentRef.current;
      if (cur) place(cur);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [place, closeDropdown]);

  // ─── Close dropdown on route change ──────────────────────────────────────

  useEffect(() => {
    closeDropdown();
  }, [pathname, closeDropdown]);

  // ─── Rendered JSX ─────────────────────────────────────────────────────────

  return (
    <header
      ref={headerRef}
      id="header"
      className="wl-scope"
      style={{
        position: isHome ? "absolute" : "sticky",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        ...(isHome
          ? {}
          : {
              background: "var(--ink)",
              borderBottom: "1px solid var(--line)",
            }),
      }}
    >
      {/* ── Bar ── */}
      <div
        className="bar"
        style={{
          height: 76,
          padding: "0 clamp(20px, 3.4vw, 52px)",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
        }}
      >
        {/* ── Logo ── */}
        <Link
          href="/"
          aria-label="WanderLens home"
          style={{
            display: "inline-flex",
            justifySelf: "start",
            animation: "fadeDown 0.9s var(--ease) 0.35s backwards",
          }}
        >
          <svg
            width="30"
            height="26"
            viewBox="0 0 30 26"
            fill="white"
            fillRule="evenodd"
            aria-hidden="true"
          >
            <path d="M3.2 19.6C.4 15.8 1.3 8.6 6.6 4.7 11.3 1.2 18.9.9 23.9 4.1c4.7 3 6.3 9 3.6 13.9-2.9 5.3-9.4 7.7-15.4 7-3.8-.4-6.9-2.4-8.9-5.4ZM9.5 17.2l4.3-6.4 2.6 3.6 1.7-2.2 3.4 5z" />
          </svg>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav
          ref={navRef}
          className="desktop-nav"
          aria-label="Main"
          style={{ animation: "fadeIn 0.9s ease 0.45s backwards", position: "relative" }}
          onPointerEnter={(e) => {
            if (e.pointerType !== "mouse") return;
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType !== "mouse") return;
            scheduleClose();
          }}
          onBlur={(e) => {
            // focusout: check if focus left the nav entirely
            if (!navRef.current?.contains(e.relatedTarget as Node)) {
              scheduleClose(0);
            }
          }}
        >
          <ul
            className="links"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 26,
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {/* Discover trigger */}
            <li>
              <button
                ref={(el) => { triggerRefs.current.discover = el; }}
                data-menu="discover"
                aria-expanded="false"
                aria-haspopup="true"
                style={navLinkStyle}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") openDropdown("discover");
                }}
                onClick={() => toggleDropdown("discover")}
              >
                Discover
                <Chevron />
              </button>
            </li>

            {/* Travel Modes trigger */}
            <li>
              <button
                ref={(el) => { triggerRefs.current.modes = el; }}
                data-menu="modes"
                aria-expanded="false"
                aria-haspopup="true"
                style={navLinkStyle}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") openDropdown("modes");
                }}
                onClick={() => toggleDropdown("modes")}
              >
                Travel Modes
                <Chevron />
              </button>
            </li>

            {/* Destinations trigger */}
            <li>
              <button
                ref={(el) => { triggerRefs.current.destinations = el; }}
                data-menu="destinations"
                aria-expanded="false"
                aria-haspopup="true"
                style={navLinkStyle}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") openDropdown("destinations");
                }}
                onClick={() => toggleDropdown("destinations")}
              >
                Destinations
                <Chevron />
              </button>
            </li>

            {/* Our story — plain link */}
            <li>
              <Link
                href="/#brand-story"
                style={navLinkStyle}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") scheduleClose(60);
                }}
              >
                Our story
              </Link>
            </li>
          </ul>

          {/* ── Morphing dropdown container ── */}
          <div
            ref={ddRef}
            className="dd"
            style={{
              // Static layout values only — transitions and CSS vars are in SCOPED_CSS
              position: "absolute",
              top: 64,
              left: 0,
              borderRadius: 16,
              background: "var(--panel)",
              border: "1px solid var(--line)",
              boxShadow:
                "0 30px 70px -25px rgba(0,0,0,0.65), 0 2px 10px rgba(0,0,0,0.2)",
              backdropFilter: "blur(22px) saturate(140%)",
              WebkitBackdropFilter: "blur(22px) saturate(140%)",
              overflow: "hidden",
            }}
          >
            {/* ── Panel A: Discover ── */}
            <div
              ref={(el) => { panelRefs.current.discover = el; }}
              className="panel"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                display: "grid",
                gridTemplateColumns: "236px 1fr",
                width: 664,
                height: 358,
              }}
            >
              {/* Left list */}
              <div
                className="d-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: 8,
                  gap: 2,
                }}
              >
                {DISCOVER_ROWS.map((row, i) => (
                  <Link
                    key={row.href + row.title}
                    href={row.href}
                    className={`d-item${i === activeImg ? " is-active" : ""}`}
                    data-img={i}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      padding: "0 12px",
                      borderRadius: 10,
                      textDecoration: "none",
                      color: "inherit",
                      transition: "background 0.3s",
                    }}
                    onPointerEnter={() => setActiveImg(i)}
                    onFocus={() => setActiveImg(i)}
                  >
                    <strong
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        marginBottom: 4,
                        color: "var(--text)",
                      }}
                    >
                      {row.title}
                    </strong>
                    <span
                      style={{
                        fontSize: 13,
                        lineHeight: 1.42,
                        color: "var(--muted)",
                      }}
                    >
                      {row.desc}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Right image preview */}
              <div
                className="d-media"
                aria-hidden="true"
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "0 15px 15px 0",
                }}
              >
                {/* Left-edge fade */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 70,
                    background:
                      "linear-gradient(to right, rgba(14,19,23,0.55), rgba(14,19,23,0))",
                    zIndex: 2,
                    pointerEvents: "none",
                  }}
                />
                {DISCOVER_IMAGES.map((src, i) => (
                  // Plain <img> — no next/image, no remotePatterns needed
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className={i === activeImg ? "is-active" : ""}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ── Panel B: Travel Modes ── */}
            <div
              ref={(el) => { panelRefs.current.modes = el; }}
              className="panel"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 446,
                height: 308,
                padding: 7,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 7,
              }}
            >
              {/* Solo Mode card */}
              <Link
                href="/mode-select"
                style={modeCardStyle}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={MODE_IMAGES.solo}
                  alt=""
                  className="mode-img"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: -2,
                  }}
                />
                <div style={modeCardOverlayStyle} />
                <strong style={{ fontSize: 15.5, fontWeight: 500, marginBottom: 5, color: "var(--text)" }}>
                  Solo Mode
                </strong>
                <span style={{ fontSize: 13, lineHeight: 1.42, color: "var(--muted)" }}>
                  Discovery, hidden gems and an opt-in SOS beacon.
                </span>
              </Link>

              {/* Group Mode card */}
              <Link
                href="/mode-select"
                style={modeCardStyle}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={MODE_IMAGES.group}
                  alt=""
                  className="mode-img"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: -2,
                  }}
                />
                <div style={modeCardOverlayStyle} />
                <strong style={{ fontSize: 15.5, fontWeight: 500, marginBottom: 5, color: "var(--text)" }}>
                  Group Mode
                </strong>
                <span style={{ fontSize: 13, lineHeight: 1.42, color: "var(--muted)" }}>
                  Shared trips, live map and one-tap group alerts.
                </span>
              </Link>
            </div>

            {/* ── Panel C: Destinations ── */}
            <div
              ref={(el) => { panelRefs.current.destinations = el; }}
              className="panel"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 232,
                height: 218,
                padding: 8,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {[
                { label: "Varanasi", href: "/communities" },
                { label: "Jaipur", href: "/communities" },
                { label: "Hampi", href: "/communities" },
                { label: "All destinations", href: "/communities" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="r-link"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    borderRadius: 9,
                    fontSize: 15,
                    color: "var(--text)",
                    textDecoration: "none",
                    transition: "background 0.25s",
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* ── Actions (right) ── */}
        <div
          className="actions"
          style={{
            justifySelf: "end",
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "fadeDown 0.9s var(--ease) 0.55s backwards",
          }}
        >
          {/* CTA Pill */}
          {profile ? (
            /* Signed in: avatar button + dropdown */
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-label="User menu"
                aria-expanded={userMenuOpen}
                style={{
                  height: 32,
                  padding: "0 15px",
                  borderRadius: 999,
                  background: profile.avatar_url
                    ? `url(${profile.avatar_url}) center/cover`
                    : "#fff",
                  color: "#0b0f12",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 0.25s, transform 0.25s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 32,
                }}
              >
                {!profile.avatar_url && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0b0f12" }}>
                    {profile.display_name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {userMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 42,
                    zIndex: 50,
                    width: 200,
                    background: "var(--panel)",
                    border: "1px solid var(--line)",
                    borderRadius: 14,
                    backdropFilter: "blur(22px) saturate(140%)",
                    WebkitBackdropFilter: "blur(22px) saturate(140%)",
                    overflow: "hidden",
                    padding: 6,
                  }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--line)",
                      marginBottom: 4,
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>
                      {profile.display_name}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>
                      Role: {profile.role}
                    </p>
                  </div>

                  <UserMenuItem href="/mode-select">🧭 Switch Travel Mode</UserMenuItem>
                  <UserMenuItem href="/profile">My Account</UserMenuItem>

                  {(profile.role === "admin" || profile.role === "moderator") && (
                    <UserMenuItem
                      href={profile.role === "admin" ? "/admin" : "/moderator"}
                      accent
                    >
                      {profile.role === "admin" ? "Admin Console" : "Mod Queue"}
                    </UserMenuItem>
                  )}

                  <button
                    onClick={handleSignOut}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 9,
                      fontSize: 14,
                      color: "var(--danger)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "background 0.25s",
                    }}
                    onPointerEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background = "var(--hover)")
                    }
                    onPointerLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background = "")
                    }
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Signed out: Get started pill */
            <Link
              href="/signup"
              style={ctaPillStyle}
              onPointerEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "#e9eef0";
                el.style.transform = "translateY(-1px)";
              }}
              onPointerLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "#fff";
                el.style.transform = "";
              }}
            >
              Get started
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            aria-label="Open menu"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen((v) => !v)}
            style={{
              display: "none", // shown via CSS at ≤860px
              width: 36,
              height: 32,
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            className="hamburger"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M2 5.5h12M2 10.5h12"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile sheet ── */}
      <div
        className="mobile-sheet"
        aria-hidden={!sheetOpen}
        style={{
          position: "absolute",
          top: 68,
          left: 12,
          right: 12,
          padding: 10,
          borderRadius: 16,
          background: "var(--panel)",
          border: "1px solid var(--line)",
          backdropFilter: "blur(22px) saturate(140%)",
          WebkitBackdropFilter: "blur(22px) saturate(140%)",
          maxHeight: "calc(100svh - 90px)",
          overflowY: "auto",
          opacity: sheetOpen ? 1 : 0,
          visibility: sheetOpen ? "visible" : "hidden",
          transform: sheetOpen ? "none" : "translateY(-6px) scale(0.98)",
          transformOrigin: "50% 0",
          transition:
            "opacity 0.3s ease, transform 0.45s var(--ease), visibility 0s linear " +
            (sheetOpen ? "0s" : "0.45s"),
          zIndex: 10,
        }}
      >
        {/* DISCOVER group */}
        <SheetHeading>Discover</SheetHeading>
        {DISCOVER_ROWS.map((row) => (
          <SheetLink key={row.title} href={row.href} onClose={() => setSheetOpen(false)}>
            {row.title}
          </SheetLink>
        ))}

        {/* TRAVEL MODES group */}
        <SheetHeading>Travel Modes</SheetHeading>
        <SheetLink href="/mode-select" onClose={() => setSheetOpen(false)}>Solo Mode</SheetLink>
        <SheetLink href="/mode-select" onClose={() => setSheetOpen(false)}>Group Mode</SheetLink>

        {/* DESTINATIONS group */}
        <SheetHeading>Destinations</SheetHeading>
        {["Varanasi", "Jaipur", "Hampi", "All destinations"].map((label) => (
          <SheetLink key={label} href="/communities" onClose={() => setSheetOpen(false)}>
            {label}
          </SheetLink>
        ))}

        {/* WANDERLENS group */}
        <SheetHeading>WanderLens</SheetHeading>
        <SheetLink href="/#brand-story" onClose={() => setSheetOpen(false)}>Our story</SheetLink>

        {profile ? (
          <>
            <SheetLink href="/profile" onClose={() => setSheetOpen(false)}>My Account</SheetLink>
            <SheetLink href="/mode-select" onClose={() => setSheetOpen(false)}>Switch Travel Mode</SheetLink>
            {(profile.role === "admin" || profile.role === "moderator") && (
              <SheetLink
                href={profile.role === "admin" ? "/admin" : "/moderator"}
                onClose={() => setSheetOpen(false)}
              >
                {profile.role === "admin" ? "Admin Console" : "Mod Queue"}
              </SheetLink>
            )}
            <button
              onClick={() => { setSheetOpen(false); handleSignOut(); }}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 12px",
                borderRadius: 9,
                fontSize: 15,
                color: "var(--danger)",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <SheetLink href="/signup" onClose={() => setSheetOpen(false)}>Get started</SheetLink>
        )}
      </div>

      {/* ── Scoped CSS for dropdown and mobile ── */}
      <style>{SCOPED_CSS}</style>
    </header>
  );
}

// ─── Small helper components ──────────────────────────────────────────────────

function Chevron() {
  return (
    <svg
      className="chevron"
      width="8"
      height="5"
      viewBox="0 0 8 5"
      fill="none"
      aria-hidden="true"
      style={{ transition: "transform 0.35s var(--ease)", flexShrink: 0 }}
    >
      <path
        d="M1 1l3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SheetHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--muted)",
        margin: "10px 12px 6px",
      }}
    >
      {children}
    </h3>
  );
}

function SheetLink({
  href,
  children,
  onClose,
}: {
  href: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      style={{
        display: "block",
        padding: "10px 12px",
        borderRadius: 9,
        fontSize: 15,
        color: "var(--text)",
        textDecoration: "none",
        transition: "background 0.25s",
      }}
      onPointerEnter={(e) =>
        ((e.currentTarget as HTMLAnchorElement).style.background = "var(--hover)")
      }
      onPointerLeave={(e) =>
        ((e.currentTarget as HTMLAnchorElement).style.background = "")
      }
    >
      {children}
    </Link>
  );
}

function UserMenuItem({
  href,
  children,
  accent = false,
}: {
  href: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "9px 12px",
        borderRadius: 9,
        fontSize: 14,
        color: accent ? "#f59e0b" : "var(--soft)",
        textDecoration: "none",
        transition: "background 0.25s",
      }}
      onPointerEnter={(e) =>
        ((e.currentTarget as HTMLAnchorElement).style.background = "var(--hover)")
      }
      onPointerLeave={(e) =>
        ((e.currentTarget as HTMLAnchorElement).style.background = "")
      }
    >
      {children}
    </Link>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const navLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 0",
  fontSize: 14.5,
  color: "var(--soft)",
  transition: "color 0.25s ease",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

const ctaPillStyle: React.CSSProperties = {
  height: 32,
  padding: "0 15px",
  borderRadius: 999,
  background: "#fff",
  color: "#0b0f12",
  fontSize: 14,
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  textDecoration: "none",
  transition: "background 0.25s, transform 0.25s",
};

const modeCardStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 10,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  padding: 14,
  isolation: "isolate",
  textDecoration: "none",
  color: "inherit",
};

const modeCardOverlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: -1,
  background:
    "linear-gradient(to top, rgba(8,11,13,0.88) 0%, rgba(8,11,13,0.35) 38%, rgba(8,11,13,0) 60%)",
};

// ─── Scoped CSS injected into the header ─────────────────────────────────────
// All selectors are scoped under #header so they don't bleed globally.

const SCOPED_CSS = `
/* ── Dropdown container — base state controlled entirely by CSS ── */
#header .dd {
  --x: 0px;
  --w: 400px;
  --h: 300px;
  --s: 0.97;
  width: var(--w);
  height: var(--h);
  transform: translateX(var(--x)) scale(var(--s));
  transform-origin: 50% 0;
  opacity: 0;
  pointer-events: none;
  transition:
    transform var(--morph) var(--ease),
    width var(--morph) var(--ease),
    height var(--morph) var(--ease),
    opacity 0.3s ease;
}
#header .dd.open {
  --s: 1;
  opacity: 1;
  pointer-events: auto;
}
#header .dd.instant {
  transition: opacity 0.3s ease, transform var(--morph) var(--ease);
}
#header .dd.instant.snap {
  transition: none;
}

/* ── Panels ── */
#header .panel {
  opacity: 0;
  visibility: hidden;
  filter: blur(8px);
  transform: translateX(0);
  transition:
    opacity 0.26s ease,
    transform var(--morph) var(--ease),
    filter 0.4s ease,
    visibility 0s linear var(--morph);
}
#header .panel[data-state="exit-left"] {
  transform: translateX(-56px);
}
#header .panel[data-state="exit-right"] {
  transform: translateX(56px);
}
#header .panel[data-state="active"] {
  opacity: 1;
  visibility: visible;
  filter: blur(0);
  transform: translateX(0);
  transition:
    opacity 0.36s ease 0.06s,
    transform var(--morph) var(--ease),
    filter 0.45s ease 0.04s,
    visibility 0s;
}
#header .panel.snap {
  transition: none !important;
}

/* ── Discover row hover ── */
#header .d-item:hover,
#header .d-item.is-active {
  background: var(--hover);
}

/* ── Discover image crossfade ── */
#header .d-media img {
  opacity: 0;
  transform: scale(1.06);
  filter: blur(10px);
  transition: opacity 0.6s ease, transform 0.9s var(--ease), filter 0.6s ease;
}
#header .d-media img.is-active {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
  z-index: 1;
}

/* ── Mode cards image hover ── */
#header .mode-img {
  transition: transform 0.9s var(--ease), filter 0.5s;
}
#header a:hover .mode-img,
#header a:focus-visible .mode-img {
  transform: scale(1.05);
  filter: brightness(1.08);
}

/* ── Destinations link hover ── */
#header .r-link:hover,
#header .r-link:focus-visible {
  background: var(--hover);
}

/* ── Nav trigger hover / expanded ── */
#header .desktop-nav button[data-menu]:hover,
#header .desktop-nav button[data-menu][aria-expanded="true"] {
  color: #fff;
}
#header .desktop-nav button[data-menu][aria-expanded="true"] .chevron {
  transform: rotate(180deg);
}

/* ── Desktop nav visible, hamburger hidden ── */
#header .desktop-nav {
  display: block;
}
#header .hamburger {
  display: none;
}
#header .mobile-sheet {
  display: none;
}

/* ── Mobile breakpoint ── */
@media (max-width: 860px) {
  #header .bar {
    grid-template-columns: 1fr auto !important;
  }
  #header .desktop-nav {
    display: none !important;
  }
  #header .hamburger {
    display: inline-flex !important;
  }
  #header .mobile-sheet {
    display: block !important;
  }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  #header .dd,
  #header .panel,
  #header .d-media img,
  #header .mode-img {
    transition: none !important;
    filter: none !important;
  }
}
`;

