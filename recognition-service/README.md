# WanderLens Monument Recognition Service

FastAPI microservice utilizing OpenAI CLIP (`openai/clip-vit-base-patch32`) to compute 512-dimensional visual embeddings for monument scan photos, queried against `monument_images` reference embeddings via pgvector.

## Setup & Run

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   Copy `.env.example` to `.env` and fill in `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

4. **Run the microservice**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. **Health check**:
   ```bash
   curl http://localhost:8000/health
   ```

