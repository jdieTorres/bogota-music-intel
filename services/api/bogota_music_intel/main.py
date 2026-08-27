from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bogota_music_intel.config import settings

app = FastAPI(title="Bogota Music Intel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}
