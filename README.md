# InterviewSense — AI-Based Mock Interview and Performance Analyzer

> M8 Final Dashboard + Resume Complete — Full Interview Flow (§53) + History + Personalized Qs

## Stack (per §5)
Frontend: Vite + React 19 + React Router + Axios
Backend: FastAPI + Motor (MongoDB async) + Pydantic
DB: MongoDB 7.0 (local 127.0.0.1:27017, Atlas `interviewsense` for deploy)
Auth: JWT localStorage (simple) — M2
AI: Whisper base→tiny fallback (M4), TF-IDF NLP (M5), OpenCV/MediaPipe (M6)

## Quick Start — M1

### One-command start (recommended)
```bash
./run.sh          # installs deps if needed, starts API + web app
./run.sh install  # dependency setup only
./run.sh backend  # API only      ./run.sh frontend  # web app only
./run.sh --help   # all options
```
Creates `backend/.env` from the example on first run, waits for `/api/health` before opening the
web app, and stops both processes on Ctrl+C. API logs land in `logs/backend.log`.

### Backend (port 8000)
```bash
cd backend
pip install -r requirements.txt
copy .env.example .env   # edit JWT_SECRET if needed
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
# verify
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/docs
```

### Frontend (port 5173, proxies /api → 8000)
```bash
cd frontend
npm install
copy .env.example .env
npm run dev -- --port 5173 --host 127.0.0.1
# open http://127.0.0.1:5173  → redirects /login if not authed
```

### Verify M1
- [x] `GET /api/health → {status:ok, database:connected, whisper_model:base}`
- [x] Vite proxy `http://127.0.0.1:5173/api/health` works
- [x] MongoDB ping ok (`pymongo` + `motor`)
- [x] Frontend routes: /login, /register, /dashboard, /interview/setup, /interview/:id, /results/:id, /profile, /admin, /admin/questions (protected)
- [x] `npm run build` passes (104kb gzip)

### Verify M2
- [x] `POST /api/auth/register` → 201 + JWT + user (first user admin, rest candidate; duplicate email 400)
- [x] `POST /api/auth/login` → 200 + JWT (invalid 401, short password 422)
- [x] `GET /api/auth/me` → 200 with token, 403 without
- [x] `GET /api/auth/check-admin` → 200 for admin, 403 for candidate (role guard)
- [x] Frontend `localStorage` JWT simple, `AuthContext`, `ProtectedRoute` (candidate → /dashboard if adminOnly)
- [x] Demo accounts: `admin@interviewsense.com / admin123 (admin)` , `candidate@example.com / candidate123 (candidate)`
- [x] Proxy `http://127.0.0.1:5173/api/auth/*` works

### Verify M3
- [x] Auto-seed 50 questions on startup (10 HR, 10 Behavioral, 10 AI/ML, 10 CS, 10 SD) with concepts/keywords
- [x] `GET /api/questions` + filters `?domain=&difficulty=&interview_type=&search=` (candidate)
- [x] `POST/PUT/DELETE /api/questions` admin-only (candidate 403)
- [x] `POST /api/interviews` → randomized, no dups, respects difficulty with fallback, `question_count` 5-15 configurable
- [x] `GET /api/interviews` history + `GET /api/interviews/{id}` detail (owner/admin only)
- [x] `POST /api/interviews/{id}/submit-answer` → neutral `processing → next question` (hidden mock scores), adaptive difficulty `≥80 harder, <60 easier`
- [x] `POST /api/interviews/{id}/complete` + `InterviewRoom` TTS (`speechSynthesis` Play/Replay/Stop + auto-speak), `Submit → Analyzing... → Next` (no scores shown), `Results` final dashboard after completion
- [x] `Dashboard` stats + history table, `AdminQuestions` CRUD with filters
- [x] Insufficient questions 400, duplicate prevention verified, `npm run build` 107kb
- [x] Frontend: `Setup → Room (Q 1/5) → 5× Submit → Completed → Results`

### Verify M4
- [x] Whisper `base` primary, auto-fallback `tiny` on OOM, singleton `load_whisper_model()` (*8GB CPU, `fp16=False`), `WHISPER_MODEL` env
- [x] `POST /api/evaluate/audio` → `{transcript, duration}` (auth, 15MB limit, temp cleanup)
- [x] `POST /api/interviews/{id}/submit-answer` now accepts `audio` (multipart) → Whisper `transcript+duration+audio_metadata` stored hidden, video ignored for M6, empty 400, no fake scores
- [x] Frontend `InterviewRoom` MediaRecorder (`getUserMedia({video:true,audio:true})`, live preview, Start→Stop→Submit), handles `permission denied`, `empty recording`, `unsupported browser`, `transcribing...` → `Analyzing...` neutral state, no scores during interview
- [x] Processing UX: `Uploading... → Transcribing (base→tiny) → Analyzing... → Next Question` (hidden until final dashboard)
- [x] Backend validates `empty/oversize` audio, deletes temp files, `M3` backward compat (no audio still works), tone WAV test `200 {transcript:'', duration:0}` ✓, `npm run build` 108kb

### Verify M5
- [x] `backend/app/services/nlp/nlp_service.py` — TF-IDF cosine relevance (sklearn, stop_words, fallback overlap), concept/keyword coverage (substring+token 60%), completeness (concept 50%+length 30%+explanation 20%), clarity (filler 40%+uniqueness 30%+structure 30%), grammar (punctuation+baseline 70-85), fluency (WPM 110-160 + filler), `WEIGHTS` relevance 0.25/concept 0.25/completeness 0.20/clarity 0.15/grammar 0.05/fluency 0.10 → `content_score` 0-100
- [x] `POST /api/evaluate/nlp` `{question_text, expected_concepts, keywords, transcript, duration}` → `{relevance, concept_coverage, completeness, clarity, grammar, fluency, content_score, missing}` — tests: good 57-63 > irrelevant 27-28, short 35, incomplete 41, empty 0 ✓
- [x] `POST /api/interviews/{id}/submit-answer` now runs `evaluate_answer` after Whisper (or direct transcript) → stores `nlp_metrics` + `content_score` hidden, adaptive `next_diff` based on real `content_score` (≥80 harder, <60 easier), empty audio → content 0 (not mock), no scores exposed during interview
- [x] `POST /api/evaluate/combined` (audio+question) stub for E2E, `npm run build` still 108kb, version `0.5.0-M5`

### Verify M6
- [x] `backend/app/services/cv/cv_service.py` — OpenCV 4.13 + mediapipe 0.10.35 (fallback Haar when `solutions` missing), sampled frames (every 5th, max 60, 320px, `fp16=False`), metrics `face_presence` (% frames with face), `eye_contact` (% face centered 0.3-0.7), `blink_count/rate` (EAR <0.22 via FaceMesh 159/145 etc, 15-30 ideal), `movement_indicator` (nose displacement <5 stable 85, >25 high 42), `delivery_score` 0.35*face+0.35*eye+0.20*movement+0.10*blink (0-100)
- [x] `POST /api/evaluate/video` → `{face_presence, eye_contact, blink_rate, movement_indicator, delivery_score, frames_analyzed}` (20MB limit, temp cleanup, 8GB sampled)
- [x] `POST /api/interviews/{id}/submit-answer` now `audio` (video/webm reuse) + `video` separate both processed: whisper → transcript → NLP + CV (face/eye) → `cv_metrics` + `delivery_score` stored hidden, video empty/unsupported → `Video analysis unavailable` not fake score, no video → `cv None` (graceful), all hidden per §1A (submit returns only `processing`)
- [x] Frontend `InterviewRoom` already M4 MediaRecorder with `video/webm` blob reused for CV, handles `camera denied` (permission UI), `no face` → delivery low but interview continues, `blank` 22 vs face 78+ (synthetic test), `npm run build` 108kb, version `0.6.0-M6`
- [x] Tests: `face synthetic` 78/100 eye 100 delivery 85, `blank` 0/0 delivery 22, `no video` None, `hidden` check `cv not in processing response` ✓

### Verify M7
- [x] `backend/app/services/scoring/scoring_service.py` — `DEFAULT_WEIGHTS content 0.7/delivery 0.3`, `compute_overall(c,d)` normalized 0-100, missing fallback (content only or delivery only), `normalize_score` clamp, `get_category` 90-100 Excellent/80-89 Very Good/70-79 Good/60-69 Needs Improvement/0-59 Significant, `aggregate_scores` avg
- [x] `backend/app/services/feedback/feedback_service.py` — threshold 60, generates `strengths/improvements/recommendations` per §44 (relevance<60 → "Focus directly...", concept<60 → missing concepts, eye<60 → "Try to maintain...", fluency<60 → filler, etc.), no psychological claims, deduped ≤5
- [x] `POST /api/interviews/{id}/submit-answer` now `compute_overall(content,delivery)` hidden, `feedback` stored per answer, `is_mock` only when both missing, adaptive uses `overall` (≥80 harder, <60 easier), `overall` hidden during interview (`processing` has no scores), `GET /api/interviews/{id}` returns `content/delivery/overall` after complete
- [x] Tests: `80+70→77`, `content only 80→80`, `delivery only 70→70`, `110→100 -10→0`, `95 Excellent ... 55 Significant` ✓, `face+good 41+22→35`, `transcript only 30→30`, `video only 22→22`, `mock 71` when no metrics, `hidden` check ✓, `npm run build` 108kb, version `0.7.0-M7`

### Verify M8
- [x] `backend/app/services/resume/resume_service.py` — `PyPDF2` + `python-docx`, `extract_text` (PDF/DOCX, 5MB limit), `extract_keywords` (TECH_KEYWORDS 40+ + regex skills/projects/education), `generate_personalized_questions` (Technical filter, `Explain a project using {Tech}` templates, `is_personalized` flag) + `POST /api/resume/upload`/`/analyze`/`/personalized-questions` (auth, 10KB store)
- [x] `POST /api/interviews` now `use_resume` flag → inject 2-3 personalized Qs (replaces last N, lightweight, no LLM,fallback to normal), tested `8 techs detected` → `6 Q interview` last 2 personalized Python templates ✓
- [x] `GET /api/interviews/{id}` now aggregates `overall/content/delivery` averages on complete, `answers` include `nlp_metrics/cv_metrics/feedback/transcript` for final dashboard
- [x] Frontend `InterviewSetup.jsx` — resume upload UI (checkbox + file + Upload + detected techs), `Dashboard.jsx` — 6 cards (`Interviews/Avg/Best/Latest/AvgContent/AvgDelivery`) + SVG trend chart (session 1→latest) + history table with Continue/View Result
- [x] Frontend `Results.jsx` — full final dashboard: `Overall/Content/Delivery` with categories, `Strongest/Needs Improvement`, `Recommendations` (≤5, per §44), `Question-wise breakdown` (transcript, NLP relevance/coverage/missing, CV face/eye/movement, content/delivery/overall per Q), hidden until complete per §1A
- [x] Tests: `docx resume upload → 315 chars, 8 techs` ✓, `personalized 3` ✓, `interview with resume 6 Q last 2 personalized` ✓, `6× submit → completed overall 32.3 content 32.3`, `history 9 sessions avg 51.5 best 80` ✓, `npm run build` 110kb, version `0.8.0-M8`

## Next Milestones
M8 ✅ → M9 Deploy (Render + Vercel + Atlas `interviewsense`) — Full §53 flow: `Register→Login→Dashboard→Setup (+resume)→Voice Q→Cam/Mic→Submit→Whisper→NLP→CV→Scoring hidden→Next→Final Dashboard→History`

## Env Vars
`MONGODB_URL, MONGODB_DB_NAME=interviewsense, JWT_SECRET, WHISPER_MODEL=base, QUESTION_COUNT=10, CORS_ORIGINS, PORT, VITE_API_URL`
