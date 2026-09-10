# InterviewSense — AI Code Generation Master Specification

> **Purpose:** Feed this entire Markdown file to an AI coding assistant to generate the InterviewSense project step-by-step.
>
> **Important:** This is a **1-day, 2-person MVP/prototype**. Prioritize a working end-to-end demonstration over unnecessary complexity.

---

# 1. PROJECT OVERVIEW

## Project Name

**InterviewSense**

## Project Title

**AI-Based Mock Interview and Performance Analyzer**

## Academic Context

- B.Tech Computer Science & Engineering (AI/ML)
- IMS Engineering College
- Project area: Artificial Intelligence / Machine Learning
- Team size: 2 students
- Available development time: **1 day**
- Hardware: **8 GB RAM, CPU-only, no dedicated GPU**

## Core Idea

InterviewSense is a web-based AI mock interview platform.

A candidate:

1. Creates an account.
2. Logs in.
3. Selects an interview type/domain.
4. Optionally uploads a resume.
5. Starts an interview.
6. The AI asks questions using voice.
7. The candidate answers using microphone + webcam.
8. The candidate submits the answer.
9. The system processes the answer **after submission**.
10. Whisper converts speech to text.
11. NLP evaluates the answer.
12. Computer Vision evaluates measurable non-verbal behavior.
13. A scoring engine combines the results.
14. The candidate receives feedback.
15. The process continues for approximately 10 questions.
16. A final dashboard shows overall performance and history.

---

# 1A. CRITICAL INTERVIEW UX RULE — FEEDBACK ONLY AT THE END

This is a mandatory product requirement.

**The candidate must receive NO performance feedback during the interview.**

After each question:

```text
Candidate answers
↓
Submit
↓
System processes audio/video
↓
Whisper + NLP + CV + scoring
↓
Results are stored internally
↓
Candidate sees only a neutral processing state
↓
Next question
```

The candidate must NOT see during the interview:

- question score
- content score
- delivery score
- overall score
- strengths
- weaknesses
- recommendations
- transcript-based evaluation
- eye-contact evaluation
- confidence indicator
- behavioral feedback

For adaptive interviews, the backend may use the hidden evaluation to choose the next question. This internal evaluation must remain invisible to the candidate.

After the **final question**:

```text
Final answer submitted
↓
Final processing completed
↓
Aggregate all question results
↓
Generate complete interview feedback
↓
Show final performance dashboard
```

The final dashboard may contain:

- overall score
- content score
- delivery/non-verbal score
- question-wise breakdown
- strengths
- weaknesses
- recommendations
- overall feedback
- performance history

This separation is intentional: the interview should feel like a real uninterrupted interview, while the analysis is presented as a post-interview performance review.

---

# 2. SOURCE SYNOPSIS ALIGNMENT

The project synopsis defines InterviewSense as an AI-based mock interview and performance analyzer combining:

- NLP
- Computer Vision
- Scoring Engine

The synopsis proposes these major modules:

1. User Authentication & Profile
2. Question Bank Management
3. Audio Capture & Speech-to-Text
4. NLP-based Answer Evaluation
5. Video Capture & Facial Expression Analysis
6. Scoring & Report Generation
7. Admin Dashboard for Content Management

The synopsis proposes:

- React.js / HTML / CSS / JavaScript
- Python Flask/FastAPI
- OpenAI Whisper / Google Speech-to-Text
- spaCy / NLTK / Transformer models
- OpenCV / MediaPipe
- MongoDB / MySQL
- Docker / AWS / Render

For this 1-day implementation, use lightweight choices and do not attempt unnecessary production infrastructure.

---

# 3. HARD CONSTRAINTS

These constraints are mandatory.

## Team

Two people.

## Time

One day.

## Hardware

8 GB RAM.

No GPU.

## AI

Use pretrained/lightweight models.

Do NOT train large models.

Do NOT fine-tune BERT.

Do NOT use large local LLMs.

## Whisper

Use a lightweight Whisper model suitable for CPU.

Prefer:

- `tiny` as the safest choice for speed/memory
- `base` only if performance is acceptable on the available machine

Make the model configurable through an environment variable.

Example:

```env
WHISPER_MODEL=tiny
```

## Processing

Analysis occurs **after the user submits each answer**, but the analysis results are kept hidden from the candidate until the **entire interview is complete**.

Do not implement real-time AI analysis.

During the interview, the candidate must NOT see:
- scores
- strengths
- weaknesses
- recommendations
- question-level feedback

The system may process/store each answer in the background and use hidden evaluation results for adaptive question selection.

## Questions

Target approximately **10 questions per interview**.

The number must be configurable.

Do not hard-code exactly 10 everywhere.

## Interview behavior

Support both:

- normal/fixed question flow
- lightweight adaptive behavior

Do NOT build a complex autonomous interview agent.

Adaptive behavior can be rule-based, for example:

- choose follow-up question based on domain/difficulty
- choose easier/harder question based on previous score
- select a follow-up question when the answer is incomplete

## Voice

The AI should **speak questions aloud**.

Use browser text-to-speech initially instead of generating expensive voice audio.

Recommended:

```text
window.speechSynthesis
```

The question should also remain visible as text.

## Report

Use a dashboard.

Do NOT spend time building PDF reports.

## Resume

Resume upload is required as a feature target.

Use it to extract text and generate/select personalized questions.

Keep implementation lightweight.

## Authentication

Use:

- email
- password

Do not implement Google OAuth.

---

# 4. MVP PRIORITY

The most important feature is:

```text
LOGIN
→ INTERVIEW
→ VOICE QUESTION
→ AUDIO + VIDEO ANSWER
→ SUBMIT
→ WHISPER
→ NLP
→ CV
→ SCORE
→ FEEDBACK
→ NEXT QUESTION
→ FINAL DASHBOARD
```

If time becomes limited, preserve this pipeline.

Priority order:

### P0 — MUST WORK

- project setup
- login/register
- interview setup
- question selection
- question voice
- microphone recording
- webcam recording/analysis
- Whisper transcription
- basic NLP evaluation
- basic CV analysis
- scoring
- final result
- dashboard

### P1 — SHOULD WORK

- resume upload
- resume-based questions
- interview history
- lightweight adaptive question selection
- admin question management

### P2 — OPTIONAL

- advanced UI animations
- extensive analytics
- deployment
- Docker
- advanced transformer models
- sophisticated adaptive interviewing

Do not sacrifice P0 for P2.

---

# 5. RECOMMENDED TECHNOLOGY STACK

## Frontend

- React.js
- JavaScript
- HTML
- CSS
- React Router
- Fetch API or Axios

Do not introduce a large UI framework unless necessary.

## Backend

Use:

**FastAPI**

Python.

## Database

Use:

**MongoDB**

Prefer a simple local/managed MongoDB configuration.

## Authentication

Use:

- bcrypt/passlib or equivalent secure password hashing
- JWT
- role-based authorization

## Speech

Use:

**OpenAI Whisper local package**

with a lightweight model.

## NLP

Use lightweight Python NLP.

Possible:

- spaCy
- NLTK
- sentence-transformers only if memory/performance is acceptable
- simple TF-IDF/cosine similarity as fallback
- keyword/concept matching
- rule-based metrics

Do not require a large transformer if it threatens the 1-day/8GB constraint.

## Computer Vision

Use:

- OpenCV
- MediaPipe

Prefer processing sampled frames rather than every video frame if performance is an issue.

## Voice Questions

Use browser:

```javascript
window.speechSynthesis
```

## Resume

Use lightweight text extraction.

PDF support is preferred.

Use a suitable Python PDF text extraction library.

If DOCX support is easy to add, support it; otherwise PDF is sufficient for MVP.

---

# 6. HIGH-LEVEL SYSTEM ARCHITECTURE

```text
┌─────────────────────────────────────────────┐
│                 React Frontend              │
│                                             │
│ Login | Dashboard | Interview | Results     │
└──────────────────────┬──────────────────────┘
                       │ REST API
                       ▼
┌─────────────────────────────────────────────┐
│                 FastAPI Backend              │
│                                             │
│ Auth | Interview | Questions | Evaluation   │
└───────┬──────────────┬─────────────┬────────┘
        │              │             │
        ▼              ▼             ▼
┌────────────┐  ┌──────────────┐  ┌───────────┐
│ Whisper    │  │ NLP Engine   │  │ CV Engine │
│ Speech→Text│  │ Answer Eval  │  │ OpenCV    │
│            │  │              │  │ MediaPipe │
└──────┬─────┘  └──────┬───────┘  └─────┬─────┘
       │               │                │
       └───────────────┼────────────────┘
                       ▼
              ┌─────────────────┐
              │ Scoring Engine  │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │ Feedback Engine │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │    MongoDB      │
              └─────────────────┘
```

---

# 7. PROJECT DIRECTORY

Create a clean structure.

```text
InterviewSense/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   ├── interview/
│   │   │   ├── speech/
│   │   │   ├── nlp/
│   │   │   ├── cv/
│   │   │   ├── scoring/
│   │   │   ├── resume/
│   │   │   └── feedback/
│   │   └── utils/
│   ├── requirements.txt
│   └── .env.example
│
├── data/
│   ├── questions/
│   └── sample/
│
├── uploads/
│   └── .gitkeep
│
├── tests/
│
├── docs/
│
├── .gitignore
├── README.md
└── ...
```

Do not create unnecessary folders until needed.

---

# 8. DATABASE DESIGN

Use MongoDB.

## USERS

```text
users
```

Fields:

```text
_id
name
email
password_hash
role
profile
created_at
updated_at
```

Roles:

```text
candidate
admin
```

---

## QUESTIONS

```text
questions
```

Fields:

```text
_id
question_text
interview_type
domain
role
difficulty
expected_concepts
keywords
follow_up_questions
created_at
updated_at
```

Example:

```json
{
  "question_text": "What is overfitting in machine learning?",
  "interview_type": "technical",
  "domain": "AI/ML",
  "role": "ML Engineer",
  "difficulty": "medium",
  "expected_concepts": [
    "training data",
    "unseen data",
    "generalization",
    "noise"
  ],
  "keywords": [
    "overfitting",
    "training",
    "test",
    "generalization"
  ]
}
```

---

## INTERVIEW SESSIONS

```text
interview_sessions
```

Fields:

```text
_id
user_id
interview_type
domain
role
difficulty
question_count
questions
current_question
status
started_at
completed_at
overall_score
content_score
delivery_score
created_at
```

Status:

```text
created
started
processing
completed
failed
```

---

## ANSWERS

```text
answers
```

Fields:

```text
_id
session_id
question_id
transcript
duration
audio_metadata
cv_metrics
nlp_metrics
content_score
delivery_score
overall_score
feedback
created_at
```

Avoid permanent raw video/audio storage unless needed.

Temporary files should be deleted after processing.

---

# 9. AUTHENTICATION FLOW

## Register

```text
POST /api/auth/register
```

Input:

```json
{
  "name": "Candidate",
  "email": "candidate@example.com",
  "password": "..."
}
```

Hash password.

Store user.

Do not store plaintext password.

---

## Login

```text
POST /api/auth/login
```

Return JWT.

Frontend stores authentication securely according to the chosen implementation.

---

## Current User

```text
GET /api/auth/me
```

Return current authenticated user.

---

## Role Authorization

Candidate:

- dashboard
- interviews
- profile
- results

Admin:

- admin dashboard
- question management

---

# 10. PHASE 1 — PROJECT FOUNDATION

## Objective

Create a runnable React + FastAPI + MongoDB application.

## Step 1

Initialize project.

## Step 2

Create FastAPI server.

Implement:

```text
GET /api/health
```

Expected:

```json
{
  "status": "ok"
}
```

## Step 3

Connect MongoDB.

## Step 4

Create React application.

## Step 5

Create frontend routing.

Pages:

```text
/login
/register
/dashboard
/interview/setup
/interview/:id
/results/:id
/profile
/admin
/admin/questions
```

## Step 6

Create authentication.

## Step 7

Create basic candidate dashboard.

## Step 8

Create basic admin dashboard.

## Acceptance Criteria

- frontend runs
- backend runs
- database connects
- register works
- login works
- protected routes work
- candidate dashboard opens
- admin role is protected

---

# 11. PHASE 2 — QUESTION BANK & INTERVIEW ENGINE

## Objective

Make the interview itself functional before adding AI analysis.

## Step 1 — Question seed data

Create a useful starter dataset.

Minimum recommended:

### HR

10 questions.

### Behavioral

10 questions.

### Technical AI/ML

10 questions.

### Technical CS

10 questions.

### General software/developer

10 questions.

Do not spend excessive time creating hundreds of questions.

---

# 12. INTERVIEW TYPES

Support:

```text
HR
Technical
Behavioral
Domain-specific
```

Domains can include:

```text
AI/ML
Computer Science
Software Development
Data Science
Web Development
```

Keep question data configurable.

---

# 13. INTERVIEW SETUP

Candidate selects:

```text
Interview Type
Domain
Role
Difficulty
Number of Questions
Resume (optional/required where personalized mode is selected)
```

Number of questions:

Default:

```text
10
```

But configurable.

---

# 14. QUESTION SELECTION

Create a question-selection service.

Inputs:

```text
interview_type
domain
role
difficulty
question_count
```

Rules:

1. Filter eligible questions.
2. Randomize where appropriate.
3. Prevent duplicates.
4. Respect difficulty.
5. Include resume-derived questions if personalized mode is enabled.

---

# 15. LIGHTWEIGHT ADAPTIVE MODE

Do NOT create a complicated AI agent.

Use rules.

Example:

```text
Previous score >= 80
→ next question may be harder

Previous score 60–79
→ same difficulty

Previous score < 60
→ easier or clarifying/fundamental question
```

If an answer is incomplete:

```text
→ select a related follow-up question
```

Adaptive behavior must never break the interview.

---

# 16. INTERVIEW STATE MACHINE

Use:

```text
CREATED
↓
STARTED
↓
QUESTION_ACTIVE
↓
ANSWERING
↓
SUBMITTED
↓
PROCESSING
↓
EVALUATED
↓
NEXT QUESTION
↓
COMPLETED
```

Handle failures.

If AI processing fails:

- show an error
- allow retry
- do not lose the interview session

---

# 17. PHASE 3 — VOICE QUESTIONS + AUDIO + WHISPER + NLP

## Objective

Implement the complete spoken-answer evaluation pipeline.

```text
Question
↓
Browser Text-to-Speech
↓
Candidate answers
↓
Microphone recording
↓
Submit
↓
Backend
↓
Whisper
↓
Transcript
↓
NLP
↓
Content Score
```

---

# 18. AI VOICE QUESTIONS

Use browser text-to-speech.

Example:

```javascript
const utterance = new SpeechSynthesisUtterance(questionText);
window.speechSynthesis.speak(utterance);
```

Requirements:

- question remains visible
- play button
- replay button
- stop speech button
- auto-speak when question starts if browser allows it

Do not generate/store audio files.

---

# 19. AUDIO RECORDING

Use browser `MediaRecorder`.

Flow:

```text
Start Answer
↓
MediaRecorder.start()
↓
Candidate speaks
↓
Stop Answer
↓
Blob created
↓
Upload to backend
```

Handle:

- microphone permission denied
- unsupported browser
- empty recording
- recording failure

---

# 20. WHISPER

Use a lightweight local Whisper model.

Preferred:

```text
tiny
```

Fallback:

```text
base
```

Make configurable:

```env
WHISPER_MODEL=tiny
```

Do not download a large model.

Backend service:

```text
speech_service.py
```

Input:

```text
audio file
```

Output:

```json
{
  "transcript": "...",
  "duration": 12.4
}
```

---

# 21. NLP EVALUATION

The NLP engine should evaluate:

1. Relevance
2. Concept/keyword coverage
3. Completeness
4. Clarity
5. Grammar
6. Fluency

Because this is a 1-day CPU-only project, use a hybrid lightweight approach.

---

# 22. RELEVANCE

Compare:

```text
Question
vs
Candidate transcript
```

Possible methods:

1. TF-IDF cosine similarity
2. lightweight embeddings if feasible
3. concept overlap

Use a fallback if an embedding model cannot run efficiently.

Return:

```text
0–100
```

---

# 23. CONCEPT COVERAGE

Each question has:

```text
expected_concepts
keywords
```

Check which important concepts appear directly or through simple semantic matching.

Example:

Question:

```text
What is overfitting?
```

Expected concepts:

```text
training data
unseen data
generalization
noise
```

Return:

```text
covered_concepts
missing_concepts
coverage_score
```

---

# 24. COMPLETENESS

Determine whether the candidate covered the expected important points.

Possible lightweight approach:

```text
expected concept coverage
+
answer length
+
presence of explanation
```

Do not make answer length alone determine correctness.

---

# 25. CLARITY

Use measurable linguistic indicators.

Potential signals:

- sentence structure
- excessive repetition
- excessive filler words
- answer organization

Keep the metric simple and explainable.

---

# 26. GRAMMAR

Use lightweight NLP.

If spaCy or another tool is used, ensure it is practical on the machine.

Do not make grammar a dominant score.

Conversational speech naturally contains fragments.

---

# 27. FLUENCY

Use:

- speaking duration
- transcript length
- words per minute where possible
- filler-word count
- pause information if available

Example filler list:

```text
um
uh
like
you know
actually
basically
```

Do not treat every filler word as a major failure.

---

# 28. NLP OUTPUT

Example:

```json
{
  "relevance": 84,
  "concept_coverage": 78,
  "completeness": 76,
  "clarity": 80,
  "grammar": 86,
  "fluency": 72,
  "content_score": 79,
  "missing_concepts": [
    "generalization"
  ]
}
```

---

# 29. PHASE 4 — WEBCAM + COMPUTER VISION

## Objective

Analyze the candidate's observable non-verbal behavior after answer submission.

Important:

Do NOT claim that the system can scientifically determine a person's internal emotional state or actual confidence.

Use:

**Non-Verbal Behavior Analysis**

and:

**Confidence Indicator**

based on observable measurements.

---

# 30. WEBCAM

Use browser:

```javascript
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
})
```

Show live preview.

Record the answer video if needed for post-processing.

If raw video is too expensive, process frames during/after recording and avoid long-term storage.

---

# 31. FACE DETECTION

Use:

- MediaPipe
- OpenCV

Detect:

```text
face present
face absent
```

Calculate:

```text
face_presence_ratio
```

---

# 32. FACIAL LANDMARKS

Use MediaPipe landmarks.

Track relevant points.

Do not attempt unnecessary emotion-recognition complexity.

---

# 33. EYE CONTACT

Estimate camera-directed gaze using available facial/eye/head-pose information.

Output:

```text
eye_contact_ratio
```

Example:

```text
72%
```

This is an estimate, not a scientifically perfect eye-contact measurement.

---

# 34. BLINK METRIC

Estimate blink-related behavior from eye landmarks.

Return something like:

```text
blink_count
blink_rate
```

Do not automatically label normal blinking as negative.

---

# 35. MOVEMENT / FIDGET INDICATOR

Measure excessive movement where technically reliable.

Possible:

```text
landmark displacement
head movement
face movement
```

Return:

```text
movement_score
```

Avoid unsupported claims about nervousness.

---

# 36. FACE EXPRESSION

Only implement simple observable expression-related metrics if reliable.

Examples:

- smile frequency
- facial landmark changes

Do NOT claim:

```text
"The candidate is anxious."
```

Instead:

```text
"Facial movement pattern indicates..."
```

or provide a neutral behavioral observation.

---

# 37. CV OUTPUT

Example:

```json
{
  "face_presence": 96,
  "eye_contact": 72,
  "blink_rate": 18,
  "movement_indicator": 74,
  "smile_frequency": 22,
  "delivery_score": 76
}
```

The exact metrics can be adjusted based on what is technically reliable.

---

# 38. PERFORMANCE OPTIMIZATION FOR 8GB RAM / CPU

Mandatory optimization rules:

1. Use lightweight Whisper.
2. Do not load multiple large models simultaneously.
3. Process video at reduced resolution where possible.
4. Sample frames instead of processing every frame.
5. Release video/audio objects after processing.
6. Delete temporary files.
7. Avoid storing unnecessary raw media.
8. Load AI models once and reuse them.
9. Do not initialize Whisper on every request.
10. Do not run expensive NLP and CV concurrently if memory becomes a problem.
11. Use asynchronous/background processing only where it simplifies rather than complicates the MVP.

---

# 39. PHASE 5 — SCORING ENGINE

## Objective

Combine NLP and CV results into understandable scores.

Create:

```text
scoring_service.py
```

Do not put scoring formulas directly in React components.

---

# 40. SCORE CATEGORIES

## Content

Derived from:

- relevance
- concept coverage
- completeness
- clarity
- grammar
- fluency

## Delivery

Derived from:

- eye contact
- face presence
- movement-related metrics
- other validated observable features

## Overall

Combine:

```text
content_score
+
delivery_score
```

---

# 41. CONFIGURABLE WEIGHTS

Create configuration such as:

```json
{
  "relevance": 0.20,
  "concept_coverage": 0.20,
  "completeness": 0.15,
  "clarity": 0.10,
  "grammar": 0.05,
  "fluency": 0.10,
  "eye_contact": 0.10,
  "behavior": 0.10
}
```

These are example starting values.

Make them configurable.

The exact final weights should be documented and justified.

---

# 42. SCORE NORMALIZATION

All scores must be normalized to:

```text
0–100
```

Do not allow negative values or values above 100.

---

# 43. PERFORMANCE CATEGORIES

Use configurable thresholds.

Example:

```text
90–100 → Excellent
80–89  → Very Good
70–79  → Good
60–69  → Needs Improvement
0–59   → Needs Significant Improvement
```

---

# 44. FEEDBACK ENGINE

Feedback must be based on actual scores.

Example:

If:

```text
relevance < 60
```

suggest:

```text
Focus directly on what the question asks and avoid unrelated information.
```

If:

```text
concept_coverage < 60
```

suggest:

```text
Include the important concepts expected for this question.
```

If:

```text
eye_contact < 60
```

suggest:

```text
Try to maintain more consistent attention toward the camera.
```

If:

```text
fluency < 60
```

suggest:

```text
Practice answering aloud with shorter pauses and fewer filler words.
```

Do not generate unsupported psychological conclusions.

---

# 45. QUESTION-LEVEL INTERNAL RESULT

After each submitted answer, the backend may calculate and store:

```text
Transcript
Content metrics
Delivery metrics
Overall score
Strengths
Areas to improve
Feedback
```

However, **NONE of these evaluation results should be displayed to the candidate during the interview**.

The candidate should only see a neutral processing state such as:

```text
Answer submitted.
Analyzing response...
```

Then the system proceeds to the next question.

The stored/internal result may be used by the adaptive question-selection logic, but it must remain hidden from the candidate until the interview is fully complete.

---

# 46. PHASE 6 — FINAL FEEDBACK DASHBOARD, HISTORY, RESUME & FULL INTEGRATION

## Objective

Create the final user experience, with **all performance feedback revealed only after the complete interview has finished**.

---

# 47. CANDIDATE DASHBOARD

Display:

```text
Interviews Completed
Average Score
Best Score
Latest Score
Average Content Score
Average Delivery Score
```

---

# 48. INTERVIEW HISTORY

Show:

```text
Date
Interview Type
Domain
Score
Status
View Result
```

---

# 49. PERFORMANCE TREND

Show a simple chart:

```text
Session 1 → 65
Session 2 → 70
Session 3 → 74
Session 4 → 81
```

Use a lightweight chart library or simple CSS/SVG if necessary.

---

# 50. FINAL INTERVIEW DASHBOARD

**Only after ALL interview questions have been completed and processed**, show the complete performance analysis.

Example:

```text
Overall Score: 78/100

Content: 82/100
Delivery: 73/100

Strongest Area:
Relevance

Needs Improvement:
Eye Contact

Recommendations:
1. Maintain camera-directed gaze.
2. Reduce filler words.
3. Include missing technical concepts.
```

Also show the question-by-question breakdown **after the interview is complete**.

Do NOT show individual question scores, feedback, strengths, weaknesses, or recommendations while the candidate is still answering questions.

---

# 51. RESUME-BASED PERSONALIZATION

This feature is required as an MVP target but must remain lightweight.

Flow:

```text
Upload Resume
↓
Extract Text
↓
Identify:
- skills
- projects
- education
- experience
- technologies
↓
Generate/select questions
↓
Interview
```

Do NOT build a huge resume-understanding model.

Use:

- keyword extraction
- known technology lists
- simple pattern matching
- lightweight NLP

Example:

If resume contains:

```text
Python
TensorFlow
Machine Learning
```

generate/select questions such as:

```text
Explain a machine-learning project you built.
Why did you choose Python?
How did you evaluate your model?
```

If generative AI is used for question creation, make it optional and configurable.

The system must still work without an external paid API.

---

# 52. ADMIN QUESTION MANAGEMENT

Admin can:

- view questions
- add questions
- edit questions
- delete questions
- filter by domain
- filter by difficulty
- filter by type

Fields:

```text
question_text
type
domain
role
difficulty
expected_concepts
keywords
follow_up_questions
```

---

# 53. COMPLETE INTERVIEW FLOW

The final flow must be:

```text
1. User opens InterviewSense
        ↓
2. Register/Login
        ↓
3. Dashboard
        ↓
4. Start Interview
        ↓
5. Select:
   - type
   - domain
   - role
   - difficulty
   - question count
        ↓
6. Optional resume upload
        ↓
7. Interview begins
        ↓
8. AI speaks question
        ↓
9. Question displayed
        ↓
10. Camera + microphone activated
        ↓
11. Candidate answers
        ↓
12. Candidate presses Submit
        ↓
13. Audio/video processing
        ↓
14. Whisper transcription
        ↓
15. NLP evaluation
        ↓
16. CV evaluation
        ↓
17. Scoring engine
        ↓
18. Store evaluation silently
        ↓
19. Do NOT show feedback or scores
        ↓
20. Adaptive/fixed next question
        ↓
21. Repeat until ALL questions are complete
        ↓
22. Process/verify final question
        ↓
23. Generate COMPLETE interview feedback
        ↓
24. Show FINAL PERFORMANCE DASHBOARD
        ↓
25. Save session history
```

**Critical UX rule:** The candidate remains in interview mode until the final question is submitted and processing is complete. Feedback is a final-stage experience, not an after-each-question experience.

---

# 54. ERROR HANDLING

The system must gracefully handle:

## Camera denied

Show:

```text
Camera access is required for non-verbal analysis.
```

Allow the interview to continue only if the project defines a degraded audio-only mode.

## Microphone denied

Show a clear error.

## Whisper failure

Allow retry.

## NLP failure

Do not destroy the interview.

Show:

```text
Content analysis temporarily unavailable.
```

## CV failure

Return:

```text
Video analysis unavailable for this answer.
```

and avoid inventing a score.

## Database failure

Show a useful error and preserve session state where practical.

---

# 55. DATA PRIVACY

Because the system uses webcam, microphone and resume data:

- request permissions clearly
- explain usage
- process temporary media securely
- delete temporary audio/video after processing when possible
- avoid unnecessary raw-media retention
- never expose one user's data to another user
- protect resume contents
- protect authentication data
- do not log passwords
- do not expose API secrets

---

# 56. SECURITY

Implement at least:

- password hashing
- JWT authentication
- protected APIs
- role-based authorization
- input validation
- upload validation
- safe temporary-file handling
- environment variables
- CORS configuration

Do not hard-code:

```text
database passwords
JWT secrets
API keys
```

---

# 57. TESTING

## Authentication

Test:

- valid registration
- duplicate email
- invalid password
- valid login
- invalid login
- protected routes

## Interview

Test:

- valid setup
- insufficient questions
- duplicate prevention
- completion
- interrupted session

## Audio

Test:

- microphone available
- microphone denied
- empty recording
- Whisper success
- Whisper failure

## NLP

Test:

- relevant answer
- irrelevant answer
- short answer
- incomplete answer
- good answer

## CV

Test:

- face detected
- no face
- poor lighting
- face movement
- camera denied

## Scoring

Test:

- score boundaries
- weight calculations
- missing metrics
- final normalization

## Integration

Test:

```text
Register
→ Login
→ Start interview
→ Answer
→ Process
→ Score
→ Next question
→ Complete
→ Dashboard
```

---

# 58. DEMO DATA

Create seed data so the application is immediately demonstrable.

Minimum:

```text
10 HR
10 Behavioral
10 AI/ML
10 Software Development
10 General Technical
```

Each should contain expected concepts/keywords where applicable.

---

# 59. UI REQUIREMENTS

The application should look professional enough for a college project demonstration.

## Login

Simple modern login.

## Dashboard

Cards:

```text
Interviews
Average Score
Best Score
Latest Score
```

## Interview Setup

Clean selection controls.

## Interview Screen

Must prominently display:

```text
Question
Question number / total
AI voice controls
Camera preview
Recording indicator
Submit Answer
```

## Processing

Show:

```text
Analyzing your response...
Transcribing...
Evaluating content...
Analyzing delivery...
Calculating score...
```

Do not freeze the interface.

## Results

Show score cards and actionable feedback.

---

# 60. NO REAL-TIME ANALYSIS

Do not implement live scoring.

During answering, only show:

```text
Recording...
```

After submission:

```text
Processing...
```

Then return the analysis.

This is mandatory for the MVP because of the 1-day/8GB CPU constraint.

---

# 61. BACKEND API PLAN

Recommended endpoints:

## Health

```text
GET /api/health
```

## Auth

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

## Questions

```text
GET    /api/questions
GET    /api/questions/{id}
POST   /api/questions
PUT    /api/questions/{id}
DELETE /api/questions/{id}
```

## Interviews

```text
POST /api/interviews
GET  /api/interviews
GET  /api/interviews/{id}
POST /api/interviews/{id}/submit-answer
POST /api/interviews/{id}/complete
```

## Evaluation

```text
POST /api/evaluate/audio
POST /api/evaluate/nlp
POST /api/evaluate/video
POST /api/evaluate/combined
```

## Resume

```text
POST /api/resume/upload
POST /api/resume/analyze
```

Exact endpoint organization may be adjusted if the implementation remains clean.

---

# 62. SCORING RESPONSE FORMAT

Use a consistent response.

Example:

```json
{
  "question_id": "123",
  "transcript": "Candidate answer...",
  "nlp": {
    "relevance": 85,
    "concept_coverage": 80,
    "completeness": 75,
    "clarity": 82,
    "grammar": 88,
    "fluency": 74,
    "content_score": 81
  },
  "cv": {
    "face_presence": 95,
    "eye_contact": 70,
    "movement_indicator": 78,
    "delivery_score": 74
  },
  "overall_score": 78,
  "strengths": [
    "Good relevance",
    "Strong concept coverage"
  ],
  "improvements": [
    "Improve eye-contact consistency",
    "Reduce filler words"
  ]
}
```

---

# 63. LIGHTWEIGHT AI FALLBACK STRATEGY

The application must remain usable even if a heavier AI component cannot run.

## Primary

Whisper tiny.

## NLP

Use lightweight deterministic/semantic methods.

## CV

Use MediaPipe/OpenCV.

## Fallback

If an optional model fails:

- return a clearly labeled unavailable metric
- calculate remaining valid metrics
- do NOT fabricate AI output

The final application should never pretend an unavailable analysis was performed.

---

# 64. PERFORMANCE TARGET

The goal is not research-grade model accuracy.

The goal is:

**A convincing, functional academic prototype demonstrating the complete AI pipeline.**

Prioritize:

```text
Reliability
>
End-to-end integration
>
Explainability
>
UI polish
>
Advanced AI complexity
```

---

# 65. TWO-PERSON WORK SPLIT

## Developer 1 — Frontend / Product

Responsible for:

- React setup
- routing
- login/register UI
- dashboard
- interview setup
- webcam/microphone interface
- question display
- voice-question UI
- results dashboard
- history
- styling

## Developer 2 — Backend / AI

Responsible for:

- FastAPI
- MongoDB
- authentication APIs
- question APIs
- interview APIs
- Whisper
- NLP
- CV
- scoring
- feedback
- resume processing

## Integration

Both developers coordinate around API contracts.

Define request/response schemas early.

---

# 66. ONE-DAY EXECUTION PLAN

## Hour 0–1

Both:

- initialize repository
- finalize architecture
- install dependencies
- create `.env`
- run React
- run FastAPI
- connect MongoDB

Developer 1:

- React layout
- routes

Developer 2:

- FastAPI structure
- database
- auth API

---

## Hour 1–3

Developer 1:

- login/register
- dashboard
- interview setup UI

Developer 2:

- authentication
- users
- question model
- question APIs
- seed questions

---

## Hour 3–5

Developer 1:

- interview screen
- camera
- microphone
- recording
- question UI
- speech synthesis

Developer 2:

- interview engine
- session creation
- answer endpoint
- Whisper integration

---

## Hour 5–7

Developer 1:

- processing UI
- results UI

Developer 2:

- NLP evaluation
- CV evaluation
- scoring engine

---

## Hour 7–9

Developer 1:

- dashboard analytics
- interview history
- UI polish

Developer 2:

- feedback engine
- resume extraction
- lightweight adaptive logic

---

## Hour 9–11

Both:

- full integration
- bug fixing
- test complete interview

---

## Hour 11–12

Both:

- prepare demo
- seed data verification
- fix critical bugs
- screenshots
- README
- explain architecture
- prepare viva explanation

If any feature is unstable at this point, simplify it rather than adding more features.

---

# 67. DEVELOPMENT MILESTONES

Use these exact milestones.

## M1

```text
React + FastAPI + MongoDB running
```

## M2

```text
Authentication working
```

## M3

```text
Question bank + interview flow working
```

## M4

```text
Audio recording + Whisper working
```

## M5

```text
NLP scoring working
```

## M6

```text
Webcam + CV scoring working
```

## M7

```text
Combined scoring + feedback working
```

## M8

```text
Final dashboard + history working
```

## M9

```text
Complete end-to-end demo working
```

---

# 68. AI CODING ASSISTANT OPERATING INSTRUCTIONS

You are the implementation AI for this project.

Follow these instructions strictly.

## 1. Inspect first

Before creating/modifying code:

- inspect the existing directory
- identify existing files
- identify installed dependencies
- do not overwrite working code blindly

## 2. Work milestone-by-milestone

Never generate an enormous codebase without verification.

Complete:

```text
M1
→ test
→ M2
→ test
→ M3
→ test
...
```

## 3. Explain changes

Before each milestone:

```text
Current milestone:
Goal:
Files to create:
Files to modify:
Dependencies:
Testing method:
```

After each milestone:

```text
Completed:
Tested:
Known issues:
Next milestone:
```

## 4. Do not invent functionality

If something is mocked, label it:

```text
TEMPORARY MOCK
```

Replace it before final demo.

## 5. Do not fabricate AI results

If Whisper/CV/NLP fails, return an error or unavailable metric.

Never silently return fake scores.

## 6. Keep dependencies minimal

Every new dependency must have a reason.

Avoid large libraries/models unless necessary.

## 7. Protect secrets

Use:

```text
.env
.env.example
```

Never commit secrets.

## 8. Make configuration easy

Important settings should be configurable:

```text
WHISPER_MODEL
MONGODB_URL
JWT_SECRET
QUESTION_COUNT
SCORING_WEIGHTS
```

## 9. Optimize for 8GB CPU

Do not introduce GPU-only assumptions.

## 10. Keep frontend/backend contracts stable

Whenever an API response changes, update both sides.

## 11. Test after every major feature

Do not wait until the end to discover integration failures.

---

# 69. VIVA/ACADEMIC EXPLANATION REQUIREMENTS

The final project must be explainable.

For each AI component, documentation should answer:

## Whisper

- What is speech-to-text?
- Why Whisper?
- Why the lightweight model?
- What is the input?
- What is the output?
- What are limitations?

## NLP

- How is relevance calculated?
- How are concepts identified?
- How is completeness calculated?
- How is fluency estimated?
- What limitations exist?

## Computer Vision

- How is the face detected?
- What are facial landmarks?
- How is eye contact estimated?
- How is movement measured?
- Why is this a behavioral indicator rather than proof of confidence?

## Scoring

- What metrics are used?
- What weights are used?
- Why?
- How are scores normalized?

---

# 70. PROJECT LIMITATIONS TO DOCUMENT

Be honest about limitations.

Examples:

1. Whisper accuracy depends on audio quality.
2. CPU-only processing may increase processing time.
3. Eye-contact estimation is an approximation.
4. Facial behavior does not directly reveal internal confidence.
5. Lighting/camera angle affects CV performance.
6. Accent/noise can affect transcription.
7. NLP scoring is not equivalent to human expert evaluation.
8. Resume personalization is lightweight.
9. Adaptive questioning is rule-based rather than a sophisticated autonomous interviewer.

These limitations make the project more academically defensible.

---

# 71. FUTURE SCOPE

Keep these as future enhancements unless time permits:

1. Multilingual interviews.
2. Regional-language support.
3. Advanced resume-based question generation.
4. Campus placement integration.
5. Gamified leaderboards.
6. Better semantic answer evaluation.
7. Advanced adaptive interviews.
8. Improved speech prosody analysis.
9. Better head-pose/gaze estimation.
10. Cloud deployment and scalable processing.

---

# 72. FINAL DEFINITION OF DONE

The MVP is complete when this works:

```text
✓ Register
✓ Login
✓ Dashboard
✓ Select interview
✓ Optional resume upload
✓ Question selection
✓ AI speaks question
✓ Webcam works
✓ Microphone works
✓ Candidate answers
✓ Candidate submits
✓ Whisper transcribes
✓ NLP evaluates
✓ CV evaluates
✓ Scoring engine calculates and stores results silently
✓ No feedback/scores are shown during the interview
✓ Next question works
✓ Approximately 10 questions can be completed
✓ ALL questions are completed before feedback appears
✓ Final score appears only after the complete interview
✓ Final feedback dashboard appears only after the complete interview
✓ History is saved
✓ Dashboard displays previous performance
✓ Admin can manage questions
✓ Critical errors are handled
✓ No fake AI results
✓ End-to-end demo works
```

---

# 73. FINAL INSTRUCTION

Build **InterviewSense** as a working, lightweight, AI-powered mock interview web application.

The primary goal is an end-to-end functioning demonstration within one day on an **8 GB RAM CPU-only computer**.

The interview must feel uninterrupted: **collect answers first, reveal evaluation afterward**.

Do not over-engineer.

Do not prioritize theoretical sophistication over a working application.

Do not train large models.

Do not use unnecessary infrastructure.

Do not generate fake AI outputs.

Build in milestones.

Test every milestone.

Keep the architecture clean enough that the project can later be extended.

**Start with M1: React + FastAPI + MongoDB foundation.**
