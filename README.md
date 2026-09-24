# MindVault — AI Personal Journal

> Write naturally. Understand yourself better. Find anything you've written.

MindVault is a private, intelligent journaling platform: write entries, track mood and
habits, and (in later phases) let AI summarize, analyze, and semantically search your
own journal — never anyone else's.

This repository implements **Phase 1 (Foundation)** through **Phase 5 (Productivity)** of
the roadmap below: authentication, journal CRUD, a rich text editor with image
attachments, calendar/timeline views, archive & trash, a full AI layer (entry analysis,
reflections, pattern insights, chat), embeddings-based semantic search, related memories,
"On This Day", goals, habits, and an analytics dashboard. **Voice journaling and
production hardening (testing, deployment, data export) are documented as future
considerations** rather than built — see [Future considerations](#future-considerations).

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [MongoDB schema overview](#mongodb-schema-overview)
- [AI architecture](#ai-architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Security](#security)
- [Roadmap](#roadmap)
- [Future considerations](#future-considerations)
- [License](#license)

## Features

Implemented:

- Email/password authentication with JWT access tokens + httpOnly refresh cookie
- Journal CRUD: create, edit, soft-delete (trash), archive, pin
- Rich text editor (TipTap) with headings, lists, quotes, code blocks, markdown-style shortcuts, and inline image uploads
- Mood selection (5-point scale) and free-form tags per entry
- Auto-save while writing, word count, reading time
- Dashboard with **real** computed stats: writing streak, entries this month, total words,
  recent entries, pinned entries — nothing here is hard-coded
- Full-text search across title + content, with tag/mood/type filters
- Calendar heatmap (GitHub-style, colored by entry count, mood emoji per day) and a
  chronological Timeline view grouped by month
- Archive page (restore an archived entry back into the main journal view) and Trash page
  (restore a soft-deleted entry, or permanently delete it)
- Image attachments: upload from the editor toolbar, stored on local disk in dev behind a
  storage abstraction that swaps cleanly to Cloudinary/S3 in production
- AI entry analysis: summary, themes, emotions, key events, positive moments, challenges,
  action items, and reflection questions for a single entry — grounded only in that entry's
  text, never a diagnosis
- AI daily / weekly / monthly reflections: on-demand summaries of your entries over a period
- AI-generated pattern insights across your recent entries, each with supporting entries you
  can open, a confidence level, and save/dismiss actions
- AI chat with your own journal: retrieval-scoped strictly to your entries (MongoDB text
  search, never another user's data), with every answer citing which entries it drew on
- Semantic search ("that time I was struggling with database design" style queries) backed
  by OpenAI embeddings, with a similarity-search layer designed to swap in MongoDB Atlas
  Vector Search later without touching any caller (see [AI architecture](#ai-architecture))
- Related Memories on every entry, and an "On This Day" widget on the dashboard surfacing
  entries from the same date in previous years
- Goals with milestones, progress tracking, and an AI "related journal entries" panel that
  reuses the same embeddings search with the goal's own text as the query
- Habits with daily check-ins, current/longest streak, and a 30-day consistency rate
- Analytics dashboard (Recharts): entries over time, mood trend, writing activity by day of
  week, most-used tags, mood distribution, and entry-type breakdown — filterable by range
  (7d/30d/3m/6m/1y/all) and computed from real aggregation queries, not sample data
- Strict per-user data isolation: every query is scoped by the authenticated user's id,
  never a client-supplied id
- Responsive layout (mobile drawer nav + desktop sidebar), light/dark aware design tokens

See [Future considerations](#future-considerations) for what's intentionally out of scope:
voice journaling, notifications, data export, and production hardening (test coverage,
accessibility pass, deployment).

## Tech stack

**Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, React Router, TanStack Query,
Framer Motion, Recharts (installed, wired up in Phase 5), Lucide icons, TipTap.

**Backend:** Node.js, Express, TypeScript, MongoDB + Mongoose, JWT auth, Zod validation,
Helmet, CORS, rate limiting.

**AI:** OpenAI API (`gpt-4o-mini` by default), called only from a dedicated backend service
layer behind a provider interface — never from the frontend, and never with more journal
content than a request actually needs.

## Architecture

```
mindvault/
├── backend/
│   └── src/
│       ├── config/       # env loading, MongoDB connection
│       ├── models/       # Mongoose schemas (User, JournalEntry, AiInsight, AiConversation,
│       │                 #   Embedding, Habit, Goal, ...)
│       ├── middleware/   # auth guard, error handler, validation, rate limiting
│       ├── services/
│       │   └── ai/       # provider abstraction, prompts/, summarization, insights, chat,
│       │                 #   embeddings, semantic search
│       ├── controllers/  # thin request/response glue, no business logic
│       ├── routes/       # Express routers
│       ├── validators/   # Zod schemas
│       └── utils/        # jwt, text stats, seed script
└── frontend/
    └── src/
        ├── api/          # typed API client functions
        ├── context/      # AuthContext (session state)
        ├── components/   # reusable UI (EntryCard, RichTextEditor, MoodBadge, ...)
        ├── layouts/       # AppLayout (sidebar/mobile nav)
        ├── pages/        # one component per route
        └── types/        # shared TypeScript types mirroring backend models
```

Business logic lives in `services/`, not in route handlers or controllers, so it stays
testable and reusable once the AI layer is added.

## MongoDB schema overview

**`users`** — name, email, passwordHash (bcrypt, `select: false` by default), timezone,
onboarding state, and a `preferences` sub-document (theme, default entry privacy, AI /
mood-tracking toggles).

**`journalEntries`** — the core document. Notable fields: `content` (rich HTML from the
editor) and `contentText` (derived plain text, used for the MongoDB text index and, later,
for AI context); `entryType`; `mood`; `tags`; `attachments` (embedded, since attachments
belong to their entry); `aiAnalysis` (embedded — cheap to read alongside the entry, no
separate collection needed for v1); `isPinned` / `isArchived` / `isDeleted` (soft-delete
into Trash); `wordCount` / `readingTime` (computed on save).

Indexes (see `JournalEntry.model.ts`) are built around the actual queries the API makes:
`userId + entryDate`, `userId + isPinned`, `userId + mood`, `userId + entryType`,
`userId + tags`, and a text index on `title` + `contentText` (also used as the retrieval
step for AI chat, see below).

**`aiinsights`** — one document per generated pattern insight: the insight text, the
entries that support it (referenced, not embedded, since an insight can point at many
entries and entries can independently gain new insights), a confidence level, and
`isDismissed` / `isSaved` flags for the Insights page.

**`aiconversations`** — one document per chat thread, with messages embedded directly
(spec section 37 lists separate `aiConversations`/`aiMessages` collections, but since a
message belongs entirely to its conversation and is never queried independently, embedding
them avoids an unnecessary join for every chat read).

**`embeddings`** — one document per journal entry: a vector (from OpenAI's embedding
model), the entry it belongs to, and which embedding model produced it (so re-embedding
after a model change is a simple filter). Kept as its own collection rather than embedded
on the entry itself, since vectors are large, are never needed when just reading an entry,
and would bloat every `journalEntries` read for a field only the search path touches.

**`habits`** — a habit's check-ins are stored as an array of `yyyy-mm-dd` strings directly
on the habit document rather than in a separate `habitLogs` collection (spec section 37
lists them separately). A check-in is a single boolean fact that belongs entirely to its
habit and is always read together with it, so embedding avoids an unnecessary collection
and join for what is, in practice, always a "read this habit's history" query.

**`goals`** — milestones are embedded as a Mongoose subdocument array (each with its own
`_id` so individual milestones can be toggled), since a milestone has no meaning outside
its goal and the spec's own example ("Goal progress: Portfolio 82%, Related journal
activity: 14 entries") treats them as part of the goal, not an independent resource.

Collections planned for later phases (notifications, weeklyReports, monthlyReports) are
described in the project spec but intentionally not created yet — see rule #19 in the
original brief: *"do not over-engineer simple features."* See
[Future considerations](#future-considerations).

## AI architecture

`backend/src/services/ai/` is structured so a different LLM provider can be substituted by
changing one file:

- `provider.ts` — the `AiProvider` interface (`complete({ system, user }) => string`)
- `openai.provider.ts` — the OpenAI implementation, called with `response_format: json_object`
- `ai.service.ts` — `generateStructured()`: asks the provider for JSON, parses it, and
  validates it against a Zod schema before any caller ever sees it. A malformed or
  hallucinated-shape response never reaches the database.
- `prompts/` — one file per feature (`entryAnalysis`, `reflection`, `insights`, `chat`),
  each exporting a prompt builder + its Zod schema. `prompts/safety.ts` holds the safety
  rules injected into every single prompt (see below).
- `summarization.service.ts`, `insight.service.ts`, `chat.service.ts` — the actual
  features, each scoping every database read to `userId` before any journal content is
  read, per spec section 41.
- `embeddings.service.ts` / `semanticSearch.service.ts` — see below.

**Safety (spec section 60).** Every AI prompt includes a shared instruction block that
tells the model to: never diagnose or claim certainty about someone's emotional state,
never act as a therapist or encourage dependency, never invent facts not present in the
provided journal text, and — if the provided text suggests a safety crisis — to gently
encourage the person to reach out to a trusted person or a crisis line instead of
proceeding with normal analysis.

**Chat retrieval (RAG, spec section 18/41).** `/api/ai/chat` retrieves context with
MongoDB's text index on `title` + `contentText`, scoped to `userId`, and falls back to the
person's most recent entries if the search finds nothing. (It intentionally still uses
text search rather than the embeddings below, since text search is cheaper per request and
chat questions tend to name concrete keywords; `/api/ai/search`, described next, is where
embeddings pay off.) Only the retrieved excerpts are sent to the model — never the whole
journal — and the response reports which entries it actually used so the UI can link back
to them.

**Semantic search & related memories (spec section 18, 20, 57).**
`embeddings.service.ts` embeds an entry's title + text with OpenAI's embedding model and
stores the vector in its own `embeddings` collection; entries are indexed automatically
(best-effort, non-blocking) whenever they're created or edited, and de-indexed on
permanent delete. `findSimilarEntryIds()` in that file is the one function a real vector
backend would replace: it currently loads a user's vectors and ranks them by in-memory
cosine similarity (see spec section 18 — *"If MongoDB Atlas Vector Search is available,
use it. Otherwise design a provider abstraction so vector search can be added cleanly"*).
This is fine at journal scale but is the first thing to swap for `$vectorSearch` if you
move to Atlas — every caller (`semanticSearch.service.ts`, used by `/api/ai/search`,
`/api/ai/related/:entryId`, and the Goals "related entries" feature) only depends on that
function's signature, not its implementation.

**Cost/rate limits.** `/api/ai/*` sits behind its own rate limiter (30 requests / 15 min
per IP) separate from the general API limiter, since these calls hit a paid third-party API.

## Getting started

### Prerequisites

- Node.js 20+
- A MongoDB instance (local `mongod`, or a free MongoDB Atlas cluster)

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env — at minimum set MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET
npm install
npm run seed     # optional: creates a demo user + sample entries
npm run dev       # starts the API on http://localhost:5000
```

Demo login after seeding: `demo@mindvault.dev` / `DemoPass123!` (development only —
never use these credentials outside a local environment).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`, so no CORS
configuration is needed locally beyond what's already in `backend/src/app.ts`.

### 3. Database setup

No manual schema setup is required — Mongoose creates collections and indexes on first
use. For a self-hosted MongoDB, just make sure `MONGODB_URI` in `backend/.env` points to
a reachable instance. For Atlas, use your cluster's connection string and make sure your
IP is allow-listed.

## Environment variables

See `backend/.env.example` for the full list. Never commit a real `.env` file.

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Sign access/refresh tokens — set real random values in production |
| `AI_PROVIDER` | Which AI provider to use (`openai` is the only one implemented) |
| `OPENAI_API_KEY` | Required for all `/api/ai/*` routes (chat completions and embeddings). Without it, they return `503 AI_NOT_CONFIGURED` rather than failing silently |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | Defaults to `text-embedding-3-small`; used for semantic search, related memories, and Goals' related-entries lookup |
| `CLOUDINARY_*` | Not yet used — image uploads currently write to `backend/uploads/` on local disk; see `services/upload.service.ts` |
| `CLIENT_URL` | Allowed CORS origin |

## API reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer
<accessToken>`.

**Auth**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password   (stubbed — needs email delivery wired up)
```

**Journal**
```
GET    /api/journal                 ?page&limit&tag&mood&entryType&pinned&archived&q
POST   /api/journal
GET    /api/journal/:id
PUT    /api/journal/:id
DELETE /api/journal/:id             (soft delete → trash)
PATCH  /api/journal/:id/archive
PATCH  /api/journal/:id/pin
PATCH  /api/journal/:id/restore     (restore from trash)
DELETE /api/journal/:id/permanent   (permanent delete)
GET    /api/journal/trash
GET    /api/journal/calendar        ?year&month
GET    /api/journal/timeline
GET    /api/journal/on-this-day
```

**Uploads**
```
POST   /api/uploads/image           (multipart/form-data, field name "image")
```

**AI** (rate limited separately — 30 req / 15 min)
```
POST   /api/ai/analyze/:entryId              # analyzes one entry, saves result on it
POST   /api/ai/daily-reflection    { date? }
POST   /api/ai/weekly-summary      { weekStart? }
POST   /api/ai/monthly-summary     { year?, month? }
POST   /api/ai/chat                { message, conversationId? }
GET    /api/ai/conversations
GET    /api/ai/conversations/:id
POST   /api/ai/generate-insights              # analyzes recent entries, creates AiInsight docs
GET    /api/ai/insights            ?includeDismissed
PATCH  /api/ai/insights/:id/dismiss
PATCH  /api/ai/insights/:id/save
GET    /api/ai/search              ?q          # semantic search over your own entries
GET    /api/ai/related/:entryId               # related memories for one entry
```

**Habits**
```
GET    /api/habits
POST   /api/habits
PUT    /api/habits/:id
DELETE /api/habits/:id
PATCH  /api/habits/:id/archive
POST   /api/habits/:id/check-in    { date? }  # toggles a check-in, defaults to today
```

**Goals**
```
GET    /api/goals                  ?status
POST   /api/goals
GET    /api/goals/:id
PUT    /api/goals/:id
DELETE /api/goals/:id
POST   /api/goals/:id/milestones
PATCH  /api/goals/:id/milestones/:milestoneId/toggle
GET    /api/goals/:id/related-entries         # AI semantic search using the goal's own text
```

**Analytics**
```
GET    /api/analytics/overview      # dashboard stats
GET    /api/analytics/mood          ?range      # mood trend, distribution, top tags, entry types
GET    /api/analytics/activity      ?range      # activity by day/hour, entries-over-time
```
`range` is one of `7d`, `30d`, `3m`, `6m`, `1y`, `all` (defaults to `30d`).

All responses follow `{ success, data }` or `{ success: false, message, errorCode }`.

## Testing

Backend: `npm test` (Jest is configured; no suites are written yet — see
[Future considerations](#future-considerations) for what to prioritize first).

## Security

- Passwords hashed with bcrypt (12 rounds), never logged, never returned by the API
- JWT access tokens are short-lived; refresh tokens live in an httpOnly, sameSite cookie
- Every journal query is scoped by the authenticated user's id server-side — a client can
  never read or modify another user's data by guessing an id
- Helmet, CORS allow-list, per-IP rate limiting, and a 2MB request body cap are enabled
  by default
- Request bodies (which may contain journal content) are never written to server logs
- AI responses are validated against a Zod schema before being saved or returned — a
  malformed provider response fails loudly (`502 AI_INVALID_RESPONSE`) instead of silently
  writing garbage to an entry
- AI chat retrieval is scoped by `userId` at the database query level, before any journal
  text is ever included in a prompt — there is no code path where one user's chat can pull
  another user's entries

## Roadmap

Following the phased plan from the original spec — Phases 1 through 5 are done:

- **Phase 1 (done):** project setup, auth, dashboard, journal CRUD, rich text editor
- **Phase 2 (done):** tags, full-text search, calendar heatmap, timeline view, archive/trash with restore, image attachments
- **Phase 3 (done):** AI entry analysis, daily/weekly/monthly AI reflections, pattern insights, AI chat with your journal
- **Phase 4 (done):** embeddings + semantic search, related memories, "On This Day"
- **Phase 5 (done):** goals with milestones, habits with streaks, Recharts analytics dashboard

## Future considerations

These were part of the original spec but are out of scope for this build. Each is written
up here as a starting point rather than left unmentioned:

**Voice journaling (spec Phase 6).** Would need: a `POST /api/voice/upload` endpoint
accepting audio (reusing the `upload.service.ts` abstraction already built for images), a
speech-to-text call (OpenAI's `whisper` or `gpt-4o-transcribe` fit the existing
`services/ai/` provider pattern), and a new `entryType: "voice"` flow that creates a
journal entry from the transcript and runs it through the existing `analyzeEntry()` path
unchanged. The audio player UI and recording UI are the only genuinely new frontend work;
everything else is reuse.

**Image-memory AI descriptions (spec section 24).** Auto-generating a caption/tags for an
uploaded image would slot into `upload.service.ts` as a post-upload hook calling a vision
model — not built here to avoid an extra paid API call on every image upload by default.

**Notifications (spec section 36).** No email/push infrastructure exists in this build.
Reminders, weekly-summary-ready alerts, etc. would need a job scheduler (e.g. `node-cron`
or a proper queue) and an email provider, which is meaningfully new infrastructure rather
than an extension of existing services.

**Data export (spec section 33).** Straightforward to add — a `GET /api/export/json` (and
markdown/PDF variants) that reuses the existing ownership-scoped `journal.service.ts`
queries and the `pdf`/`docx`-style generation approach already used elsewhere in this
project's tooling. Left out only because it's pure plumbing with no architectural
decisions left to make.

**Persisted weekly/monthly report history.** `/api/ai/weekly-summary` and
`/api/ai/monthly-summary` currently generate on demand rather than being saved, so there's
no "past reports" list. Adding `weeklyReports`/`monthlyReports` collections (as spec
section 37 lists) and a small cron job to pre-generate them is a natural next step once
reflections are used regularly enough to want history.

**Production hardening (spec Phase 7).** No automated test suite yet (Jest is configured
and ready — auth, journal CRUD, and especially the cross-user authorization boundary
described in [Security](#security) are the highest-value first tests to write), no CI,
no accessibility audit beyond the semantic HTML and focus states already in place, and no
deployment configuration (Dockerfile, hosting docs) — this repo is meant to be run locally
per [Getting started](#getting-started).

## License

MIT — this is a portfolio/demo project scaffold, not a hosted product.
