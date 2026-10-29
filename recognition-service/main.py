import os
import io
import math
import logging
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import numpy as np
import torch
from transformers import CLIPProcessor, CLIPModel
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("wanderlens-recognition")

# Constants
MODEL_ID = "openai/clip-vit-base-patch32"
EMBEDDING_DIM = 512
DEFAULT_CONFIDENCE_THRESHOLD = 0.75
GPS_BOOST_RADIUS_METRES = 5000.0
GPS_BOOST_SCORE = 0.05

# Global runtime state
class AppState:
    model: Optional[CLIPModel] = None
    processor: Optional[CLIPProcessor] = None
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
    supabase: Optional[Client] = None

state = AppState()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load CLIP model and Supabase client
    logger.info("Initializing CLIP Model (%s) on %s...", MODEL_ID, state.device)
    try:
        state.model = CLIPModel.from_pretrained(MODEL_ID).to(state.device)
        state.model.eval()
        state.processor = CLIPProcessor.from_pretrained(MODEL_ID)
        logger.info("CLIP model and processor loaded successfully.")
    except Exception as e:
        logger.error("Failed to load CLIP model: %s", e)

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if supabase_url and supabase_key:
        try:
            state.supabase = create_client(supabase_url, supabase_key)
            logger.info("Supabase client initialized.")
        except Exception as e:
            logger.warning("Supabase client initialization failed: %s", e)
    else:
        logger.warning("SUPABASE_URL or SUPABASE_SERVICE_KEY missing. Database features will operate in fallback mode.")

    yield

    # Teardown
    logger.info("Shutting down recognition service...")

app = FastAPI(
    title="WanderLens Monument Recognition Service",
    version="1.0.0",
    description="Microservice providing CLIP embedding generation and nearest-neighbour search for heritage monuments.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Response Schemas ───────────────────────────────────────────
class MatchCandidate(BaseModel):
    monument_id: str
    name: str
    confidence: float
    distance_metres: Optional[float] = None
    gps_boost_applied: bool = False

class RecognitionResponse(BaseModel):
    status: str  # "match" | "candidates" | "no_match"
    confidence_threshold: float
    best_match: Optional[MatchCandidate] = None
    candidates: List[MatchCandidate] = []
    monument_id: Optional[str] = None
    confidence: Optional[float] = None

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in metres between two GPS coordinates."""
    r = 6371000.0  # Earth radius in metres
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c

def extract_features(image: Image.Image) -> List[float]:
    """Generate normalized 512-dim CLIP embedding."""
    if state.model is None or state.processor is None:
        raise RuntimeError("CLIP model is not loaded.")

    inputs = state.processor(images=image, return_tensors="pt").to(state.device)
    with torch.no_grad():
        features = state.model.get_image_features(**inputs)
        # L2 Normalization
        features = features / features.norm(p=2, dim=-1, keepdim=True)
        embedding = features.squeeze(0).cpu().numpy().tolist()
    return embedding

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": state.model is not None,
        "device": state.device,
        "supabase_connected": state.supabase is not None,
    }

@app.post("/embed")
async def generate_embedding(image: UploadFile = File(...)):
    """Utility endpoint to generate vector embedding from an uploaded image."""
    try:
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        embedding = extract_features(pil_image)
        return {"embedding": embedding, "dimensions": len(embedding)}
    except Exception as e:
        logger.error("Embedding generation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recognize", response_model=RecognitionResponse)
async def recognize_monument(
    image: UploadFile = File(...),
    latitude: Optional[float] = Query(None, description="Optional latitude for GPS prior boost"),
    longitude: Optional[float] = Query(None, description="Optional longitude for GPS prior boost"),
    threshold: float = Query(DEFAULT_CONFIDENCE_THRESHOLD, ge=0.0, le=1.0),
):
    """
    Identifies a monument from an uploaded image.
    Uses CLIP embedding cosine similarity against reference monument photos with optional GPS boost.
    """
    try:
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid image file: {e}")

    try:
        query_embedding = extract_features(pil_image)
    except Exception as e:
        logger.error("Error computing embedding: %s", e)
        raise HTTPException(status_code=500, detail=f"CLIP embedding failed: {e}")

    # Fallback if Supabase is not configured
    if not state.supabase:
        logger.info("Running in offline mock mode without Supabase connection.")
        return RecognitionResponse(
            status="no_match",
            confidence_threshold=threshold,
            best_match=None,
            candidates=[],
            monument_id=None,
            confidence=None,
        )

    try:
        # 1. Attempt to call stored procedure match_monument_images via RPC
        # Querying reference images with embeddings
        rpc_result = state.supabase.rpc(
            "match_monument_images",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.4,
                "match_count": 25,
            }
        ).execute()

        raw_matches = rpc_result.data or []
    except Exception as rpc_err:
        logger.warning("RPC match_monument_images not available or failed (%s). Falling back to direct query.", rpc_err)
        # Fallback: Query monument_images directly
        try:
            res = state.supabase.table("monument_images") \
                .select("id, monument_id, embedding, monuments(id, name, location, is_published)") \
                .eq("kind", "reference") \
                .not_.is_("embedding", "null") \
                .execute()

            raw_matches = []
            q_vec = np.array(query_embedding, dtype=np.float32)

            for row in res.data or []:
                m = row.get("monuments")
                if not m or not m.get("is_published"):
                    continue
                emb = row.get("embedding")
                if not emb:
                    continue
                r_vec = np.array(emb, dtype=np.float32)
                # Cosine similarity
                sim = float(np.dot(q_vec, r_vec) / (np.linalg.norm(q_vec) * np.linalg.norm(r_vec) + 1e-9))
                raw_matches.append({
                    "monument_id": row["monument_id"],
                    "monument_name": m["name"],
                    "monument_location": m.get("location"),
                    "similarity": sim,
                })
        except Exception as query_err:
            logger.error("Direct fallback query failed: %s", query_err)
            raw_matches = []

    # Aggregate similarity per monument (take max similarity among reference images for that monument)
    monument_scores: Dict[str, Dict[str, Any]] = {}
    for item in raw_matches:
        m_id = item["monument_id"]
        m_name = item.get("monument_name") or item.get("name", "Unknown Monument")
        sim = float(item.get("similarity", 0.0))

        if m_id not in monument_scores or sim > monument_scores[m_id]["similarity"]:
            monument_scores[m_id] = {
                "monument_id": m_id,
                "name": m_name,
                "similarity": sim,
                "location": item.get("monument_location") or item.get("location"),
            }

    # Apply GPS prior boost if coordinates provided
    candidate_list: List[MatchCandidate] = []
    for m_id, data in monument_scores.items():
        score = data["similarity"]
        applied_boost = False
        dist_m = None

        if latitude is not None and longitude is not None and data.get("location"):
            # If location is GeoJSON or WKT string, parse if possible
            loc = data["location"]
            m_lat, m_lng = None, None
            if isinstance(loc, dict) and "coordinates" in loc:
                m_lng, m_lat = loc["coordinates"][0], loc["coordinates"][1]
            elif isinstance(loc, str) and "POINT" in loc:
                try:
                    coords = loc.replace("POINT(", "").replace(")", "").strip().split()
                    m_lng, m_lat = float(coords[0]), float(coords[1])
                except Exception:
                    pass

            if m_lat is not None and m_lng is not None:
                dist_m = haversine_distance(latitude, longitude, m_lat, m_lng)
                if dist_m <= GPS_BOOST_RADIUS_METRES:
                    score = min(1.0, score + GPS_BOOST_SCORE)
                    applied_boost = True

        candidate_list.append(MatchCandidate(
            monument_id=m_id,
            name=data["name"],
            confidence=round(score, 4),
            distance_metres=round(dist_m, 1) if dist_m is not None else None,
            gps_boost_applied=applied_boost,
        ))

    # Sort descending by confidence
    candidate_list.sort(key=lambda c: c.confidence, reverse=True)

    if not candidate_list:
        return RecognitionResponse(
            status="no_match",
            confidence_threshold=threshold,
            best_match=None,
            candidates=[],
            monument_id=None,
            confidence=None,
        )

    best = candidate_list[0]
    top_candidates = candidate_list[:3]

    if best.confidence >= threshold:
        return RecognitionResponse(
            status="match",
            confidence_threshold=threshold,
            best_match=best,
            candidates=top_candidates,
            monument_id=best.monument_id,
            confidence=best.confidence,
        )
    else:
        return RecognitionResponse(
            status="candidates",
            confidence_threshold=threshold,
            best_match=best,
            candidates=top_candidates,
            monument_id=None,
            confidence=best.confidence,
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

