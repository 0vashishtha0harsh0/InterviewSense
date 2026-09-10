import json
import os
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

SEED_PATH = os.path.join(os.path.dirname(__file__), "../../../data/questions/seed.json")

async def ensure_seed():
    from ..database import get_database
    db = get_database()
    # Ensure indexes
    try:
        await db.questions.create_index([("interview_type", 1)])
        await db.questions.create_index([("domain", 1)])
        await db.questions.create_index([("difficulty", 1)])
        await db.interview_sessions.create_index([("user_id", 1)])
        await db.answers.create_index([("session_id", 1)])
        await db.users.create_index("email", unique=True)
    except Exception as e:
        logger.warning(f"Index ensure warning: {e}")

    count = await db.questions.count_documents({})
    if count >= 50:
        logger.info(f"Questions already seeded ({count} docs), skipping")
        return {"seeded": False, "count": count}

    # Load seed file
    seed_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..", "data/questions/seed.json"))
    # Fallback to known path
    if not os.path.exists(seed_file):
        seed_file = os.path.join(os.path.dirname(__file__), "../../data/questions/seed.json")
    if not os.path.exists(seed_file):
        seed_file = "E:/InterviewSense/data/questions/seed.json"
    try:
        with open(seed_file, "r", encoding="utf-8") as f:
            seed = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load seed file {seed_file}: {e}")
        return {"seeded": False, "error": str(e)}

    # Add timestamps
    now = datetime.now(timezone.utc).isoformat()
    for doc in seed:
        doc["created_at"] = now
        doc["updated_at"] = now

    if count > 0:
        # Remove incomplete seed to replace with full 50
        await db.questions.delete_many({})
        logger.info(f"Cleared {count} existing questions for reseed")

    result = await db.questions.insert_many(seed)
    logger.info(f"Seeded {len(result.inserted_ids)} questions")
    return {"seeded": True, "count": len(result.inserted_ids)}
