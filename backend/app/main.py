from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .config import settings
from .database import connect_to_mongo, close_mongo_connection, ping_db, get_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await connect_to_mongo()
        logger.info("MongoDB connected on startup")
        # Ensure indexes
        db = get_database()
        try:
            await db.users.create_index("email", unique=True)
            logger.info("User email index ensured")
        except Exception as ie:
            logger.warning(f"Index creation warning: {ie}")
    except Exception as e:
        logger.warning(f"MongoDB not available on startup: {e} - API will still run, DB ops will fail until DB is up")
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="InterviewSense API",
    description="AI-Based Mock Interview and Performance Analyzer",
    version="0.2.0 - M2 Auth",
    lifespan=lifespan,
)

# CORS
origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    db_ok = await ping_db()
    return {
        "status": "ok",
        "service": "InterviewSense API",
        "version": "0.2.0-M2",
        "database": "connected" if db_ok else "disconnected",
        "mongodb_url": settings.mongodb_url,
        "db_name": settings.mongodb_db_name,
        "whisper_model": settings.whisper_model,
    }


@app.get("/")
async def root():
    return {"message": "InterviewSense API is running", "docs": "/docs", "health": "/api/health"}


from .routes import auth as auth_routes
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
