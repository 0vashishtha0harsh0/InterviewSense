from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional
import logging

from ..database import get_database
from ..utils.deps import get_current_user
from ..schemas.interview import InterviewCreate
from ..services.interview.question_selector import select_questions, adaptive_next_difficulty
from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

def serialize_session(doc):
    doc["_id"] = str(doc["_id"])
    doc["user_id"] = str(doc["user_id"]) if "user_id" in doc else doc.get("user_id")
    # Ensure questions _id strings already handled
    return doc

@router.post("", status_code=201)
async def create_interview(payload: InterviewCreate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    # Use question_count from payload or settings default
    qc = payload.question_count or settings.question_count
    # Select questions
    selected = await select_questions(
        db,
        interview_type=payload.interview_type,
        domain=payload.domain,
        role=payload.role,
        difficulty=payload.difficulty,
        question_count=qc
    )
    if len(selected) < qc:
        raise HTTPException(400, f"Insufficient questions: requested {qc}, found {len(selected)}. Try different filters or add questions.")
    now = datetime.now(timezone.utc).isoformat()
    session = {
        "user_id": ObjectId(current_user["_id"]),
        "interview_type": payload.interview_type,
        "domain": payload.domain,
        "role": payload.role,
        "difficulty": payload.difficulty,
        "question_count": qc,
        "questions": selected,  # store snapshot
        "current_question": 0,
        "status": "started",  # CREATED->STARTED per §16
        "started_at": now,
        "created_at": now,
        "updated_at": now,
        "overall_score": None,
        "content_score": None,
        "delivery_score": None,
        "completed_at": None,
        "answers": []  # embedded answer refs or ids
    }
    result = await db.interview_sessions.insert_one(session)
    session["_id"] = str(result.inserted_id)
    session["user_id"] = str(session["user_id"])
    return session

@router.get("")
async def list_interviews(current_user: dict = Depends(get_current_user)):
    db = get_database()
    # Candidate sees own, admin sees all? For MVP, candidate sees own only
    query = {"user_id": ObjectId(current_user["_id"])}
    if current_user["role"] == "admin":
        # Admin can see all, but for history we still scope? Keep all for admin
        cursor = db.interview_sessions.find({}).sort("created_at", -1)
    else:
        cursor = db.interview_sessions.find(query).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    for d in docs:
        d["_id"] = str(d["_id"])
        d["user_id"] = str(d["user_id"])
        # Hide full questions for list view? Keep summary
    return docs

@router.get("/{sid}")
async def get_interview(sid: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        doc = await db.interview_sessions.find_one({"_id": ObjectId(sid)})
    except:
        raise HTTPException(400, "Invalid session id")
    if not doc:
        raise HTTPException(404, "Interview not found")
    # Authz: owner or admin
    if str(doc["user_id"]) != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(403, "Not authorized for this interview")
    # Also fetch answers
    answers = await db.answers.find({"session_id": ObjectId(sid)}).sort("created_at", 1).to_list(length=50)
    for a in answers:
        a["_id"] = str(a["_id"])
        a["session_id"] = str(a["session_id"])
        a["question_id"] = str(a["question_id"])
    doc["_id"] = str(doc["_id"])
    doc["user_id"] = str(doc["user_id"])
    doc["answers"] = answers
    return doc

@router.post("/{sid}/submit-answer")
async def submit_answer(
    sid: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Placeholder for M4: currently acknowledges submit and advances current_question
    without AI evaluation. Stores empty answer and moves to next question.
    Real Whisper/NLP/CV will be integrated in M4-M7 but hidden scoring kept.
    """
    db = get_database()
    try:
        oid = ObjectId(sid)
    except:
        raise HTTPException(400, "Invalid session id")
    session = await db.interview_sessions.find_one({"_id": oid})
    if not session:
        raise HTTPException(404, "Interview not found")
    if str(session["user_id"]) != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(403, "Not authorized")
    if session["status"] == "completed":
        raise HTTPException(400, "Interview already completed")
    cur = session.get("current_question", 0)
    qc = session.get("question_count", len(session.get("questions", [])))
    if cur >= qc:
        raise HTTPException(400, "All questions already answered")

    # Get current question
    questions = session.get("questions", [])
    if cur >= len(questions):
        raise HTTPException(400, "No current question")
    q = questions[cur]
    qid = q["_id"] if isinstance(q["_id"], str) else str(q["_id"])

    # For M3, create a placeholder answer (no AI yet)
    now = datetime.now(timezone.utc).isoformat()
    # Simulate hidden scoring for adaptive (rule-based): random-ish but deterministic for demo
    # In M7 this will be replaced by real NLP/CV scores, but adaptive logic remains hidden
    import random
    placeholder_overall = random.randint(65, 88)  # TEMPORARY MOCK — will be replaced by real scoring in M7
    answer_doc = {
        "session_id": oid,
        "question_id": ObjectId(qid) if len(qid)==24 else qid,
        "transcript": None,  # M4 will fill
        "duration": None,
        "audio_metadata": None,
        "cv_metrics": None,
        "nlp_metrics": None,
        "content_score": None,
        "delivery_score": None,
        "overall_score": placeholder_overall,  # stored internally, hidden from frontend during interview per §1A
        "feedback": None,
        "created_at": now,
        # Mark as mock for later replacement
        "is_mock": True
    }
    await db.answers.insert_one(answer_doc)

    # Adaptive next difficulty (hidden)
    next_diff = adaptive_next_difficulty(placeholder_overall, session.get("difficulty", "medium"))
    # For M3, we do NOT actually swap next question yet (would require selecting new question mid-interview)
    # Just advance pointer; adaptive selection will be fully implemented in M4-M7

    # Advance
    next_idx = cur + 1
    update = {
        "current_question": next_idx,
        "updated_at": now,
        "difficulty": next_diff if next_idx < qc else session.get("difficulty")
    }
    is_completed = next_idx >= qc
    if is_completed:
        update["status"] = "completed"
        update["completed_at"] = now
        # For M3, overall_score is average of placeholder mocks
        answers = await db.answers.find({"session_id": oid}).to_list(length=50)
        scores = [a.get("overall_score", 0) for a in answers if a.get("overall_score") is not None]
        # Include the just inserted one (not yet in fetch? we inserted, so fetch again)
        # Already fetched, but to be safe recompute after insert
        # The just inserted answer already counted if we fetched before; re-fetch
        answers = await db.answers.find({"session_id": oid}).to_list(length=50)
        scores = [a.get("overall_score") for a in answers if a.get("overall_score") is not None]
        if scores:
            update["overall_score"] = round(sum(scores)/len(scores), 1)

    await db.interview_sessions.update_one({"_id": oid}, {"$set": update})

    # Return neutral processing state per §1A — NO scores exposed
    # Frontend should only see: submitted, next question or completed
    if is_completed:
        return {
            "status": "completed",
            "message": "Interview completed. Generating final dashboard...",
            "session_id": sid,
            "completed": True,
            "next_question": None
        }
    else:
        next_q = questions[next_idx] if next_idx < len(questions) else None
        return {
            "status": "processing",
            "message": "Answer submitted. Analyzing response...",
            "session_id": sid,
            "completed": False,
            "current_question": next_idx,
            "next_question": next_q,
            "progress": f"{next_idx}/{qc}"
        }

@router.post("/{sid}/complete")
async def complete_interview(sid: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        oid = ObjectId(sid)
    except:
        raise HTTPException(400, "Invalid session id")
    session = await db.interview_sessions.find_one({"_id": oid})
    if not session:
        raise HTTPException(404, "Not found")
    if str(session["user_id"]) != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(403, "Not authorized")
    now = datetime.now(timezone.utc).isoformat()
    await db.interview_sessions.update_one({"_id": oid}, {"$set": {"status": "completed", "completed_at": now, "updated_at": now}})
    doc = await db.interview_sessions.find_one({"_id": oid})
    answers = await db.answers.find({"session_id": oid}).to_list(length=50)
    for a in answers:
        a["_id"] = str(a["_id"])
        a["session_id"] = str(a["session_id"])
        a["question_id"] = str(a["question_id"])
    doc["_id"] = str(doc["_id"])
    doc["user_id"] = str(doc["user_id"])
    # Aggregate scores if not yet
    if not doc.get("overall_score") and answers:
        scores = [a.get("overall_score") for a in answers if a.get("overall_score") is not None]
        if scores:
            doc["overall_score"] = round(sum(scores)/len(scores), 1)
    doc["answers"] = answers
    return doc
