from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from ..database import get_database
from ..schemas.auth import RegisterRequest, LoginRequest
from ..utils.security import hash_password, verify_password, create_access_token
from ..utils.deps import get_current_user, get_current_admin

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    db = get_database()
    # Check duplicate email (case-insensitive)
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    # First user becomes admin? For MVP, allow explicit admin creation via email check — but spec says role candidate/admin.
    # Default candidate; if email is admin@interviewsense.com or contains admin, could be admin — keep simple: first user admin for demo
    count = await db.users.count_documents({})
    role = "admin" if count == 0 else "candidate"
    # Also allow if email explicitly is admin@example.com to be admin for testing
    if payload.email.lower() in ["admin@interviewsense.com", "admin@example.com"]:
        role = "admin"

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "role": role,
        "profile": {},
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    token = create_access_token({"sub": user_id, "email": doc["email"], "role": role})
    user = {"_id": user_id, "name": doc["name"], "email": doc["email"], "role": role, "created_at": now}
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login")
async def login(payload: LoginRequest):
    db = get_database()
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "email": user["email"], "role": user["role"]})
    safe_user = {"_id": user_id, "name": user["name"], "email": user["email"], "role": user["role"], "created_at": user.get("created_at")}
    return {"access_token": token, "token_type": "bearer", "user": safe_user}

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "_id": current_user["_id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "created_at": current_user.get("created_at"),
    }

@router.get("/check-admin")
async def check_admin(admin: dict = Depends(get_current_admin)):
    return {"ok": True, "admin": admin["email"], "role": admin["role"]}

# Optional helper to ensure index
async def ensure_user_indexes():
    db = get_database()
    try:
        await db.users.create_index("email", unique=True)
    except Exception:
        pass
