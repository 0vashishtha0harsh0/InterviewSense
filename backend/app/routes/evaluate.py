from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from pydantic import BaseModel
from typing import List, Optional
from ..utils.deps import get_current_user
from ..services.speech.speech_service import save_temp_file, cleanup_file, transcribe_audio
from ..services.nlp.nlp_service import evaluate_answer

router = APIRouter()

class NlpEvaluateRequest(BaseModel):
    question_text: str
    expected_concepts: List[str] = []
    keywords: List[str] = []
    transcript: str
    duration: Optional[float] = None

@router.post("/audio")
async def evaluate_audio(audio: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    data = await audio.read()
    if len(data) == 0:
        raise HTTPException(400, "Empty audio file")
    if len(data) > 30 * 1024 * 1024:
        raise HTTPException(400, "Audio too large (max 30MB)")
    suffix = ".webm"
    if audio.filename and "." in audio.filename:
        suffix = "." + audio.filename.split(".")[-1]
    tmp = await save_temp_file(data, suffix=suffix)
    try:
        transcript, duration = await transcribe_audio(tmp)
        return {"transcript": transcript, "duration": duration, "size_bytes": len(data), "model": "whisper"}
    except Exception as e:
        raise HTTPException(500, f"Transcription failed: {str(e)[:300]}")
    finally:
        cleanup_file(tmp)

@router.post("/nlp")
async def evaluate_nlp(payload: NlpEvaluateRequest, current_user: dict = Depends(get_current_user)):
    if not payload.transcript or not payload.transcript.strip():
        raise HTTPException(400, "Transcript empty")
    result = evaluate_answer(
        question_text=payload.question_text,
        expected_concepts=payload.expected_concepts,
        keywords=payload.keywords,
        transcript=payload.transcript,
        duration=payload.duration,
    )
    return result

@router.post("/combined")
async def evaluate_combined(audio: UploadFile = File(...), question_text: str = Body(None), current_user: dict = Depends(get_current_user)):
    """Audio -> Whisper -> NLP combined for testing"""
    data = await audio.read()
    if len(data) == 0:
        raise HTTPException(400, "Empty audio")
    tmp = await save_temp_file(data, suffix=".webm")
    try:
        transcript, duration = await transcribe_audio(tmp)
        nlp = None
        if question_text and transcript:
            # Try to fetch expected concepts if question_text matches a DB question, else empty
            nlp = evaluate_answer(question_text=question_text, expected_concepts=[], keywords=[], transcript=transcript, duration=duration)
        return {"transcript": transcript, "duration": duration, "nlp": nlp}
    finally:
        cleanup_file(tmp)

@router.post("/video")
async def evaluate_video(video: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    from ..services.speech.speech_service import save_temp_file, cleanup_file
    from ..services.cv.cv_service import analyze_video
    import asyncio
    data = await video.read()
    if len(data) == 0:
        raise HTTPException(400, "Empty video")
    if len(data) > 30 * 1024 * 1024:
        raise HTTPException(400, "Video too large (max 30MB)")
    suffix = ".webm"
    if video.filename and "." in video.filename:
        suffix = "." + video.filename.split(".")[-1]
    tmp = await save_temp_file(data, suffix=suffix)
    try:
        result = await asyncio.to_thread(analyze_video, tmp)
        return result
    except Exception as e:
        raise HTTPException(500, f"CV failed: {str(e)[:300]}")
    finally:
        cleanup_file(tmp)
