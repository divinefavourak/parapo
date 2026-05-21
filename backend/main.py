"""PARAPO FastAPI Application.

A production-ready backend for the PARAPO student leadership productivity app.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import create_tables

# ── Import all models so Base.metadata is fully populated ────────────────────
import models  # noqa: F401 — side-effect: registers all ORM models

# ── Import routers ────────────────────────────────────────────────────────────
from routers import auth, users, tasks, academic, leadership, focus, ai, notes, analytics, notifications

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("parapo")


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan: create DB tables on startup."""
    logger.info("Starting PARAPO API — creating database tables if needed...")
    create_tables()
    logger.info("Database ready.")
    yield
    logger.info("PARAPO API shutting down.")


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="PARAPO API",
    description=(
        "Backend API for PARAPO — the student leadership productivity platform. "
        "Provides auth, task management (kanban), academic tracking, leadership tools, "
        "focus sessions, AI assistant, notes, analytics, and push notifications."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(academic.router)
app.include_router(leadership.router)
app.include_router(focus.router)
app.include_router(ai.router)
app.include_router(notes.router)
app.include_router(analytics.router)
app.include_router(notifications.router)


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["health"])
def health_check() -> JSONResponse:
    """Simple liveness probe — returns 200 OK with service status."""
    return JSONResponse({"status": "ok", "service": "parapo-api", "version": "1.0.0"})


@app.get("/", tags=["root"])
def root() -> JSONResponse:
    """Root endpoint — redirects clients to the API docs."""
    return JSONResponse({
        "message": "Welcome to the PARAPO API",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    })


# ── Entry point for direct execution ─────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
