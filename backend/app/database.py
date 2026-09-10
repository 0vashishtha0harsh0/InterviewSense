from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from .config import settings
import logging

logger = logging.getLogger(__name__)

# Async client for FastAPI
async_client: AsyncIOMotorClient | None = None
db = None

# Sync client for scripts / seed
sync_client: MongoClient | None = None


def get_sync_client() -> MongoClient:
    global sync_client
    if sync_client is None:
        sync_client = MongoClient(settings.mongodb_url, serverSelectionTimeoutMS=5000)
    return sync_client


async def connect_to_mongo():
    global async_client, db
    try:
        async_client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=5000)
        # Verify connection
        await async_client.admin.command("ping")
        db = async_client[settings.mongodb_db_name]
        logger.info(f"Connected to MongoDB: {settings.mongodb_db_name} @ {settings.mongodb_url}")
        # Ensure indexes (called lazily)
        return db
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        raise


async def close_mongo_connection():
    global async_client
    if async_client:
        async_client.close()
        logger.info("MongoDB connection closed")


def get_database():
    """Dependency to get DB. Returns motor database. Lazy ensures connection for TestClient."""
    global db, async_client
    if db is not None:
        return db
    # Fallback for TestClient without lifespan: create sync-ish async client lazily
    if async_client is None:
        async_client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=5000)
    db = async_client[settings.mongodb_db_name]
    return db


async def ping_db() -> bool:
    try:
        client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=2000)
        await client.admin.command("ping")
        client.close()
        return True
    except Exception:
        return False
