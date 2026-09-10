from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from ..utils.deps import get_current_user
from ..database import get_database
from datetime import datetime, timezone
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    data = await file.read()
    if len(data) == 0:
        raise HTTPException(400, "Empty resume file")
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(400, "Resume too large (max 5MB)")
    # Validate type
    fname = file.filename or ""
    if not (fname.lower().endswith((".pdf", ".docx")) or "pdf" in (file.content_type or "") or "officedocument" in (file.content_type or "")):
        raise HTTPException(400, "Only PDF and DOCX are supported for MVP")
    from ..services.resume.resume_service import extract_text, extract_keywords
    try:
        text = extract_text(data, file.filename, file.content_type or "")
        if not text or len(text.strip()) < 20:
            raise HTTPException(400, "Could not extract text from resume — file may be scanned image")
        keywords = extract_keywords(text)
        # Store in user profile and separate collection for history
        db = get_database()
        now = datetime.now(timezone.utc).isoformat()
        # Update user profile
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": {"profile.resume_text": text[:10000], "profile.resume_keywords": keywords, "profile.resume_filename": fname, "updated_at": now}}
        )
        # Also store in resumes collection
        await db.resumes.update_one(
            {"user_id": ObjectId(current_user["_id"])},
            {"$set": {"text": text[:20000], "keywords": keywords, "filename": fname, "updated_at": now, "user_id": ObjectId(current_user["_id"])}},
            upsert=True
        )
        return {
            "ok": True,
            "filename": fname,
            "text_length": len(text),
            "word_count": len(text.split()),
            "preview": text[:500],
            "keywords": keywords,
            "message": f"Resume processed: found {len(keywords.get('technologies',[]))} technologies"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume processing failed: {e}")
        raise HTTPException(500, f"Resume processing failed: {str(e)[:300]}")

@router.get("/analyze")
async def analyze_resume(current_user: dict = Depends(get_current_user)):
    db = get_database()
    doc = await db.resumes.find_one({"user_id": ObjectId(current_user["_id"])})
    if not doc:
        raise HTTPException(404, "No resume found. Please upload first.")
    doc["_id"] = str(doc["_id"])
    doc["user_id"] = str(doc["user_id"])
    return doc

@router.post("/personalized-questions")
async def personalized_questions(count: int = 3, current_user: dict = Depends(get_current_user)):
    db = get_database()
    resume = await db.resumes.find_one({"user_id": ObjectId(current_user["_id"])})
    if not resume:
        raise HTTPException(404, "No resume found")
    from ..services.resume.resume_service import generate_personalized_questions
    all_qs = await db.questions.find({}).to_list(length=200)
    for q in all_qs:
        q["_id"] = str(q["_id"])
    personalized = generate_personalized_questions(resume.get("keywords", {}), all_qs, count=count)
    return {"count": len(personalized), "questions": personalized}
