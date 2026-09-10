from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional
import logging
import json

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
    # Resume-based personalization §51: inject personalized questions if requested
    if payload.use_resume:
        try:
            resume = await db.resumes.find_one({"user_id": ObjectId(current_user["_id"])})
            if resume and resume.get("keywords"):
                from ..services.resume.resume_service import generate_personalized_questions
                all_qs = await db.questions.find({}).to_list(length=200)
                for q in all_qs:
                    q["_id"] = str(q["_id"])
                personalized = generate_personalized_questions(resume.get("keywords", {}), all_qs, count=min(3, qc//3))
                if personalized:
                    # Replace last N questions with personalized (keep total qc)
                    n_personal = len(personalized)
                    selected = selected[: qc - n_personal] + personalized
                    logger.info(f"Injected {n_personal} personalized questions for {current_user['email']}")
            else:
                logger.info(f"use_resume requested but no resume found for {current_user['email']}")
        except Exception as e:
            logger.warning(f"Resume personalization failed: {e}")
            # Continue without personalization
    now = datetime.now(timezone.utc).isoformat()
    session = {
        "user_id": ObjectId(current_user["_id"]),
        "interview_type": payload.interview_type,
        "domain": payload.domain,
        "role": payload.role,
        "difficulty": payload.difficulty,
        "question_count": qc,
        "timed": payload.timed,
        "time_per_question": payload.time_per_question if payload.timed else None,
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
    request: Request,
    current_user: dict = Depends(get_current_user),
    audio: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
    transcript: Optional[str] = Form(None),
):
    """
    M4: Handles audio upload → Whisper transcription (base→tiny fallback) → store transcript/duration.
    If no audio, falls back to placeholder for backward compat (M3). Hidden scoring via mock until M5-M7.
    Video is accepted for M6 CV but ignored in M4 (deleted after no-op).
    Returns neutral processing state — NO scores exposed per §1A.
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

    now = datetime.now(timezone.utc).isoformat()
    duration: Optional[float] = None
    audio_meta: Optional[dict] = None
    whisper_error: Optional[str] = None

    # Fallback: if transcript Form was not parsed (e.g., JSON body), try to parse request body
    if not transcript:
        # Try JSON body with transcript field (for programmatic tests)
        try:
            ctype = request.headers.get("content-type", "")
            if "application/json" in ctype:
                body = await request.json()
                if isinstance(body, dict) and body.get("transcript"):
                    transcript = body.get("transcript")
                    if body.get("duration"):
                        duration = float(body.get("duration"))
        except Exception:
            pass

    cv_metrics = None
    delivery_score = None
    video_error = None
    # Helper to process video file for CV
    async def process_video_file(data_bytes: bytes, filename: str, content_type: str):
        nonlocal cv_metrics, delivery_score, video_error
        # Validate video size (max 30MB - increased)
        if len(data_bytes) == 0:
            video_error = "Empty video"
            return
        if len(data_bytes) > 30 * 1024 * 1024:
            video_error = f"Video too large ({len(data_bytes)/1024/1024:.1f}MB > 30MB) - skipping CV but interview continues"
            logger.warning(video_error)
            return
        suffix = ".webm"
        if filename and "." in filename:
            suffix = "." + filename.split(".")[-1]
        elif content_type and "mp4" in content_type:
            suffix = ".mp4"
        from ..services.speech.speech_service import save_temp_file, cleanup_file as cleanup_speech
        # Reuse same helper but for video
        from ..services.cv.cv_service import analyze_video, cleanup_file as cleanup_cv
        tmp_v = await save_temp_file(data_bytes, suffix=suffix)
        try:
            try:
                cv_metrics = await analyze_video_async(tmp_v)
                delivery_score = cv_metrics.get("delivery_score") if cv_metrics else None
                logger.info(f"CV delivery_score {delivery_score} for {sid} Q{cur}: face {cv_metrics.get('face_presence')} eye {cv_metrics.get('eye_contact')}")
            except Exception as e:
                logger.error(f"CV failed: {e}")
                video_error = str(e)[:300]
                # Do not store fake metrics — mark unavailable
                cv_metrics = {"error": video_error, "face_presence": 0, "eye_contact": 0, "delivery_score": None}
        finally:
            cleanup_cv(tmp_v)

    async def analyze_video_async(path: str):
        # Run in thread
        import asyncio
        from ..services.cv.cv_service import analyze_video
        return await asyncio.to_thread(analyze_video, path)

    if transcript and transcript.strip():
        # Direct transcript provided (testing, or fallback), no Whisper needed
        # Keep transcript as provided, duration may be estimated
        if not duration:
            # Estimate duration from words at 130 wpm
            est_words = len(transcript.split())
            duration = est_words / 130 * 60 if est_words else 10.0
        audio_meta = {"source": "direct_transcript", "transcript_length": len(transcript)}
        logger.info(f"Direct transcript for {sid} Q{cur}: {len(transcript)} chars")
        # Handle video if provided alongside direct transcript
        if video is not None:
            try:
                vdata = await video.read()
                await process_video_file(vdata, video.filename or "video.webm", video.content_type or "video/webm")
            except Exception as e:
                video_error = str(e)[:200]
    elif audio is not None:
        # Validate audio: must be non-empty, reasonable size (max 30MB - increased from 15 for timed long recordings)
        data = await audio.read()
        if len(data) == 0:
            raise HTTPException(400, "Empty audio recording. Please record again.")
        if len(data) > 30 * 1024 * 1024:
            # Instead of blocking interview, store fallback and allow to proceed
            # Return early with warning but still create answer? For now raise with helpful message and frontend will handle skip
            raise HTTPException(400, f"Audio too large ({len(data)/1024/1024:.1f}MB > 30MB). Please re-record shorter or click 'Next → Skip & Continue' to proceed without this audio (will count as low score).")
        # Save temp file
        suffix = ".webm"
        # Determine suffix from filename/content_type
        if audio.filename and "." in audio.filename:
            suffix = "." + audio.filename.split(".")[-1]
        elif audio.content_type:
            if "wav" in audio.content_type: suffix = ".wav"
            elif "mp3" in audio.content_type: suffix = ".mp3"
            elif "mp4" in audio.content_type: suffix = ".mp4"
            elif "webm" in audio.content_type: suffix = ".webm"
        from ..services.speech.speech_service import save_temp_file, cleanup_file, transcribe_audio
        tmp_path = await save_temp_file(data, suffix=suffix)
        video_already_processed = False
        try:
            try:
                transcript, duration = await transcribe_audio(tmp_path)
                if not transcript:
                    transcript = ""
                    whisper_error = "Transcription empty — audio may be silent or unclear."
                audio_meta = {
                    "filename": audio.filename,
                    "content_type": audio.content_type,
                    "size_bytes": len(data),
                    "duration": duration,
                    "transcript_length": len(transcript) if transcript else 0,
                }
                logger.info(f"Whisper transcript for {sid} Q{cur}: {len(transcript)} chars, {duration}s")
            except Exception as e:
                logger.error(f"Whisper failed: {e}")
                whisper_error = str(e)[:200]
                # Do not fail interview — store error and allow retry/next
                transcript = None
                audio_meta = {"error": whisper_error, "size_bytes": len(data)}
            # M6: If audio was video/webm, reuse same file for CV before cleanup
            is_video_type = audio.content_type and "video" in audio.content_type
            if is_video_type:
                try:
                    cv_metrics = await analyze_video_async(tmp_path)
                    delivery_score = cv_metrics.get("delivery_score") if cv_metrics else None
                    logger.info(f"CV (from audio video) delivery {delivery_score} for {sid}")
                    video_already_processed = True
                except Exception as e:
                    logger.warning(f"CV from audio video failed: {e}")
                    video_error = str(e)[:200]
        finally:
            cleanup_file(tmp_path)
        # If separate video provided and not already processed from audio
        if video is not None and not video_already_processed:
            try:
                vdata = await video.read()
                await process_video_file(vdata, video.filename or "video.webm", video.content_type or "video/webm")
            except Exception as e:
                video_error = str(e)[:200]
        # If no separate video but we have audio data and not yet processed as video, and content_type was video, we already did
        # Also handle case where audio was audio/webm but we still want to try CV if video not provided? For M6 we require video, so skip
    else:
        # No audio nor transcript — check if video provided for CV (video-only answer)
        if video is not None:
            try:
                vdata = await video.read()
                await process_video_file(vdata, video.filename or "video.webm", video.content_type or "video/webm")
                logger.info(f"Video-only CV done for {sid} Q{cur}: delivery {delivery_score}")
            except Exception as e:
                video_error = str(e)[:200]
                logger.warning(f"Video-only processing failed: {e}")
        # If still no transcript/video, M3 backward compat placeholder
        if transcript is None and cv_metrics is None and delivery_score is None:
            logger.info(f"No audio/transcript/video for {sid} Q{cur} — using placeholder transcript")

    # --- M5 NLP evaluation (hidden) ---
    nlp_metrics = None
    content_score = None
    if transcript is not None:
        try:
            from ..services.nlp.nlp_service import evaluate_answer
            nlp_res = evaluate_answer(
                question_text=q.get("question_text", ""),
                expected_concepts=q.get("expected_concepts", []),
                keywords=q.get("keywords", []),
                transcript=transcript or "",
                duration=duration,
            )
            nlp_metrics = nlp_res
            content_score = nlp_res.get("content_score")
            logger.info(f"NLP content_score {content_score} for {sid} Q{cur}: relevance {nlp_res['relevance']} coverage {nlp_res['concept_coverage']}")
        except Exception as e:
            logger.error(f"NLP failed: {e}")
            nlp_metrics = {"error": str(e)[:300]}
            content_score = None

    # --- M7 Scoring: content + delivery -> overall (hidden) ---
    from ..services.scoring.scoring_service import compute_overall, normalize_score
    from ..services.feedback.feedback_service import generate_feedback
    # Normalize individual scores already 0-100, but ensure
    content_score = normalize_score(content_score) if content_score is not None else None
    delivery_score = normalize_score(delivery_score) if delivery_score is not None else None
    overall_computed = compute_overall(content_score, delivery_score)
    is_mock = False
    if overall_computed is None:
        # No real metrics at all (e.g., no transcript and no video) — use mock for M3 backward compat
        import random
        overall_computed = random.randint(65, 88)
        is_mock = True
        logger.info(f"Using mock overall {overall_computed} for {sid} Q{cur} (no real metrics)")
    overall_for_adaptive = overall_computed
    placeholder_overall = overall_computed
    # Feedback based on actual scores (not mock)
    feedback_data = None
    if not is_mock:
        try:
            feedback_data = generate_feedback(nlp_metrics, cv_metrics, content_score, delivery_score)
        except Exception as e:
            logger.warning(f"Feedback generation failed: {e}")
            feedback_data = None

    answer_doc = {
        "session_id": oid,
        "question_id": ObjectId(qid) if len(qid)==24 else qid,
        "transcript": transcript,
        "duration": duration,
        "audio_metadata": audio_meta,
        "whisper_error": whisper_error,
        "cv_metrics": cv_metrics,
        "video_error": video_error,
        "nlp_metrics": nlp_metrics,
        "content_score": content_score,
        "delivery_score": delivery_score,
        "overall_score": placeholder_overall,  # hidden per §1A; M7 blended
        "feedback": feedback_data,
        "created_at": now,
        "is_mock": is_mock
    }
    await db.answers.insert_one(answer_doc)

    # Adaptive next difficulty (hidden) — now based on real NLP content_score if available
    next_diff = adaptive_next_difficulty(overall_for_adaptive, session.get("difficulty", "medium"))
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
        answers = await db.answers.find({"session_id": oid}).to_list(length=50)
        # Overall average
        scores = [a.get("overall_score") for a in answers if a.get("overall_score") is not None]
        if scores:
            update["overall_score"] = round(sum(scores)/len(scores), 1)
        # Content / Delivery averages for final dashboard
        c_scores = [a.get("content_score") for a in answers if a.get("content_score") is not None]
        d_scores = [a.get("delivery_score") for a in answers if a.get("delivery_score") is not None]
        if c_scores:
            update["content_score"] = round(sum(c_scores)/len(c_scores), 1)
        if d_scores:
            update["delivery_score"] = round(sum(d_scores)/len(d_scores), 1)

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

@router.delete("/{sid}")
async def delete_interview(sid: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        oid = ObjectId(sid)
    except:
        raise HTTPException(400, "Invalid session id")
    doc = await db.interview_sessions.find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Interview not found")
    if str(doc["user_id"]) != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(403, "Not authorized to delete this interview")
    # Delete answers first
    await db.answers.delete_many({"session_id": oid})
    result = await db.interview_sessions.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Interview not found")
    return {"ok": True, "deleted_id": sid}

@router.delete("")
async def delete_all_my_interviews(current_user: dict = Depends(get_current_user)):
    db = get_database()
    # Delete all sessions for current user (candidate) or all if admin calls with ?all=true? Keep simple: delete own
    query = {"user_id": ObjectId(current_user["_id"])}
    # Find ids to also delete answers
    sessions = await db.interview_sessions.find(query, {"_id": 1}).to_list(length=200)
    ids = [s["_id"] for s in sessions]
    if ids:
        await db.answers.delete_many({"session_id": {"$in": ids}})
        res = await db.interview_sessions.delete_many(query)
        return {"ok": True, "deleted_count": res.deleted_count}
    return {"ok": True, "deleted_count": 0}

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
    # Aggregate scores if not yet (for older sessions)
    if answers:
        if not doc.get("overall_score"):
            scores = [a.get("overall_score") for a in answers if a.get("overall_score") is not None]
            if scores:
                doc["overall_score"] = round(sum(scores)/len(scores), 1)
        if not doc.get("content_score"):
            c_scores = [a.get("content_score") for a in answers if a.get("content_score") is not None]
            if c_scores:
                doc["content_score"] = round(sum(c_scores)/len(c_scores), 1)
        if not doc.get("delivery_score"):
            d_scores = [a.get("delivery_score") for a in answers if a.get("delivery_score") is not None]
            if d_scores:
                doc["delivery_score"] = round(sum(d_scores)/len(d_scores), 1)
    doc["answers"] = answers
    return doc
