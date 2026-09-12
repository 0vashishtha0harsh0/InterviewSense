# =============================================================================
# InterviewSense API — Docker image (used by Render "docker" runtime)
#
# Whisper + OpenCV + MediaPipe need ffmpeg and libGL, which are installed here.
# Render injects $PORT; uvicorn binds to it at runtime.
# =============================================================================

FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    XDG_CACHE_HOME=/tmp/cache \
    HF_HOME=/tmp/hf \
    WHISPER_CACHE=/tmp/whisper

# Runtime shared libraries:
#   ffmpeg          - audio/video decoding for Whisper
#   libgl1/libglib  - OpenCV native deps
#   libgomp1        - MediaPipe / onnx runtime
#   curl            - healthcheck debugging
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first for better layer caching
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# App code
COPY . .

EXPOSE 8000

# Render sets PORT (default 8000 locally); $PORT is respected via shell form
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --timeout-keep-alive 60"]
