# InterviewSense — AI-Based Mock Interview and Performance Analyzer

> M2 Auth Complete — Register/Login/JWT + Role Guard working

## Stack (per §5)
Frontend: Vite + React 19 + React Router + Axios
Backend: FastAPI + Motor (MongoDB async) + Pydantic
DB: MongoDB 7.0 (local 127.0.0.1:27017, Atlas `interviewsense` for deploy)
Auth: JWT localStorage (simple) — M2
AI: Whisper base→tiny fallback (M4), TF-IDF NLP (M5), OpenCV/MediaPipe (M6)

## Quick Start — M1

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

## Next Milestones
M2 ✅ → M3 Question Bank (50 seed) → M4 Whisper → M5 NLP → M6 CV → M7 Scoring (hidden) → M8 Final Dashboard+Resume → M9 Deploy

## Env Vars
`MONGODB_URL, MONGODB_DB_NAME=interviewsense, JWT_SECRET, WHISPER_MODEL=base, QUESTION_COUNT=10, CORS_ORIGINS, PORT, VITE_API_URL`
