# Teacher Efficancy Tool

A coaching and evaluation platform for Teach For Armenia, built for three
roles:

- **Teacher** – writes daily reflections (typed or voice-to-text) and
  receives AI-generated coaching feedback.
- **LDM** (Learning & Development Manager) – records lesson observations,
  scores teachers against a competency framework, tracks competency trends
  over time, and reviews an AI-generated "diary" summarizing each
  teacher's recent growth.
- **Admin** – manages user accounts, roles, and LDM-to-teacher
  assignments.

## Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT auth, Google
  Gemini (`@google/genai`) for AI feedback/summaries, PDFKit for exportable
  reports.
- **Frontend**: React + Vite, React Router, Axios. Voice input uses the
  browser's built-in Web Speech API (Chrome/Edge; gracefully disabled
  elsewhere).

## Project structure

```
backend/
  config/        Mongo connection
  models/        User, TeacherReflection, LessonObservation,
                  CompetencyEvaluation, DailyNote
  middlewares/   JWT auth + role-based access control
  controllers/   Route handlers per role (+ AI)
  services/      Gemini AI wrapper, PDF report generator
  utils/         Score averaging / trend math
  routes/        /api/auth, /api/teacher, /api/ldm, /api/admin, /api/ai
frontend/
  src/pages/             Login, Register, and per-role dashboards
  src/components/UI/     PdfExportButton, VoiceToTextButton
  src/components/Layout/ Navbar, ProtectedRoute
  src/context/           AuthContext (JWT session state)
  src/api/               Axios client
```

## Setup

### Backend

```
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm install
npm run dev             # or: npm start
```

The API runs on `http://localhost:5000` by default. AI features
(`/api/ai/...`) work without `GEMINI_API_KEY` set, but return a placeholder
string instead of real AI output until a key is provided.

### Frontend

```
cd frontend
cp .env.example .env   # set VITE_API_URL if not using the default proxy
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api` requests
to `http://localhost:5000`.

### First admin account

There's no seed script yet, so the very first account must be promoted
manually. Register a normal account from the app (it will default to the
`teacher` role), then in `mongosh` run:

```js
use teacher-efficancy-tool
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

From there, use the Admin → User Management screen to create/promote
further accounts and assign teachers to LDMs.

## API overview

| Route | Who | Purpose |
|---|---|---|
| `POST /api/auth/register`, `/login`, `GET /me` | anyone / logged-in | account creation & session |
| `GET/POST /api/teacher/reflections` | teacher | daily reflections |
| `GET /api/teacher/observations`, `/evaluations` | teacher | read-only view of their own records |
| `GET /api/ldm/teachers` | ldm/admin | roster of assigned teachers |
| `POST/GET /api/ldm/observations`, `GET .../:id/pdf` | ldm/admin | lesson observations + PDF export |
| `POST/GET /api/ldm/evaluations`, `GET .../matrix`, `GET .../:id/pdf` | ldm/admin | competency evaluations, matrix view, PDF export |
| `POST/GET /api/ldm/notes` | ldm/admin | quick notes about a teacher |
| `GET/POST/PATCH/DELETE /api/admin/users` | admin | user management |
| `POST /api/ai/reflections/:id/feedback` | owner / ldm / admin | AI feedback on one reflection |
| `POST/GET /api/ai/diary` | ldm/admin | generate/view AI diary summaries |
