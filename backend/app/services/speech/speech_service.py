import os
import tempfile
import logging
import asyncio
from typing import Tuple, Optional
from ...config import settings

logger = logging.getLogger(__name__)

# Singleton model cache
_whisper_model = None
_whisper_model_name = None
_lock = asyncio.Lock()

def get_model_name() -> str:
    return settings.whisper_model or "base"

async def load_whisper_model(model_name: str = None):
    """
    Load whisper model singleton. Tries requested model, fallback to tiny on failure.
    Suitable for 8GB RAM CPU. Loads once and reuses.
    """
    global _whisper_model, _whisper_model_name
    if _whisper_model is not None and _whisper_model_name == model_name:
        return _whisper_model

    async with _lock:
        if _whisper_model is not None and _whisper_model_name == model_name:
            return _whisper_model
        target = model_name or get_model_name()
        # Try target, then tiny
        for candidate in [target, "tiny"]:
            try:
                logger.info(f"Loading Whisper model: {candidate}")
                # whisper is heavy, load in thread to not block event loop
                import whisper
                model = await asyncio.to_thread(whisper.load_model, candidate)
                _whisper_model = model
                _whisper_model_name = candidate
                logger.info(f"Whisper model loaded: {candidate}")
                return model
            except Exception as e:
                logger.warning(f"Failed to load Whisper {candidate}: {e}")
                if candidate == "tiny":
                    raise
                continue
        raise RuntimeError("Failed to load any Whisper model")

async def transcribe_audio(file_path: str, language: Optional[str] = None) -> Tuple[str, float]:
    """
    Transcribe audio file via Whisper.
    Returns: (transcript, duration_seconds)
    """
    model = await load_whisper_model()
    # whisper expects file path, returns dict with text, segments
    import whisper
    # Run in thread
    def _transcribe():
        result = model.transcribe(file_path, language=language, fp16=False)
        text = result.get("text", "").strip()
        # duration from segments or audio length
        duration = 0.0
        segments = result.get("segments", [])
        if segments:
            duration = segments[-1].get("end", 0.0)
        return text, float(duration)
    try:
        transcript, duration = await asyncio.to_thread(_transcribe)
        return transcript, duration
    except Exception as e:
        logger.error(f"Whisper transcription failed for {file_path}: {e}")
        raise

async def save_temp_file(file_bytes: bytes, suffix: str = ".webm") -> str:
    """Save bytes to temp file and return path. Caller must delete."""
    fd, path = tempfile.mkstemp(suffix=suffix)
    try:
        os.write(fd, file_bytes)
    finally:
        os.close(fd)
    return path

def cleanup_file(path: str):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception as e:
        logger.warning(f"Failed to cleanup temp file {path}: {e}")
