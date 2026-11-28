# Software Requirements Specification (SRS)
## WanderLens — Heritage Discovery, AI Monument Scanner & Traveller Safety Platform

**Version:** 1.0  
**Repository:** `ayyush-for-you/WanderLens`  
**Deployment:** Vercel (`https://wanderlens-ten.vercel.app`)

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the functional, non-functional, architectural, and interface requirements for **WanderLens**, a full-stack Progressive Web Application (PWA) designed for heritage travellers, solo explorers, and travel groups. It serves as a technical reference for developers, evaluators, and viva/academic review.

### 1.2 Scope
WanderLens unifies five core capabilities into a single web platform:
1. **AI Monument Scanner:** Identifies monuments from camera/uploaded photos using Google Gemini Vision (`gemini-3.8-flash`), optional CLIP embedding matching, and GPS proximity priors.
2. **Discover Hidden Gems:** Ranks lesser-known, high-rated places using a transparent Bayesian + activity-penalty algorithm, with AI/OSM discovery for custom ("Other") destinations.
3. **Solo & Group Travel Mode:** Provides live opt-in group location sharing on an interactive Leaflet map, trip creation, and member invitations.
4. **Emergency SOS System:** Enables one-tap/hold SOS alerts to nearby opted-in travellers (within 2 km, coarse 100 m privacy rounding) and group members.
5. **Destination Communities & Moderation:** Real-time destination chatrooms, shareable invite links with a join prompt, user blocking, and moderator/admin reporting workflows.

### 1.3 Definitions & Acronyms
| Term | Definition |
| :--- | :--- |
| **RLS** | Row-Level Security (PostgreSQL access control enforced per user) |
| **PWA** | Progressive Web App (installable web app with `manifest.json`) |
| **SRS** | Software Requirements Specification |
| **SOS** | Emergency distress signal broadcast to group/nearby travellers |
| **PostGIS** | PostgreSQL spatial extension used for geographic `POINT(lng lat)` queries |
| **SSR** | Server-Side Rendering (Next.js App Router) |

### 1.4 References
- `PRD.md` — Product Requirements Document
- `DESIGN_SPEC.md` — UI/UX Design Tokens & Visual Specification
- `DECISIONS.md` — Architectural & Engineering Decisions

---

## 2. Overall Description

### 2.1 Product Perspective
WanderLens is built as a monolithic full-stack **Next.js 16 (App Router)** application backed by **Supabase** (PostgreSQL + PostGIS + Auth + Realtime), deployed on **Vercel**, and augmented by **Google Gemini Vision/Text APIs** and **OpenStreetMap / Leaflet** services.

### 2.2 User Classes & Roles
| Role | Capabilities |
| :--- | :--- |
| **Visitor (Unauthenticated)** | View landing page, browse Discover Hidden Gems, view public monument info; redirected to `/login` for protected actions. |
| **Registered Traveller** | Sign up/login, manage profile, use Monument Scanner, create Solo/Group trips, trigger SOS. |
| **Verified Traveller** (`is_verified = true`) | Post reviews/photos, like/comment, join & send messages in Destination Communities. |
| **Group / Community Owner** | Create groups/communities, invite members, generate share links, launch group trips from communities. |
| **Moderator** (`/moderator`) | Review user-submitted reports (`POST /api/reports`), hide/unhide flagged content. |
| **Administrator** (`/admin`) | Full moderation oversight and platform administration. |

### 2.3 Operating Environment
- **Client:** Modern desktop and mobile browsers (Chrome, Edge, Safari, Firefox) with optional PWA installation (`public/manifest.json`), Camera (`getUserMedia`) and Geolocation (`navigator.geolocation`) APIs.
- **Server / Runtime:** Node.js / Vercel Serverless Runtime running Next.js `^16.4.6` and React `19.3.0`.
- **Database:** Supabase Managed PostgreSQL with PostGIS and Realtime WebSockets.

### 2.4 Design & Implementation Constraints
- Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) must never be exposed with `NEXT_PUBLIC_` prefixes.
- Image uploads are constrained to `image/jpeg`, `image/png`, and `image/webp` up to **5 MB** (`MAX_IMAGE_SIZE_BYTES = 5242880`), and up to **4 photos** per post (`MAX_POST_PHOTOS`).
- Post captions are capped at **500 characters** (`MAX_CAPTION_LENGTH`).

---

## 3. System Architecture & External Interfaces

### 3.1 Technology Stack
- **Frontend:** Next.js 16 (`^16.4.6`), React `19.3.0`, TypeScript `^5`, Tailwind CSS `^4`, Framer Motion `^14.11.1`, Lucide React `^1.61.0`, React Hot Toast `^2.6.1`.
- **Maps:** Leaflet `^1.9.4` + React-Leaflet `^5.0.0` with OpenStreetMap / CARTO map tiles.
- **Validation:** Zod `^4.6.7`.
- **Backend & Database:** Next.js API Route Handlers (`src/app/api/**`), `@supabase/ssr` (`^0.12.7`), `@supabase/supabase-js` (`^2.118.0`).
- **AI & Geocoding:** Google Gemini API (`gemini-3.8-flash`), OpenStreetMap Nominatim API, optional local Python FastAPI CLIP service (`RECOGNITION_SERVICE_URL`).

### 3.2 User Interface Routes (`src/app/`)
| Route | Description |
| :--- | :--- |
| `/` | Landing page showcasing features, interactive map preview, and safety overview |
| `/login`, `/signup` | Email/password authentication and registration |
| `/mode-select` | Mode selector (Solo Mode, Group Mode, Discover, Scan) |
| `/scan` | Monument Scanner (camera capture + file upload + AI recognition card) |
| `/discover` | Hidden Gems Explorer (list & interactive map view, category filters, custom destination input) |
| `/solo` | Solo traveller dashboard with quick SOS trigger and safety tools |
| `/groups`, `/groups/new`, `/groups/[id]` | Group trip list, creation (with custom destination option), live map, invites, and SOS |
| `/communities`, `/communities/[id]` | Destination communities directory, invite acceptance screen, and real-time chatroom |
| `/sos` | Dedicated SOS emergency trigger and nearby responder presence map |
| `/profile` | User profile, verification status, and account settings |
| `/moderator`, `/admin` | Moderation queue and admin management dashboards |

### 3.3 Backend API Endpoints (`src/app/api/`)
- **Monument Recognition:** `POST /api/scan`, `GET/POST /api/monuments`, `GET /api/monuments/[id]`
- **Destinations & Hidden Gems:** `GET/POST /api/destinations`, `GET /api/destinations/[id]/recommendations`, `GET /api/places/[id]`
- **Posts & Social:** `GET/POST /api/posts`, `DELETE /api/posts/[id]`, `POST /api/posts/[id]/like`, `GET/POST /api/posts/[id]/comments`
- **Groups & Live Location:** `GET/POST /api/groups`, `GET/PATCH/DELETE /api/groups/[id]`, `POST /api/groups/[id]/invite`, `GET/POST /api/groups/[id]/locations`, `PATCH /api/groups/[id]/sharing`, `GET/POST /api/groups/[id]/alerts`, `POST /api/groups/[id]/respond`
- **SOS Emergency:** `GET/POST /api/sos`, `GET/PATCH /api/sos/[id]`, `POST /api/sos/[id]/respond`, `GET/POST/DELETE /api/sos/presence`
- **Communities & Safety:** `GET/POST /api/communities`, `GET/DELETE /api/communities/[id]`, `POST/DELETE /api/communities/[id]/join`, `GET/POST /api/communities/[id]/messages`, `GET/POST /api/blocks`, `DELETE /api/blocks/[id]`, `GET/POST /api/reports`
- **Maintenance Cron:** `GET/POST /api/cron/purge-locations`

### 3.4 External API Keys & Environment Configuration
| Variable | Visibility | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key (scoped by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Admin key for server-side seeding and cron purging |
| `GEMINI_API_KEY` | Server-only | Google Gemini Vision & Text generation (`gemini-3.8-flash`) |
| `RECOGNITION_SERVICE_URL` | Server-only | Optional FastAPI CLIP monument recognition microservice |

---

## 4. Functional Requirements

### FR-1: Authentication & Profile Management
- **FR-1.1:** Users shall be able to register and log in via Supabase Auth (`/signup`, `/login`).
- **FR-1.2:** Unauthenticated access to protected routes (`/communities/[id]`, `/groups/[id]`, etc.) shall redirect to `/login?redirect=<target_path>`.
- **FR-1.3:** Email verification (`is_verified`) shall be enforced before joining communities or posting messages/reviews.

### FR-2: AI Monument Scanner
- **FR-2.1:** Users shall be able to capture a photo via device camera or upload an image file (`JPEG`, `PNG`, `WEBP`, $\le$ 5 MB).
- **FR-2.2:** The backend (`POST /api/scan`) shall attempt recognition via:
  1. Optional FastAPI visual embedding service (`RECOGNITION_SERVICE_URL`),
  2. Google Gemini Vision (`gemini-3.8-flash`) returning structured JSON (`is_monument`, `name`, `city_or_region`, `country`, `built_year`, `builder`, `style`, `history_text`, `confidence`),
  3. Curated Supabase `monuments` fallback with Haversine GPS proximity boost (`+0.05` within 5,000 m) and filename matching.
- **FR-2.3:** Non-monument images or missing API keys shall return an informative status (`no_match` / `needs_api_key`) rather than fabricated confidence scores.

### FR-3: Discover Hidden Gems & Custom Destinations
- **FR-3.1:** Users shall be able to browse destinations, filter by category (`Heritage`, `Food & Cafes`, `Nature & Parks`, `Viewpoints`, `Bazaars`, `Culture`, `Other`), sort results, and toggle between **List** and **Map** views.
- **FR-3.2:** Users shall be able to select **Other** to create a custom destination (`POST /api/destinations`).
- **FR-3.3:** When a destination has 0 places in the database, `GET /api/destinations/[id]/recommendations` shall automatically discover up to 5 real places using Gemini AI (with OpenStreetMap Nominatim as fallback), persist them into `places` with PostGIS `POINT(lng lat)` coordinates, and update the destination center.
- **FR-3.4:** Map markers in `DiscoverMap` shall auto-size to their text label (`max-width: 190px`, ellipsis overflow) so names remain contained inside the marker pill.

### FR-4: Solo & Group Travel Mode
- **FR-4.1:** Solo travellers (`/solo`) shall have access to a dedicated dashboard with quick SOS activation and navigation.
- **FR-4.2:** Group creators (`/groups/new`) shall be able to select a preset destination or enter a custom destination.
- **FR-4.3:** Group members (`/groups/[id]`) shall be able to toggle live location sharing (`GROUP_LOCATION_UPDATE_INTERVAL_SECONDS = 10`), view teammates on a Leaflet map, invite members by email/name or shareable link (`POST /api/groups/[id]/invite`), and trigger group SOS alerts.

### FR-5: Emergency SOS System
- **FR-5.1:** Users shall be able to trigger an SOS alert from `/sos`, `/solo`, or `/groups/[id]` via a hold/confirm interaction (`SosTriggerModal`).
- **FR-5.2:** Opted-in nearby users within **2,000 m** (`SOS_RADIUS_METRES`) shall receive alerts with coordinates rounded to **100 m** (`SOS_COARSE_PRECISION_METRES`) for privacy.
- **FR-5.3:** Presence records shall expire after **30 minutes** (`PRESENCE_TTL_MINUTES`).

### FR-6: Destination Communities & Invite Flow
- **FR-6.1:** Users shall be able to browse and create destination communities (`/communities`), including custom destinations.
- **FR-6.2:** Community owners and members shall be able to copy/share an invite link (`/communities/[id]`).
- **FR-6.3:** When an authenticated non-member opens a community invite link, the page shall render a **Community Invite** prompt displaying community name, destination, member count, description, and a **Join Community** button (`POST /api/communities/[id]/join`) instead of silently redirecting away.
- **FR-6.4:** Members shall exchange real-time messages via Supabase Realtime subscriptions.

### FR-7: Content Moderation & User Safety
- **FR-7.1:** Users shall be able to block other users (`POST /api/blocks`), immediately hiding their messages in community chat.
- **FR-7.2:** Users shall be able to report messages or posts (`POST /api/reports`) to the moderator queue (`/moderator`).

---

## 5. Non-Functional Requirements

### 5.1 Security & Privacy
- **NFR-1:** All database tables use Supabase PostgreSQL RLS; administrative writes use `SUPABASE_SERVICE_ROLE_KEY` exclusively inside server-side API routes.
- **NFR-2:** Group location history is scheduled for automatic purge **24 hours** after trip end (`GROUP_LOCATION_PURGE_HOURS = 24` via `/api/cron/purge-locations`).
- **NFR-3:** Nearby SOS broadcasts obfuscate exact GPS coordinates to ~100 m precision.

### 5.2 Performance & Rate Limiting
- **NFR-4:** SOS triggers are rate-limited to **3 alerts per rolling hour** (`SOS_RATE_LIMIT_PER_HOUR = 3`).
- **NFR-5:** Community chat messages are rate-limited to **20 messages per minute** (`CHAT_RATE_LIMIT_PER_MINUTE = 20`).
- **NFR-6:** Group location updates are throttled to at least **10 seconds** between updates per member.

### 5.3 Reliability & Graceful Degradation
- **NFR-7:** If `GEMINI_API_KEY` is absent or an AI call fails, Monument Scanner falls back to curated database/GPS matching, and Custom Destination discovery falls back to OpenStreetMap Nominatim.

---

## 6. Algorithmic Specifications

### 6.1 Hidden Gem Ranking Formula (`src/lib/recommendations/ranking.ts`)
To prevent a single 5-star review or an overcrowded tourist trap from dominating recommendations:

1. **Raw 30-Day Activity:**
   $$\text{activity\_raw} = \text{posts}_{30d} + 2 \cdot \text{checkins}_{30d} + 0.2 \cdot \text{likes}_{30d} + 0.5 \cdot \text{comments}_{30d}$$
2. **Percentile Normalization:** $\text{activity\_norm} \in [0, 1]$ across all places in the destination.
3. **Bayesian Confidence Smoothing** (`RANKING_K = 5`):
   $$\text{confidence} = \frac{n_{\text{ratings}}}{n_{\text{ratings}} + 5}$$
4. **Final Score** (`RANKING_W = 0.5`):
   $$\text{score} = \text{confidence} \cdot \text{avg\_rating} - 0.5 \cdot \text{activity\_norm}$$
5. **Hidden Gem Eligibility:** `avg_rating >= 3.8`, `n_ratings >= 3`, and `activity_norm <= 0.5`.

---

## 7. Verification & Testing
- **Unit Tests:** `npm test` runs `node --experimental-strip-types --test src/lib/recommendations/ranking.test.ts` (6 test cases covering empty destinations, Bayesian smoothing, crowd penalty, cold-start seeded places, category filtering, and deterministic tie-breaking).
- **Static Type Checking:** `npx tsc --noEmit` verifies TypeScript types across client and server code.
- **Linting:** `npm run lint` runs ESLint (`eslint-config-next`).
