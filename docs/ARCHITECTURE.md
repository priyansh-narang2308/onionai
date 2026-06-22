# 🏗️ OnionAI - Complete Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OnionAI - Complete System                          │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────┐
                    │      CLIENT APPLICATIONS         │
                    └──────────┬───────────┬────────────┘
                               │           │
                ┌──────────────▼─┐  ┌────▼───────────┐
                │   Web App      │  │  Mobile App    │
                │   (Next.js)    │  │  (Expo/RN)     │
                │   React 19     │  │  React Native  │
                └────────┬───────┘  └────┬────────────┘
                         │               │
                         └───────┬───────┘
                                 │
                    ┌────────────▼──────────────┐
                    │   Authentication         │
                    │   (Clerk + JWT)          │
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │   API Gateway (Next.js)  │
                    └────────────┬──────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   ┌────▼────────┐  ┌───────────▼───────────┐  ┌─────────▼──────┐
   │  Database   │  │  Job Queue (Inngest) │  │  External APIs │
   │  (InsForge) │  │  Publishing Pipeline │  │  (8 Platforms) │
   │  PostgreSQL │  │  Cron: Every 10 min  │  │                │
   │  with RLS   │  └───────────────────────┘  │ Twitter/X      │
   └─────────────┘                             │ LinkedIn       │
                                                │ Instagram      │
                                                │ Facebook       │
        ┌───────────────────────┐              │ Threads        │
        │   Graph Database      │              │ Bluesky        │
        │   (Neo4j)             │              │ YouTube        │
        │   Relationships       │              │ TikTok         │
        └───────────────────────┘              └────────────────┘

        ┌──────────────────┐
        │  AI Services     │
        │  Gemini 2.5      │
        │  Sarvam AI       │
        └──────────────────┘

        ┌──────────────────┐
        │  Storage         │
        │  (S3/InsForge)   │
        │  Images & Files  │
        └──────────────────┘
```

---

## Data Flow: Creating & Publishing a Post

```
┌───────────────────────────────────────────────────────────────────┐
│  USER CREATES POST                                                 │
└───────────┬───────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────────┐
│  Web App: /schedule                                                │
│  - Enter content                                                   │
│  - Select 1-8 channels                                            │
│  - Upload images                                                  │
│  - Set scheduled_at time (future)                                │
│  - Click "Schedule"                                               │
└───────────┬───────────────────────────────────────────────────────┘
            │
            ▼ POST /api/post
┌───────────────────────────────────────────────────────────────────┐
│  Next.js API Route: POST /api/post                                │
│  1. Validate request + JWT                                        │
│  2. Check user has permission                                     │
│  3. Upload images to InsForge Storage                            │
│  4. Save post to database: status='draft'                        │
│  5. Return post ID                                                │
└───────────┬───────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────────┐
│  Database (InsForge PostgreSQL)                                   │
│  INSERT INTO scheduled_posts (                                    │
│    user_id, content, channel_ids, images,                        │
│    scheduled_at, status                                          │
│  ) VALUES (...)                                                   │
│  ✅ Post saved with status='draft'                               │
└───────────┬───────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────────┐
│  User confirms post                                                │
│  - Clicks "Confirm & Schedule"                                   │
│  - Backend updates: status='queue'                               │
│  - Post moves to publishing queue                                │
└───────────┬───────────────────────────────────────────────────────┘
            │
            ▼ [Every 10 minutes...]
┌───────────────────────────────────────────────────────────────────┐
│  Inngest Cron Job: publishScheduledPostsCron                      │
│  Trigger: */10 * * * *                                           │
│  1. Query posts: status='queue' AND scheduled_at <= now()        │
│  2. For each post, emit post/publish.requested event             │
│  3. Inngest dispatches to publishScheduledPost function          │
└───────────┬───────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────────────┐
│  publishScheduledPost Function                                    │
│  1. Load post from database                                       │
│  2. For each selected channel:                                   │
│     - Get user's OAuth token from database                       │
│     - Decrypt token (AES-256-GCM)                                │
│     - Check expiration                                            │
│     - Auto-refresh if needed                                      │
└───────────┬───────────────────────────────────────────────────────┘
            │
            ▼ [Route based on platform]
    ┌───────┴─────────┬─────────────────────────────┐
    │                 │                             │
    ▼                 ▼                             ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐
│Twitter      │  │LinkedIn      │  │Instagram               │
│1. Upload    │  │1. Upload     │  │1. Create image object  │
│   images to │  │   images     │  │   (via Graph API)      │
│   Twitter   │  │   (LinkedIn) │  │2. Publish (Graph API)  │
│   Media API │  │2. Create     │  │3. Extract URL          │
│2. Create    │  │   post with  │  │                        │
│   tweet with│  │   image URN  │  │                        │
│   media_ids │  │3. Extract    │  │                        │
│3. Extract   │  │   URL        │  │                        │
│   URL       │  └──────────────┘  └─────────────────────────┘
└─────────────┘
    │                                       │
    ▼                 (similar for Facebook, Threads, Bluesky, YouTube, TikTok)

           ┌──────────────────────────────────┐
           │  Update Post in Database         │
           │  status='published'              │
           │  published_at=now()              │
           │  published_urls={                │
           │    twitter: 'https://...',       │
           │    linkedin: 'https://...',      │
           │    ...                           │
           │  }                               │
           └──────────────────────────────────┘

           ┌──────────────────────────────────┐
           │  Sync to Neo4j (if enabled)      │
           │  Create Post node                │
           │  Create PUBLISHED_TO relationships
           │  Create INSPIRED_BY if from idea │
           └──────────────────────────────────┘

           ✅ POST LIVE ON ALL 8 PLATFORMS!
```

---

## Authentication & OAuth Flow

```
┌──────────────────────────────────────────────────────────────┐
│  User clicks "Connect Twitter"                               │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  GET /api/channel/connect?platform=twitter                  │
│  1. Generate OAuth state (random)                           │
│  2. Generate PKCE challenge                                 │
│  3. Save to HTTP-only cookie                                │
│  4. Redirect to Twitter: /oauth2/authorize                  │
│     Params:                                                  │
│     - client_id                                             │
│     - redirect_uri                                          │
│     - scope: tweet.read,tweet.write,etc                    │
│     - code_challenge (PKCE)                                │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
         [User authorizes on Twitter.com]
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  GET /api/channel/callback?code=...&state=...              │
│  1. Validate state matches (CSRF protection)                │
│  2. Exchange code for access_token using PKCE verifier     │
│  3. Call Twitter API with token to get user info           │
│  4. Encrypt token: AES-256-GCM                              │
│  5. Save to database:                                       │
│     INSERT INTO user_channels (                             │
│       user_id, platform, token (encrypted), expires_at     │
│     ) VALUES (...)                                          │
│  6. Redirect to /dashboard/settings#channels               │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
        ✅ Channel Connected!
        Display: "@user_handle - Twitter"
```

---

## Database Schema with RLS

```
┌─────────────────────────────────────────────────────────┐
│ user_channels - OAuth Credentials (Encrypted)          │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                 │
│ user_id (FK → auth.users)                             │
│ platform (twitter|linkedin|instagram|...)             │
│ account_name (@user, profile URL, etc)                │
│ account_id (platform-specific ID)                     │
│ token (ENCRYPTED with AES-256-GCM)                    │
│ refresh_token (ENCRYPTED, if applicable)              │
│ expires_at (ISO timestamp)                            │
│ connected_at (ISO timestamp)                          │
│ updated_at (ISO timestamp)                            │
│                                                        │
│ RLS: CREATE POLICY user_isolation                     │
│      FOR ALL USING (user_id = auth.uid())            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ scheduled_posts - Post Queue                            │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                 │
│ user_id (FK → auth.users)                             │
│ title (text)                                            │
│ content (text)                                          │
│ channels (ARRAY of channel IDs)                        │
│ images (JSONB array of {url, alt_text})               │
│ status (draft|queue|published|failed)                 │
│ scheduled_at (ISO timestamp)                           │
│ published_at (ISO timestamp, nullable)                │
│ published_urls (JSONB {twitter: url, ...})            │
│ error_message (text, nullable)                        │
│ metadata (JSONB {idea_id, tags, etc})                 │
│ created_at (ISO timestamp)                            │
│ updated_at (ISO timestamp)                            │
│                                                        │
│ RLS: CREATE POLICY user_isolation                     │
│      FOR ALL USING (user_id = auth.uid())            │
│                                                        │
│ INDEXES:                                               │
│  - (user_id, status)                                  │
│  - (scheduled_at)                                      │
│  - (status) WHERE status='queue'                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ideas - Content Ideas (Kanban)                          │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                 │
│ user_id (FK → auth.users)                             │
│ title (text)                                            │
│ description (text)                                      │
│ group_id (FK → idea_groups)                           │
│ tags (ARRAY of strings)                                │
│ created_at (ISO timestamp)                            │
│ updated_at (ISO timestamp)                            │
│                                                        │
│ RLS: CREATE POLICY user_isolation                     │
│      FOR ALL USING (user_id = auth.uid())            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ idea_groups - Kanban Columns                            │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                 │
│ user_id (FK → auth.users)                             │
│ group_name (unassigned|todo|in_progress|done)        │
│ position (integer for ordering)                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ subscriptions - Billing                                 │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                 │
│ user_id (FK → auth.users, UNIQUE)                     │
│ plan_id (free|pro|premium)                            │
│ status (active|cancelled|expired)                      │
│ current_period_start (ISO timestamp)                   │
│ current_period_end (ISO timestamp)                     │
│ created_at (ISO timestamp)                            │
│ updated_at (ISO timestamp)                            │
│                                                        │
│ RLS: CREATE POLICY user_isolation                     │
│      FOR ALL USING (user_id = auth.uid())            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ channel_types - Platform Lookup (No RLS)               │
├─────────────────────────────────────────────────────────┤
│ id (PK) [twitter, linkedin, instagram, facebook,       │
│           threads, bluesky, youtube, tiktok]           │
│ name (display name)                                     │
│ icon (icon name for UI)                                │
│ color (hex color for UI)                               │
│ oauth_config (JSONB)                                    │
│ created_at                                              │
└─────────────────────────────────────────────────────────┘
```

---

## Neo4j Graph Structure

```
NODE TYPES:
  • Idea {id, title, description, user_id, created_at}
  • Post {id, title, status, published_at, user_id}
  • Channel {id, platform, account_name}
  • PlatformType {id, name}

RELATIONSHIPS:
  • Idea -> [INSPIRED_BY] -> Idea
  • Idea -> [PUBLISHED_TO] -> Channel
  • Post -> [PUBLISHED_TO] -> Channel
  • Channel -> [IS_TYPE] -> PlatformType
  • User -> [CREATED] -> Idea
  • User -> [CREATED] -> Post

EXAMPLE GRAPH:
  (User)
    |
    ├─ [CREATED] → (Idea: "Q4 Campaign")
    |               |
    |               ├─ [INSPIRED_BY] → (Idea: "Product Launch")
    |               |
    |               └─ [PUBLISHED_TO] → (Channel: @twitter)
    |                                     |
    |                                     └─ [IS_TYPE] → (PlatformType: Twitter)
    |
    └─ [CREATED] → (Post: "Amazing update!")
                    |
                    ├─ [PUBLISHED_TO] → (Channel: @twitter)
                    ├─ [PUBLISHED_TO] → (Channel: @linkedin)
                    └─ [PUBLISHED_TO] → (Channel: @instagram)
```

---

## Error Handling Flow

```
┌──────────────────────────────────┐
│  Platform API Returns Error      │
│  (4xx or 5xx response)           │
└───────────┬──────────────────────┘
            │
            ▼
┌──────────────────────────────────┐
│  lib/error-handler.ts            │
│  1. Extract error code/message   │
│  2. Map to AppError              │
│  3. Add context info             │
└───────────┬──────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  Platform-Specific Error Handling        │
│                                          │
│  Twitter: 429 → Rate Limited             │
│  LinkedIn: 401 → Token Expired           │
│  Instagram: 400 → Invalid Parameter      │
│  etc.                                    │
└───────────┬──────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  Update Post in Database                 │
│  status='failed'                         │
│  error_message='{user-friendly message}' │
└───────────┬──────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  User Sees Error in UI                   │
│  Can retry or reconnect channel          │
│  Can view error details                  │
└──────────────────────────────────────────┘
```

---

## Deployment Architecture

```
PRODUCTION DEPLOYMENT:

┌──────────────────────────────────────────────────────────┐
│  Vercel Edge Network (Global CDN)                        │
│  - Web app deployed                                      │
│  - Next.js serverless functions                         │
│  - API routes auto-scaled                               │
│  - SSL/TLS terminated                                   │
└────────────┬─────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌──────────────┐  ┌──────────────────────┐
│Database      │  │Inngest Cloud         │
│(InsForge     │  │(Background Jobs)     │
│PostgreSQL)   │  │                      │
│Multi-region  │  │Runs publishing jobs  │
│Backups auto  │  │Webhooks to APIs      │
└──────────────┘  └──────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  External Services (OAuth)                               │
│  - Twitter OAuth Endpoints                              │
│  - LinkedIn OAuth Endpoints                             │
│  - Instagram OAuth Endpoints                            │
│  - Facebook OAuth Endpoints                             │
│  - Threads OAuth Endpoints                              │
│  - Bluesky OAuth Endpoints                              │
│  - YouTube OAuth Endpoints                              │
│  - TikTok OAuth Endpoints                               │
└──────────────────────────────────────────────────────────┘

MOBILE DEPLOYMENT:

┌──────────────────────────────────────────────────────────┐
│  App Store / Play Store                                  │
│  - iOS app distributed                                  │
│  - Android app distributed                              │
│  - Expo for build management                            │
│  - Auto-updates enabled                                 │
└──────────────────────────────────────────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │  Same Backend APIs     │
    │  (Vercel endpoints)    │
    │  Shared database       │
    │  Shared Inngest jobs   │
    └────────────────────────┘
```

---

## Technology Stack

```
FRONTEND:
  • Next.js 16 (App Router, Server Components)
  • React 19
  • React Native (Expo ~55.0)
  • TypeScript 5+
  • Tailwind CSS 3
  • ShadcN UI (components)
  • Clerk (authentication)
  • React Query (data fetching)

BACKEND:
  • Next.js API Routes
  • TypeScript
  • Inngest (job queue)
  • Node.js 18+

DATABASE:
  • InsForge (PostgreSQL)
  • Neo4j (graph DB)
  • Row-Level Security (RLS)

EXTERNAL SERVICES:
  • Clerk (auth)
  • Inngest (jobs)
  • Neo4j Aura (graph)
  • InsForge (database)
  • Google Gemini API (AI)
  • Sarvam AI (translation)

DEPLOYMENT:
  • Vercel (web)
  • Expo (mobile)
  • GitHub (version control)
  • Inngest Cloud (jobs)

SECURITY:
  • AES-256-GCM (encryption)
  • PKCE (OAuth)
  • JWT (tokens)
  • RLS (database)
  • HTTPS/TLS (transport)
```

---

## Performance & Scaling

```
SCALING TIERS:

TIER 1: 0-1,000 Users
  - Single Vercel instance
  - Shared Neo4j (2GB)
  - Standard InsForge tier
  - Cron: Every 10 minutes

TIER 2: 1,000-10,000 Users
  - Multiple Vercel regions
  - Dedicated Neo4j instance
  - InsForge with read replicas
  - Cron: Every 5 minutes

TIER 3: 10,000+ Users
  - Global edge functions
  - Neo4j cluster
  - Multi-region databases
  - Sharded job queue
  - Cron: Per-user scheduling

OPTIMIZATION:
  ✓ Database indexes on user_id, status, scheduled_at
  ✓ Query result caching (React Query, ISR)
  ✓ CDN caching (Vercel Edge)
  ✓ Image optimization (Next.js Image)
  ✓ Code splitting (automatic)
  ✓ Lazy loading (components, routes)
  ✓ Parallel publishing (concurrent posts)
```

---

**For detailed API endpoints, see [docs/API.md](docs/API.md)**

**For deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**
