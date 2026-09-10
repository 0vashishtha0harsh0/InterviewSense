from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone

from ..database import get_database
from ..utils.deps import get_current_user, get_current_admin
from ..schemas.questions import QuestionCreate, QuestionUpdate

router = APIRouter()

def serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("")
async def list_questions(
    interview_type: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    query = {}
    if interview_type: query["interview_type"] = interview_type
    if domain: query["domain"] = domain
    if difficulty: query["difficulty"] = difficulty
    if search:
        query["question_text"] = {"$regex": search, "$options": "i"}
    cursor = db.questions.find(query).sort("created_at", -1)
    docs = await cursor.to_list(length=200)
    return [serialize(d) for d in docs]

@router.get("/{qid}")
async def get_question(qid: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        doc = await db.questions.find_one({"_id": ObjectId(qid)})
    except:
        raise HTTPException(404, "Invalid question id")
    if not doc:
        raise HTTPException(404, "Question not found")
    return serialize(doc)

@router.post("", status_code=201)
async def create_question(payload: QuestionCreate, admin: dict = Depends(get_current_admin)):
    db = get_database()
    now = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc["created_at"] = now
    doc["updated_at"] = now
    result = await db.questions.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@router.put("/{qid}")
async def update_question(qid: str, payload: QuestionUpdate, admin: dict = Depends(get_current_admin)):
    db = get_database()
    try:
        oid = ObjectId(qid)
    except:
        raise HTTPException(400, "Invalid id")
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(400, "No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.questions.update_one({"_id": oid}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(404, "Question not found")
    doc = await db.questions.find_one({"_id": oid})
    return serialize(doc)

@router.delete("/{qid}")
async def delete_question(qid: str, admin: dict = Depends(get_current_admin)):
    db = get_database()
    try:
        oid = ObjectId(qid)
    except:
        raise HTTPException(400, "Invalid id")
    result = await db.questions.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Question not found")
    return {"ok": True, "deleted_id": qid}
