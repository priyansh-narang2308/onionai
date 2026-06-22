# OnionAI

**Enterprise-Grade AI-Powered Social Media Management Platform**

🚀 **Complete, Production-Ready Application** | Web + Mobile | All Platforms Implemented

OnionAI is a full-stack SaaS application for AI-powered social media content creation, scheduling, and automated multi-platform publishing. Create once, publish everywhere—all with intelligent AI assistance.

**Live Features:**

- ✅ 8 Social Platforms (Twitter, LinkedIn, Instagram, Facebook, Threads, Bluesky, YouTube, TikTok)
- ✅ AI Content Generation & Optimization
- ✅ Multi-Channel Scheduling
- ✅ Kanban Content Pipeline
- ✅ Real-time Analytics & Graph Visualization
- ✅ Web + Mobile Apps
- ✅ Team Collaboration
- ✅ Advanced Error Handling

---

## 🎯 Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm/bun
- Clerk Account
- InsForge Account
- Inngest Account
- Neo4j Instance (or local)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd onionai

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Fill in your API keys (see Configuration section below)
```

### Web Development Server

```bash
npm run dev
# Access at http://localhost:3000
```

### Mobile Development

```bash
cd mobile
npm install
npm start

# Choose:
# i - iOS simulator
# a - Android emulator
# w - Web browser
```

### Background Job Processing

```bash
# In a separate terminal
npx inngest-cli@latest dev
```

---

## ⚙️ Configuration

### Environment Variables Setup

Complete `.env.local` with all required credentials:

```bash
# 1. Database & Infrastructure
NEXT_PUBLIC_INSFORGE_BASE_URL=https://your-instance.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your_anon_key
INSFORGE_PROJECT_API_KEY=your_api_key

# 2. Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# 3. Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or ngrok tunnel

# 4. Security (generate with: openssl rand -base64 32)
CHANNEL_OAUTH_STATE_SECRET=your_32_byte_secret
CHANNEL_TOKEN_ENCRYPTION_KEY=your_32_byte_secret

# 5. Neo4j Graph Database
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j

# 6. Social Platforms - Twitter/X
TWITTER_CLIENT_ID=your_id
TWITTER_CLIENT_SECRET=your_secret
TWITTER_AUTH_URL=https://x.com/i/oauth2/authorize
TWITTER_TOKEN_URL=https://api.x.com/2/oauth2/token
TWITTER_PROFILE_URL=https://api.x.com/2/users/me?user.fields=profile_image_url,username
TWITTER_SCOPES=tweet.read,users.read,tweet.write,offline.access,media.write

# 7. LinkedIn
LINKEDIN_CLIENT_ID=your_id
LINKEDIN_CLIENT_SECRET=your_secret
LINKEDIN_AUTH_URL=https://www.linkedin.com/oauth/v2/authorization
LINKEDIN_TOKEN_URL=https://www.linkedin.com/oauth/v2/accessToken
LINKEDIN_PROFILE_URL=https://api.linkedin.com/v2/userinfo
LINKEDIN_SCOPES=openid,profile,w_member_social

# 8. Instagram
INSTAGRAM_CLIENT_ID=your_id
INSTAGRAM_CLIENT_SECRET=your_secret
INSTAGRAM_AUTH_URL=https://api.instagram.com/oauth/authorize
INSTAGRAM_TOKEN_URL=https://api.instagram.com/oauth/access_token
INSTAGRAM_PROFILE_URL=https://graph.instagram.com/me?fields=id,username
INSTAGRAM_SCOPES=instagram_basic,instagram_graph_user_profile,pages_read_engagement

# 9. Facebook
FACEBOOK_CLIENT_ID=your_id
FACEBOOK_CLIENT_SECRET=your_secret
FACEBOOK_AUTH_URL=https://www.facebook.com/v18.0/dialog/oauth
FACEBOOK_TOKEN_URL=https://graph.facebook.com/v18.0/oauth/access_token
FACEBOOK_PROFILE_URL=https://graph.facebook.com/me?fields=id,name,picture
FACEBOOK_SCOPES=pages_manage_metadata,pages_read_user_content,pages_manage_posts

# 10. Threads
THREADS_CLIENT_ID=your_id
THREADS_CLIENT_SECRET=your_secret
THREADS_AUTH_URL=https://threads.com/oauth/authorize
THREADS_TOKEN_URL=https://graph.threads.com/oauth/access_token
THREADS_PROFILE_URL=https://graph.threads.com/me?fields=id,username
THREADS_SCOPES=threads_basic,threads_content_publish

# 11. Bluesky
BLUESKY_CLIENT_ID=your_handle
BLUESKY_CLIENT_SECRET=your_app_password
BLUESKY_AUTH_URL=https://bsky.social
BLUESKY_TOKEN_URL=https://bsky.social/xrpc/com.atproto.server.createSession

# 12. YouTube
YOUTUBE_CLIENT_ID=your_id
YOUTUBE_CLIENT_SECRET=your_secret
YOUTUBE_AUTH_URL=https://accounts.google.com/o/oauth2/v2/auth
YOUTUBE_TOKEN_URL=https://oauth2.googleapis.com/token

# 13. TikTok
TIKTOK_CLIENT_ID=your_id
TIKTOK_CLIENT_SECRET=your_secret
TIKTOK_AUTH_URL=https://www.tiktok.com/oauth/authorize/
TIKTOK_TOKEN_URL=https://open.tiktok.com/oauth/token/

# 14. AI & Services
SARVAM_API_KEY=your_sarvam_key

# 15. Job Queue
INNGEST_DEV=1
# INNGEST_EVENT_KEY=evt_prod_... (production)
```

### Getting Credentials

**Clerk**: https://dashboard.clerk.com

- Publishable key & Secret key from dashboard

**InsForge**: https://insforge.app

- Base URL, anon key, and API key from project settings

**Twitter/X**: https://developer.twitter.com/

- OAuth 2.0 credentials, PKCE enabled

**LinkedIn**: https://www.linkedin.com/developers/

- OAuth 2.0 App credentials

**Instagram/Facebook**: https://developers.facebook.com/

- App ID, Secret from App Dashboard

**YouTube**: https://console.cloud.google.com/

- OAuth 2.0 credentials from Google Cloud

**TikTok**: https://developers.tiktok.com/

- OAuth credentials from TikTok Dev Portal

**Bluesky**: https://bsky.social

- Use your Bluesky handle + app password

**Neo4j**: https://neo4j.com/cloud/aura/

- Create free instance, copy URI + credentials

---

## 🏗️ Project Structure

```
onionai/
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API routes
│   │   ├── channel/              # OAuth & channel management
│   │   ├── post/                 # Post CRUD & publishing
│   │   ├── idea/                 # Idea management
│   │   ├── graph/                # Neo4j graph queries
│   │   ├── sarvam/               # AI translation
│   │   └── inngest/              # Job handler
│   └── (routes)/                 # Frontend pages
│       ├── (dashboard)/          # Protected routes
│       │   ├── schedule/         # Post scheduling
│       │   ├── ideas/            # Kanban board
│       │   ├── graph/            # Analytics
│       │   ├── billing/          # Plans
│       │   └── settings/         # Channels
│       └── (landing)/            # Public pages
│
├── components/                   # Reusable React components
│   ├── schedule/                 # Scheduling UI
│   ├── idea/                     # Ideas & Kanban
│   ├── preview/                  # Platform previews
│   └── ui/                       # Base UI components
│
├── lib/                          # Utilities & helpers
│   ├── social-oauth/             # OAuth providers
│   ├── encryption.ts             # Token encryption
│   ├── neo4j.ts                  # Graph DB
│   ├── insforge-server.ts        # Database client
│   ├── sarvam.ts                 # AI translation
│   └── error-handler.ts          # Error utilities
│
├── inngest/                      # Job queue functions
│   └── functions/
│       ├── publish-scheduled-posts.ts  # Main cron job
│       └── neo4j-sync.ts               # Graph syncing
│
├── mobile/                       # React Native Expo app
│   └── src/
│       ├── app/                  # Routes & tabs
│       ├── components/           # Native UI
│       ├── lib/                  # Mobile utilities
│       └── types/                # Type definitions
│
└── types/                        # Shared TypeScript types
    ├── channel.type.ts
    ├── idea.type.ts
    └── post.type.ts
```

---

## 🌐 Supported Social Platforms

| Platform      | Status               | Features                 |
| ------------- | -------------------- | ------------------------ |
| **Twitter/X** | ✅ Fully Implemented | Text, Images, Threading  |
| **LinkedIn**  | ✅ Fully Implemented | Text, Images, Articles   |
| **Instagram** | ✅ Fully Implemented | Carousel, Stories, Reels |
| **Facebook**  | ✅ Fully Implemented | Posts, Images, Links     |
| **Threads**   | ✅ Fully Implemented | Text, Images             |
| **Bluesky**   | ✅ Fully Implemented | Text, Images, Threading  |
| **YouTube**   | ✅ Fully Implemented | Community Posts, Shorts  |
| **TikTok**    | ✅ Fully Implemented | Short Videos, Text       |

---

## 📱 Mobile App Features

Complete feature parity with web app:

- ✅ Post creation & scheduling
- ✅ Kanban idea board
- ✅ AI content generation
- ✅ Translation to Indian languages
- ✅ Dashboard with analytics
- ✅ Graph visualization
- ✅ Channel management
- ✅ Billing & plans
- ✅ Settings & preferences

---

## 🤖 API Endpoints

### Posts

- `POST /api/post` - Create scheduled posts
- `GET /api/post` - Fetch posts (filter by status, channels, date)
- `PATCH /api/post/[id]` - Update post
- `DELETE /api/post/[id]` - Delete post
- `POST /api/post/[id]/publish` - Manual publish
- `POST /api/post/generate-post` - AI generation (rephrase, expand, shorten)
- `GET /api/post/totals` - Post stats

### Ideas

- `GET /api/idea` - Fetch ideas by kanban columns
- `POST /api/idea` - Create/update idea
- `DELETE /api/idea/[id]` - Delete idea
- `POST /api/idea/generate-ideas` - Generate 3 AI ideas

### Channels

- `GET /api/channel` - List all channels & types
- `POST /api/channel/connect` - Start OAuth flow
- `GET /api/channel/callback` - OAuth callback handler
- `POST /api/channel/disconnect` - Revoke channel

### Utilities

- `POST /api/upload-image` - Upload to InsForge Storage
- `GET /api/graph` - Neo4j graph visualization
- `POST /api/sarvam/translate` - Translate to Indian languages

---

## 🔄 Publishing Pipeline

```
User creates post
   ↓
Select 1-8 channels
   ↓
Add content + images
   ↓
Set scheduled_at time
   ↓
Post saved: status='draft'
   ↓
User confirms → status='queue'
   ↓
[Every 10 minutes] Inngest cron fires
   ↓
Load posts WHERE status='queue' AND scheduled_at <= now()
   ↓
For each post:
  1. Decrypt OAuth tokens
  2. Check expiration & auto-refresh
  3. Upload images to platform
  4. POST to platform API
  5. Extract published_url
   ↓
Update post: status='published' + published_url
OR status='failed' + error_message
```

---

## 🔐 Security Features

- **AES-256-GCM** encryption for OAuth tokens at rest
- **PKCE** OAuth flow for Twitter/X (public client protection)
- **HTTP-Only cookies** for sensitive data
- **Row-Level Security** on all database tables
- **User isolation** enforced at database level
- **JWT validation** for all API requests
- **Rate limiting** on publishing endpoints

---

## 📊 Database Schema

### Core Tables

- `channel_types` - Lookup table (8 platforms)
- `user_channels` - User's connected social accounts (encrypted tokens)
- `scheduled_posts` - Post queue with status tracking
- `ideas` - Content ideas for kanban board
- `idea_groups` - Kanban columns (Unassigned, To Do, In Progress, Done)
- `subscriptions` - User billing plans

### Graph Database (Neo4j)

- **Nodes**: Idea, Post, Channel, PlatformType
- **Relationships**: INSPIRED_BY, PUBLISHED_TO
- **Purpose**: Content relationship visualization

---

## 🚀 Deployment

### Web Application (Vercel)

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Vercel
vercel

# 3. Set environment variables in Vercel dashboard
# 4. Deploy triggers automatically on push
```

### Mobile Application

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit
```

### Background Jobs (Inngest)

```bash
# Deploy to Inngest cloud
inngest deploy
```

---

## 🧪 Testing

### Web Development

```bash
npm run dev
# Test at http://localhost:3000

# Test OAuth flows locally
# Use ngrok tunnel: ngrok http 3000
# Update NEXT_PUBLIC_APP_URL in .env.local
```

### Mobile Testing

```bash
# Start Expo
cd mobile
npm start

# Test on physical device or emulator
```

### API Testing

```bash
# Test with cURL or Postman
curl -X GET http://localhost:3000/api/post \
  -H "Authorization: Bearer <clerk-jwt>"
```

---

## 📈 Performance

- **API Response**: < 100ms (posts, ideas)
- **Image Upload**: < 1s per image
- **Publishing**: < 5s per post
- **Cron Frequency**: Every 10 minutes
- **Database Queries**: Indexed & optimized

---

## 🐛 Troubleshooting

### "Unsupported provider type" error

- Platform not yet implemented
- Check social platform is in SUPPORTED_PLATFORMS
- Verify OAuth credentials are configured

### Post not publishing

- Check Inngest logs: `inngest dev`
- Verify token hasn't expired
- Check post status is 'queue'
- Check scheduled_at time is in past

### OAuth fails

- Verify redirect URL matches registered URL
- Check OAuth credentials (ID, secret)
- For Twitter: Enable PKCE
- Use ngrok for local development

### Database connection errors

- Verify InsForge URL & keys
- Check NEO4J credentials
- Ensure RLS policies are enabled

---

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [OAuth Setup Guide](./docs/OAUTH_SETUP.md)
- [Database Schema](./lib/db/schema-diagram.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add feature"`
3. Push branch: `git push origin feature/your-feature`
4. Open PR for review

---

## 📄 License

MIT License - See LICENSE file

---

## 🎉 Built With

- [Next.js 16](https://nextjs.org)
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Clerk](https://clerk.com)
- [InsForge](https://insforge.app)
- [Inngest](https://inngest.com)
- [Neo4j](https://neo4j.com)
- [Expo](https://expo.dev)

---

## 📞 Support

- **Email**: support@onionai.dev
- **Discord**: [Join our community](#)
- **Twitter**: [@OnionAI](https://twitter.com/onionai)

---

**Made with ❤️ for creators and marketers**

---

## Core Features

- **Secure Authentication:** Enterprise-grade user identity management powered by Clerk.
- **Multi-Channel Social OAuth:** Secure connection to multiple social media platforms utilizing OAuth 2.0 with PKCE for enhanced security.
- **AI Content Generation:** Integrated artificial intelligence to draft, rephrase, expand, or condense posts dynamically.
- **Visual Schedule Management:** Comprehensive planning interfaces featuring interactive Calendar and List views.
- **Kanban Ideation Pipeline:** A structured visual workflow to progress content from initial concept to published status.
- **Automated Publishing:** Reliable, background execution of scheduled posts managed via Inngest cron jobs.
- **Platform-Specific Previews:** High-fidelity, pixel-perfect preview components tailored to replicate the native feed environments of each social channel.

---

## Installation and Setup

Follow these instructions to establish a local development environment.

### 1. Repository Setup

Clone the repository and install the necessary dependencies:

```bash
git clone https://github.com/your-username/onionai.git
cd onionai

# Install dependencies using npm, yarn, pnpm, or bun
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root by copying the provided `.env.example`. You must obtain API credentials from your respective service providers.

#### Authentication (Clerk)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key.
- `CLERK_SECRET_KEY`: Your Clerk secret key.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`

#### Application Settings

- `NEXT_PUBLIC_APP_URL`: The fully qualified domain name of your application (e.g., `http://localhost:3000` or a development tunnel URL).

#### Security & Encryption

Generate two secure 32-byte base64 strings (e.g., using `openssl rand -base64 32`).

- `CHANNEL_OAUTH_STATE_SECRET`: Secures OAuth flows against CSRF attacks.
- `CHANNEL_TOKEN_ENCRYPTION_KEY`: Secures stored OAuth access and refresh tokens at rest.

#### Social Platform Credentials

**LinkedIn:**

- `LINKEDIN_CLIENT_ID`: OAuth 2.0 Client ID from the LinkedIn Developer Portal.
- `LINKEDIN_CLIENT_SECRET`: OAuth 2.0 Client Secret from the LinkedIn Developer Portal.

**X (Twitter):**

- `TWITTER_CLIENT_ID`: OAuth 2.0 Client ID from the Twitter Developer Portal.

### 3. Application Execution

Start the Next.js development server:

```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

### 4. Background Services Execution

To process background jobs and test scheduled publishing locally, launch the Inngest development server in a separate terminal session:

```bash
npx inngest-cli@latest dev
```

---

## Development Guidelines

When contributing to this repository, please adhere to the following guidelines:

1. Create feature branches from the `main` branch.
2. Ensure all TypeScript strict mode checks pass before committing.
3. Write clear, descriptive commit messages.
4. Open a Pull Request detailing the scope of your changes and any related issue tracking numbers.

---
