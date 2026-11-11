ROLE
You are a senior front-end engineer working inside an existing, working Next.js project called WanderLens (AI-powered heritage tourism and solo/group travel platform). Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Leaflet/React-Leaflet, Supabase.

GOAL
Replace the current visual design, layout and UX of the website with the design system described below. This is a PRESENTATION-ONLY redesign.

=====================================================================
NON-NEGOTIABLE CONSTRAINTS
=====================================================================
Do NOT change, rename, move or delete any of the following:
- API route handlers (src/app/api/**), middleware.ts, route guards, auth/session logic
- Supabase schema, migrations, RLS policies, RPC functions
- src/lib/** logic (including recommendations/ranking.ts and its tests), constants, types, validation (Zod)
- The Python recognition service
- Component props, handlers, state, hooks, data fetching, Realtime subscriptions, rate limits, or form logic
- Existing route paths and URLs. Do not invent new routes: every link in the new nav must point to a route that already exists.

You MAY change: JSX structure/markup, CSS/Tailwind classes, layout, fonts, colors, spacing, animation, icons, and image assets. When restructuring markup, keep every existing handler, ref, aria attribute, data-* attribute and test id working. If a visual change would require a logic change, STOP, leave the logic as-is, and note it in your final report.

Behaviour that must survive the redesign (verify each):
1. Mode selection (/mode-select): Solo vs Group choice and what it persists/redirects to.
2. Scan page: camera capture, upload fallback, 5 MB / JPEG-PNG-WebP validation, optional GPS, result states (high-confidence match, top-3 candidates), archival side-by-side slider with license credits.
3. Hidden gem recommendations: cards, category filters, explainability rationale text.
4. Group live map: Leaflet map renders and resizes correctly, 10-second location stream, member cards, sharing toggle, one-tap alerts (need_help / regroup / custom).
5. SOS: opt-in toggle, countdown confirmation before sending, radar/responder view, "I am responding" flow, rate-limit error display.
6. Communities and feed: realtime chat, posts with up to 4 images, ratings, likes, comments.
7. Moderator/admin screens: queues, role gating, audit views.
8. Auth state in the header (signed in/out, role-based links) and middleware redirects.
9. PWA manifest and responsiveness on mobile, tablet, desktop.

=====================================================================
PHASE 0 — AUDIT (before editing anything)
=====================================================================
Read the repo: layout.tsx, global CSS/Tailwind config, the current header/nav component, the landing page (page.tsx, HomeClient.tsx), mode-select, and the shared UI components. List: existing routes, how auth state reaches the header, which components use Framer Motion, and where Leaflet is loaded (SSR/dynamic import). Output a short plan of files you will touch. Do not start editing until the plan is written. Commit-friendly: work in small, reviewable steps.

=====================================================================
PHASE 1 — STACK ADAPTATION
=====================================================================
The spec below was written for a single index.html. Implement it as React/Next.js, not as a standalone file:
- Fonts: load Geist (weights 400 and 500) with next/font in the root layout; font stack "Geist", "Inter", system-ui, sans-serif; antialiased. Keep any existing serif display font only if I explicitly ask; otherwise use Geist throughout.
- Put the CSS custom properties in the global stylesheet (:root) and expose them to Tailwind v4 via @theme where useful. Use plain CSS or CSS modules for the dropdown/panel/hero rules where exact values matter; do not approximate them with near-equivalent Tailwind utilities.
- Header + dropdown = one "use client" component (e.g. SiteHeader) with refs and effects replacing the vanilla IIFE. Same state machine, same timings. Do not use Framer Motion for the dropdown morph; CSS transitions only, as specified.
- Use real <Link> from next/link for internal routes. Keep hydration-safe (no window access during render; measure in effects/handlers).
- Images: use plain <img> or next/image with remotePatterns configured. The CloudFront URLs below are TEMPORARY PLACEHOLDERS: put them in a single constants file so I can swap them for my own heritage photography in /public later.

=====================================================================
PHASE 2 — BRAND MAPPING (Halden → WanderLens)
=====================================================================
- Brand name: WanderLens. <title>: "WanderLens — Discover heritage, travel safely". Update aria-labels accordingly ("WanderLens home", hero aria-label "WanderLens heritage travel").
- Logo: 30x26 inline SVG, white. Reuse the pebble-with-mountain path below as a placeholder unless the repo already has a WanderLens logo (then use that, same 30x26 slot).
- Right-side CTA (replaces "Enquire"): same pill styling. Logged out → "Get started" linking to the existing sign-up/login route. Logged in → whatever the current header shows for the signed-in state (profile / open app), restyled to this pill. Do not change auth behaviour.
- Nav items (replace Discover/Journeys/Regions/Our story). Use REAL routes found in the audit:
  1. Discover (dropdown, 4 rows with image previews): "Monument Scanner" — "Point your camera at any monument and learn its story." / "Hidden Gems" — "High-rated places without the crowds." / "Community Hubs" — "Destination rooms with travellers and locals." / "Heritage Map" — "Explore monuments, viewpoints and food on the map."
  2. Travel Modes (dropdown, 2 photo cards): "Solo Mode" — "Discovery, hidden gems and an opt-in SOS beacon." / "Group Mode" — "Shared trips, live map and one-tap group alerts." (link to /mode-select, preserving whatever param/state the current mode selection uses)
  3. Destinations (dropdown, 4 text rows): Varanasi, Jaipur, Hampi, plus "All destinations" (link to the existing destinations/communities listing).
  4. "Our story" plain link (anchor to the landing page's brand-story section if it exists; otherwise the closest existing section).
- If a nav destination above has no existing route, link it to the nearest existing route and list it in your final report. Never create stub pages.
- Role-gated links (moderator/admin) that exist in the current header must remain, placed in the mobile sheet and/or the signed-in user menu, with the same visibility rules.
- Hero scroll cue text: "( scroll down )" as specified. No headline over the hero image, as specified.
- Keep the existing landing page sections below the hero (brand story, heritage magazine, map, solo/group highlights, globe). Restyle them to this system (dark ink background, white/muted text, Geist, thin 1px --line borders, 10–16px radii). Do not delete sections.

=====================================================================
PHASE 3 — DESIGN SYSTEM SPEC (match every value exactly)
=====================================================================
:root tokens
  --ink:   #0b1013          (page background)
  --panel: rgba(14, 19, 23, 0.84)   (dropdown + mobile sheet)
  --line:  rgba(255, 255, 255, 0.08)
  --hover: rgba(255, 255, 255, 0.065)
  --text:  #ffffff
  --soft:  rgba(255, 255, 255, 0.74)  (idle nav links)
  --muted: rgba(255, 255, 255, 0.60)  (descriptions)
  --ease:  cubic-bezier(0.22, 1, 0.36, 1)
  --morph: 0.5s
  Additionally define --danger: #DC2626 (hover #EF4444). Crimson is RESERVED for SOS and destructive actions only, so emergency UI stays instantly recognisable. It must not be used as a general accent.

Global reset: box-sizing border-box; links inherit colour, no underline; buttons no background/border/padding, inherit font and colour, cursor pointer; img display block.
:focus-visible { outline: 2px solid #fff; outline-offset: 3px; border-radius: 6px }

HERO (landing page)
<section class="hero" aria-label="WanderLens heritage travel">: position relative; height 100vh then 100svh; min-height 560px; overflow hidden; isolation isolate.
 .hero-bg (role="img", aria-label describing the photo): absolute inset 0; z-index -2;
   background: #1b2a30 url(HERO_IMAGE) center 45% / cover no-repeat;
   animation: heroIn 2.4s var(--ease) both;
   @keyframes heroIn { from { transform: scale(1.08); filter: brightness(0.6) } to { transform: scale(1); filter: brightness(1) } }
   HERO_IMAGE (temporary): https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_144652_9eaf1d6a-3e8d-4460-bd5b-0ec7221685a0.png
 .hero::after: absolute inset 0; z-index -1; pointer-events none; background:
   linear-gradient(to bottom, rgba(6,10,12,0.35) 0%, rgba(6,10,12,0) 22%),
   linear-gradient(to top, rgba(6,9,11,0.8) 0%, rgba(6,9,11,0.25) 30%, rgba(6,9,11,0) 55%)
 Scroll cue (aria-hidden), centred: absolute; left 50%; top 44%; transform translateX(-50%); flex; align-items center; gap 16px; font-size 13.5px; letter-spacing 0.01em; color rgba(255,255,255,0.92); text-shadow 0 1px 12px rgba(0,0,0,0.35); the two parenthesis spans opacity 0.8;
   animation: fadeUp 1s var(--ease) 0.9s both; @keyframes fadeUp { from { opacity:0; transform: translate(-50%, 10px) } to { opacity:1; transform: translate(-50%, 0) } }
 No headline/subtitle. Only the header and the scroll cue.

HEADER
<header id="header">: position absolute; top 0; left 0; right 0; z-index 20 (on the landing page). It is the containing block for the dropdown.
 On inner app pages (scan, groups, sos, etc.) use the same header and dropdown but in normal flow or sticky with background var(--ink) and a bottom 1px var(--line) border, so it never overlaps page content or the Leaflet maps.
 .bar: height 76px; padding 0 clamp(20px, 3.4vw, 52px); grid; grid-template-columns 1fr auto 1fr; align-items center. Children: logo (left), nav (centre), actions (right).
 Entrance animations (fill-mode BACKWARDS): logo fadeDown 0.9s var(--ease) 0.35s; nav fadeIn 0.9s ease 0.45s (OPACITY ONLY, never a transform on the nav, or the dropdown's containing block breaks); actions fadeDown 0.9s var(--ease) 0.55s.
   @keyframes fadeDown { from { opacity:0; transform: translateY(-8px) } to { opacity:1; transform: translateY(0) } }  @keyframes fadeIn { from { opacity:0 } }
 Logo: 30x26px, inline-flex, justify-self start, viewBox "0 0 30 26", one white path, fill-rule evenodd:
   M3.2 19.6C.4 15.8 1.3 8.6 6.6 4.7 11.3 1.2 18.9.9 23.9 4.1c4.7 3 6.3 9 3.6 13.9-2.9 5.3-9.4 7.7-15.4 7-3.8-.4-6.9-2.4-8.9-5.4ZM9.5 17.2l4.3-6.4 2.6 3.6 1.7-2.2 3.4 5z
 Nav: <nav class="desktop-nav" aria-label="Main"> > <ul class="links"> (flex, align-items center, gap 26px, no list style). Triggers (buttons with data-menu and aria-expanded) and the plain link: inline-flex; align-items center; gap 6px; padding 8px 0; font-size 14.5px; colour var(--soft); transition colour 0.25s ease; hover and aria-expanded="true" → #fff.
 Chevron: svg 8x5, viewBox "0 0 8 5", path "M1 1l3 3 3-3", stroke currentColor, width 1.3, round caps/joins, no fill; transition transform 0.35s var(--ease); rotate 180deg when expanded.
 The dropdown .dd sits INSIDE the <nav>, after the <ul>, so nav pointerleave covers links and panel.
 .actions: justify-self end; flex; gap 10px. CTA pill: height 32px; padding 0 15px; radius 999px; background #fff; colour #0b0f12; 14px; weight 500; hover background #e9eef0 + translateY(-1px); transition 0.25s.

MORPHING DROPDOWN (copy exactly)
One shared container .dd holds three panels. Moving between triggers does not close/reopen: it morphs x, width, height, and content slides in the direction of travel with a blur crossfade.
 .dd: --x:0px; --w:400px; --h:300px; --s:0.97; position absolute; top 64px; left 0; width var(--w); height var(--h); transform translateX(var(--x)) scale(var(--s)); transform-origin 50% 0; opacity 0; pointer-events none; radius 16px; background var(--panel); border 1px solid var(--line); box-shadow 0 30px 70px -25px rgba(0,0,0,0.65), 0 2px 10px rgba(0,0,0,0.2); backdrop-filter (+ -webkit-) blur(22px) saturate(140%); overflow hidden;
   transition: transform var(--morph) var(--ease), width var(--morph) var(--ease), height var(--morph) var(--ease), opacity 0.3s ease;
   .open { --s:1; opacity:1; pointer-events:auto }
   .instant { transition: opacity 0.3s ease, transform var(--morph) var(--ease) }
   .instant.snap { transition: none }
 .panel: absolute; top 0; left 0; opacity 0; visibility hidden; filter blur(8px); transform translateX(0); transition: opacity 0.26s ease, transform var(--morph) var(--ease), filter 0.4s ease, visibility 0s linear var(--morph);
   [data-state="exit-left"] translateX(-56px); [data-state="exit-right"] translateX(56px);
   [data-state="active"] opacity 1; visibility visible; filter blur(0); transform translateX(0); transition: opacity 0.36s ease 0.06s, transform var(--morph) var(--ease), filter 0.45s ease 0.04s, visibility 0s;
   .snap { transition: none !important }
 Panel A "Discover": 664x358; grid; columns 236px 1fr.
   Left .d-list: flex column; padding 8px; gap 2px. Four rows (.d-item, data-img 0–3): flex 1; flex column; justify-content center; padding 0 12px; radius 10px; background transition 0.3s; .is-active → var(--hover); first row active by default. Title <strong> 15px/500, margin-bottom 4px; description <span> 13px, line-height 1.42, var(--muted).
   Right .d-media (aria-hidden): relative; overflow hidden; radius 0 15px 15px 0 (image flush to top/right/bottom). ::before: 70px left-edge fade linear-gradient(to right, rgba(14,19,23,0.55), rgba(14,19,23,0)); z-index 2. Four stacked images (absolute inset 0, 100%, object-fit cover, alt=""): default opacity 0, scale(1.06), blur(10px); transition opacity 0.6s ease, transform 0.9s var(--ease), filter 0.6s ease; .is-active → opacity 1, scale(1), blur(0), z-index 1. Hover/focus a row → it becomes active and its image crossfades in.
   Temporary images (in order): 
   https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_051509_384c49d8-b37c-49a7-9180-a06ad914ec24.png
   https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_051509_bf51abc3-090e-459f-8066-8f0cdd0c36b9.png
   https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_051509_c4fa86ad-842a-41c9-8cff-a70068ac1aa3.png
   https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_051511_ab19ff38-a140-442d-b2e7-82e3431bf3b6.png
 Panel B "Travel Modes": 446x308; padding 7px; grid 2 equal columns; gap 7px. Two photo cards: relative; overflow hidden; radius 10px; flex column; justify-content flex-end; padding 14px; isolation isolate. Image: absolute, full, object-fit cover, z-index -2, transition transform 0.9s var(--ease), filter 0.5s; hover/focus-visible → scale(1.05) brightness(1.08). ::after (z-index -1): linear-gradient(to top, rgba(8,11,13,0.88) 0%, rgba(8,11,13,0.35) 38%, rgba(8,11,13,0) 60%). Title 15.5px/500, margin-bottom 5px; description 13px, line-height 1.42, var(--muted).
   Temporary images: Solo → https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_051510_3d88d3aa-ac8a-4e80-b70b-0da5523138cf.png ; Group → https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_051510_400ed870-8ffb-4030-b267-2b003780a5e3.png
 Panel C "Destinations": 232x218; padding 8px; flex column; gap 2px; four rows (.r-link): flex 1; align-items center; padding 0 12px; radius 9px; 15px; hover/focus background var(--hover), transition 0.25s.

DROPDOWN BEHAVIOUR (React refs/effects, same state machine as the vanilla spec)
- Menu order ['discover','modes','destinations']; PAD = 20 (aligns panel text with trigger text: 8px panel padding + 12px row padding).
- place(id): read the panel's offsetWidth/offsetHeight; x = triggerRect.left − PAD, clamped between headerRect.left + 12 and headerRect.right − panelWidth − 12, then minus (dd.offsetParent || header).getBoundingClientRect().left. Set --x, --w, --h in px on .dd.
- open(id): clear closeTimer; if already open, return.
   FIRST OPEN: add .instant and .snap to .dd; add .snap to every panel and remove its data-state; place(id); force reflow (void dd.offsetWidth); remove .snap from .dd and panels; add .open; on next requestAnimationFrame remove .instant. Panel appears in place, scaling 0.97→1, fading in, un-blurring from 8px; position/size do not animate.
   SWITCH: dir = +1 if new index > current else −1. Old panel data-state = dir>0 ? 'exit-left' : 'exit-right'. New panel: add .snap, data-state = dir>0 ? 'exit-right' : 'exit-left', force reflow, remove .snap, then place(id); container morphs over 0.5s.
   Then new panel data-state='active'; aria-expanded="true" on its trigger only; current = id.
- close(): remove .open; remove data-state from current panel; all aria-expanded="false"; current = null.
- scheduleClose(ms = 140): debounced setTimeout(close).
- Events: trigger pointerenter (mouse only) → open; trigger click → toggle (touch/keyboard); plain link pointerenter (mouse) → scheduleClose(60); nav pointerenter → clearTimeout; nav pointerleave (mouse) → scheduleClose(); nav focusout with focus leaving nav → scheduleClose(0); Escape → close, return focus to the open trigger, also close mobile sheet; document pointerdown outside nav → close; window resize → place(current) if open; .d-item pointerenter/focus → set that row and image .is-active.
- Clean up all listeners/timers on unmount. Close the dropdown on route change.

MOBILE (<= 860px)
- .bar → grid-template-columns 1fr auto; .desktop-nav display none; menu button visible, placed after the CTA: 36x32px, radius 999px, background rgba(255,255,255,0.12), backdrop-filter blur(10px); 16px SVG, path "M2 5.5h12M2 10.5h12", stroke #fff, width 1.5, round caps; aria-label "Open menu", aria-expanded toggles.
- Sheet inside the header after .bar: absolute; top 68px; left 12px; right 12px; padding 10px; radius 16px; background var(--panel); border 1px solid var(--line); backdrop-filter blur(22px) saturate(140%); max-height calc(100svh − 90px); overflow auto. Closed: opacity 0; visibility hidden; transform translateY(−6px) scale(0.98); origin 50% 0. Open: opacity 1; visible; transform none. Transitions: opacity 0.3s ease, transform 0.45s var(--ease); visibility delayed 0.45s on close.
- Group headings <h3>: 12px/500, letter-spacing 0.06em, uppercase, var(--muted), margin 10px 12px 6px. Links: block; padding 10px 12px; radius 9px; 15px; hover var(--hover). Clicking any link closes the sheet.
- Groups: DISCOVER (the 4 items) / TRAVEL MODES (Solo Mode, Group Mode) / DESTINATIONS (Varanasi, Jaipur, Hampi, All destinations) / WANDERLENS (Our story, plus existing sign-in/profile and any role-gated links with their current visibility rules).
- At >= 861px the sheet is display none.

ACCESSIBILITY & REDUCED MOTION
- Scroll cue aria-hidden; Discover preview images alt="". Keep all existing aria labels/roles in restyled components. Keyboard: triggers reachable and operable; Escape closes.
- @media (prefers-reduced-motion: reduce): --morph 0.01s; all animations 0.01s with no delay; no blur filters on .panel or .d-media img.

=====================================================================
PHASE 4 — EXTEND THE SYSTEM TO THE REST OF THE APP
=====================================================================
After the header and landing page are done and verified, restyle the remaining pages one at a time (mode-select, scan, groups + live map, sos, communities/feed, hidden gems, profile, moderator/admin) using only the tokens above: --ink backgrounds, --panel for floating surfaces, --line for 1px borders, --hover for interactive rows, Geist 400/500, radii 9–16px, the same --ease timing. Rules:
- Component by component, change classes/markup only. Do not touch logic.
- Leaflet: keep dynamic import/SSR handling, container heights, and invalidateSize behaviour. Restyle only the surrounding chrome, popups, and marker visuals. Use a dark basemap consistent with --ink.
- SOS screens: keep the countdown-confirmation interaction and use --danger for the trigger, radar, and alerts. Make it the highest-contrast element on screen.
- Group alert buttons (need_help / regroup / custom) keep their current meaning and prominence; style need_help with --danger.
- Do not add new features, pages, or animations beyond what is specified.

=====================================================================
VERIFICATION (run after each phase; stop and fix before moving on)
=====================================================================
1. npm run build and the type-check/lint pass with no new errors. Existing tests (e.g. ranking.test.ts) still pass unchanged.
2. No file under src/app/api, src/lib, supabase/, recognition-service/ or middleware.ts has a diff. Confirm with git diff --stat.
3. Manual checks on desktop and a ≤860px viewport: dropdown first open, switching between all three panels in both directions, Escape, outside click, keyboard focus, mobile sheet, auth-state variants of the header, protected-route redirects.
4. Scan, group map, SOS countdown, and chat each still work end to end.

FINAL REPORT
List: files changed, any nav item that had no matching route and what it links to instead, any place where a visual goal conflicted with existing logic (left untouched), and anything I should swap manually (placeholder images, logo).