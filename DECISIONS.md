# WanderLens Architectural Decisions & Assumptions

### 1. Recognition Microservice & Graceful Fallback
- **CLIP Model**: `openai/clip-vit-base-patch32` (generates 512-dimensional vector embeddings, matching `EMBEDDING_DIM = 512` in `src/config/constants.ts` and `vector(512)` in `001_schema.sql`).
- **Resilience / Fallback in `POST /api/scan`**: If the Python FastAPI microservice is offline or unreachable during development/demo, Next.js route handler provides a graceful fallback mode: it checks coordinates/filename or provides candidate matching against seeded monuments so the Next.js UI remains testable without requiring heavy PyTorch downloads on every developer laptop.
- **GPS Prior Boost**: Monuments located within 5,000m (5 km) of provided GPS coordinates receive a `+0.05` cosine similarity score boost (configurable in `src/config/constants.ts`).

### 2. EXIF Data & Privacy
- Image uploads to `/api/scan` strip EXIF metadata (or disregard it in server processing) in accordance with Section 6 & 9 of the PRD.
- Scan history records in `scans` table are strictly scoped to the authenticated user via RLS.

### 3. Historical Image Licensing & Attribution
- All displayed historical images must feature license type, author credit, and source link. If not available, a clean "No historical image available" state is rendered rather than synthetic/hallucinated images.

