#!/usr/bin/env python3
"""
WanderLens — Monument Reference Image Indexer
Computes CLIP image embeddings (openai/clip-vit-base-patch32, 512 dimensions)
and stores them in Supabase monument_images table via pgvector.
"""

import os
import io
import argparse
import logging
from typing import Optional, List
import requests
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("index_monuments")

MODEL_ID = "openai/clip-vit-base-patch32"

def main():
    parser = argparse.ArgumentParser(description="Index monument reference images with CLIP embeddings.")
    parser.add_argument("--supabase-url", default=os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL"))
    parser.add_argument("--supabase-key", default=os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
    parser.add_argument("--dry-run", action="store_true", help="Log actions without modifying database.")
    parser.add_argument("--force", action="store_true", help="Re-index images that already have embeddings.")
    parser.add_argument("--seed-synthetic", action="store_true", help="Generate unique synthetic normalized embeddings for testing.")
    args = parser.parse_args()

    if not args.supabase_url or not args.supabase_key:
        logger.error("Missing Supabase credentials. Provide --supabase-url and --supabase-key or set in .env")
        return

    from supabase import create_client
    supabase = create_client(args.supabase_url, args.supabase_key)

    query = supabase.table("monument_images").select("id, monument_id, storage_path, source_url, kind, embedding")
    if not args.force and not args.seed_synthetic:
        query = query.is_("embedding", "null")

    result = query.execute()
    rows = result.data or []
    logger.info("Found %d monument images to process.", len(rows))

    if not rows and not args.seed_synthetic:
        logger.info("No images requiring embedding indexing.")
        return

    # If synthetic seeding requested (useful for immediate local testing without loading PyTorch weights)
    if args.seed_synthetic:
        import numpy as np
        logger.info("Generating synthetic embeddings for reference images...")
        for row in rows:
            # Deterministic pseudo-random embedding based on monument_id hash
            seed_val = abs(hash(row["monument_id"])) % (2**32)
            np.random.seed(seed_val)
            vec = np.random.randn(512).astype(np.float32)
            vec = (vec / np.linalg.norm(vec)).tolist()

            if args.dry_run:
                logger.info("[Dry Run] Would update image %s (monument %s) with 512-dim vector", row["id"], row["monument_id"])
            else:
                supabase.table("monument_images").update({"embedding": vec}).eq("id", row["id"]).execute()
                logger.info("Indexed synthetic vector for image %s", row["id"])
        return

    # Real CLIP indexing
    logger.info("Loading CLIP model (%s)...", MODEL_ID)
    import torch
    from transformers import CLIPProcessor, CLIPModel

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = CLIPModel.from_pretrained(MODEL_ID).to(device)
    model.eval()
    processor = CLIPProcessor.from_pretrained(MODEL_ID)

    for row in rows:
        img_id = row["id"]
        storage_path = row.get("storage_path")
        source_url = row.get("source_url")
        image_bytes: Optional[bytes] = None

        logger.info("Processing image %s (path: %s)...", img_id, storage_path)

        # 1. Try download from Supabase storage bucket 'monuments'
        if storage_path:
            try:
                res = supabase.storage.from_("monuments").download(storage_path)
                image_bytes = res
            except Exception as e:
                logger.warning("Could not download %s from storage: %s", storage_path, e)

        # 2. Try download from source_url if storage download failed
        if not image_bytes and source_url and source_url.startswith("http"):
            try:
                resp = requests.get(source_url, timeout=10, headers={"User-Agent": "WanderLens/1.0"})
                if resp.status_code == 200:
                    image_bytes = resp.content
            except Exception as e:
                logger.warning("Could not download from source URL %s: %s", source_url, e)

        if not image_bytes:
            logger.warning("Skipping image %s: image data unavailable.", img_id)
            continue

        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            inputs = processor(images=pil_img, return_tensors="pt").to(device)
            with torch.no_grad():
                feat = model.get_image_features(**inputs)
                feat = feat / feat.norm(p=2, dim=-1, keepdim=True)
                emb = feat.squeeze(0).cpu().numpy().tolist()

            if args.dry_run:
                logger.info("[Dry Run] Would update image %s with CLIP embedding vector.", img_id)
            else:
                supabase.table("monument_images").update({"embedding": emb}).eq("id", img_id).execute()
                logger.info("Successfully updated image %s with embedding vector.", img_id)
        except Exception as e:
            logger.error("Failed processing image %s: %s", img_id, e)

    logger.info("Indexing complete.")

if __name__ == "__main__":
    main()

