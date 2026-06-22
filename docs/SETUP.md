# OnionAI - Complete Setup & Deployment Guide

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] npm/yarn/pnpm available
- [ ] Clerk account created
- [ ] InsForge account created
- [ ] Inngest account created
- [ ] Neo4j Cloud instance (free tier available)
- [ ] Social platform developer accounts (OAuth)

---

## Step 1: Local Development Setup

### 1.1 Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd onionai

# Install dependencies
npm install

# Install mobile dependencies
cd mobile && npm install && cd ..
```

### 1.2 Environment Setup

```bash
# Copy example to local file
cp .env.example .env.local

# Create ngrok tunnel for local development
# Install: brew install ngrok (macOS) or download from ngrok.com
ngrok http 3000
# Copy tunnel URL (e.g., https://abc123.ngrok-free.dev)
```

---

## Step 2: Configure Social Platforms

### 2.1 Twitter/X Setup

1. Go to https://developer.twitter.com/
2. Create/select a Project
3. Create App with "Native App" type
4. Go to Keys and tokens → API Keys tab
5. Copy **API Key** (Client ID) and **API Secret Key** (Client Secret)
6. Go to App Settings → Authentication settings
7. Enable **OAuth 2.0**
8. Enable **PKCE with S256 code challenge method**
9. Set Redirect URI: `https://your-ngrok-url.ngrok-free.dev/api/channel/callback`
10. Grant needed permissions: `tweet.read`, `tweet.write`, `users.read`, `offline.access`, `media.write`

Add to `.env.local`:

```env
TWITTER_CLIENT_ID=your_api_key_here
TWITTER_CLIENT_SECRET=your_api_secret_here
```

### 2.2 LinkedIn Setup

1. Go to https://www.linkedin.com/developers/apps
2. Click "Create app"
3. Fill company, app name, app URL
4. Go to "Auth" tab
5. Copy **Client ID** and **Client Secret**
6. Add redirect URI: `https://your-ngrok-url.ngrok-free.dev/api/channel/callback`
7. Request access to: `Sign In with LinkedIn`

Add to `.env.local`:

```env
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
```

### 2.3 Instagram/Facebook Setup

1. Go to https://developers.facebook.com/
2. Create app → Consumer (for business apps)
3. Add "Facebook Login" product
4. Go to Settings → Basic, copy App ID and App Secret
5. Add Facebook Login → Settings → Add Redirect URIs: `https://your-ngrok-url.ngrok-free.dev/api/channel/callback`
6. Request permissions: `pages_manage_metadata`, `pages_manage_posts`, `pages_read_engagement`

Add to `.env.local`:

```env
INSTAGRAM_CLIENT_ID=your_app_id
INSTAGRAM_CLIENT_SECRET=your_app_secret
FACEBOOK_CLIENT_ID=your_app_id
FACEBOOK_CLIENT_SECRET=your_app_secret
```

### 2.4 YouTube Setup

1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable **YouTube Data API v3**
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Type: Web application
6. Add authorized redirect URI: `https://your-ngrok-url.ngrok-free.dev/api/channel/callback`
7. Download credentials JSON

Add to `.env.local`:

```env
YOUTUBE_CLIENT_ID=your_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_client_secret
```

### 2.5 TikTok Setup

1. Go to https://developers.tiktok.com/
2. Create developer account
3. Go to Applications
4. Create a new application → Web
5. Copy **Client ID** and **Client Secret**
6. Add Redirect URI: `https://your-ngrok-url.ngrok-free.dev/api/channel/callback`

Add to `.env.local`:

```env
TIKTOK_CLIENT_ID=your_client_id
TIKTOK_CLIENT_SECRET=your_client_secret
```

### 2.6 Bluesky Setup

1. Create Bluesky account at https://bsky.social
2. Go to Settings → App Passwords
3. Create new password (copy it - can't be seen again)
4. Your handle is Client ID, app password is Client Secret

Add to `.env.local`:

```env
BLUESKY_CLIENT_ID=your.bsky.handle
BLUESKY_CLIENT_SECRET=your_app_password
```

### 2.7 Threads Setup

1. Go to https://www.threads.net
2. Connect with Instagram business account
3. Go to Meta Apps → Your apps → Create app
4. Add Threads product
5. Copy App ID and App Secret
6. Add Redirect URI

Add to `.env.local`:

```env
THREADS_CLIENT_ID=your_app_id
THREADS_CLIENT_SECRET=your_app_secret
```

---

## Step 3: Configure Core Services

### 3.1 Clerk Setup

1. Go to https://dashboard.clerk.com
2. Create new project
3. Go to Credentials tab
4. Copy **API Key** (Publishable Key) and **Secret Key**
5. Go to Paths tab → Set sign-in URL: `/sign-in`, sign-up URL: `/sign-up`

Add to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_INSFORGE_TEMPLATE=insforge
```

### 3.2 InsForge Setup

1. Go to https://insforge.app
2. Create new project
3. Go to Project Settings
4. Copy **Base URL**, **Anon Key**, **Project API Key**
5. Create database tables (schema auto-syncs)

Add to `.env.local`:

```env
NEXT_PUBLIC_INSFORGE_BASE_URL=https://your-instance.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your_anon_key
INSFORGE_PROJECT_API_KEY=your_project_api_key
```

### 3.3 Neo4j Setup

1. Go to https://neo4j.com/cloud/aura/
2. Create free instance (no credit card needed)
3. Start instance, copy **Connection String**
4. Set password for neo4j user
5. Wait for instance to be ready

Add to `.env.local`:

```env
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j
```

### 3.4 Inngest Setup

1. Go to https://app.inngest.com
2. Create account/login
3. Go to Environments
4. Copy Event API URL (for dev mode)
5. Inngest will auto-detect functions from local code

Add to `.env.local`:

```env
INNGEST_DEV=1
# For production:
# INNGEST_EVENT_KEY=evt_prod_your_key
# INNGEST_SIGNING_KEY=signkey_prod_your_key
```

### 3.5 Sarvam AI Setup (Translation)

1. Go to https://www.sarvam.ai/
2. Sign up or login
3. Go to API Keys
4. Create new API key
5. Copy the key

Add to `.env.local`:

```env
SARVAM_API_KEY=your_sarvam_api_key
```

### 3.6 Security Keys

Generate encryption keys:

```bash
# Generate CHANNEL_OAUTH_STATE_SECRET
openssl rand -base64 32

# Generate CHANNEL_TOKEN_ENCRYPTION_KEY
openssl rand -base64 32
```

Add to `.env.local`:

```env
CHANNEL_OAUTH_STATE_SECRET=generated_32_byte_string
CHANNEL_TOKEN_ENCRYPTION_KEY=generated_32_byte_string
```

### 3.7 Application URL

```env
# For local development with ngrok
NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok-free.dev

# For production
# NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Step 4: Start Development Servers

### Terminal 1: Web Application

```bash
npm run dev
# Runs on http://localhost:3000
```

### Terminal 2: Background Jobs

```bash
npx inngest-cli@latest dev
# Starts Inngest dev server
# Auto-detects function changes
```

### Terminal 3: Mobile App (Optional)

```bash
cd mobile
npm start

# Choose platform:
# i - iOS simulator
# a - Android emulator
# w - Web
```

---

## Step 5: Test the Application

### 5.1 Web App Testing

1. Go to http://localhost:3000
2. Sign up with email
3. Go to Settings → Channels
4. Click "Connect Channel"
5. Select a platform (e.g., Twitter)
6. Complete OAuth flow (will redirect to platform, then back)
7. You should see "Channel Connected" ✅

### 5.2 Create & Schedule Post

1. Go to Schedule tab
2. Click "Add Post"
3. Enter content
4. Select connected channel(s)
5. Set publish time (future date/time)
6. Click "Schedule"
7. Post appears in calendar

### 5.3 Test Publishing

1. Set post to publish in ~5 minutes
2. Watch Inngest logs (Terminal 2)
3. After 10 minutes, cron runs
4. You should see "post/publish.requested" event
5. Check your social platform - post should appear!

### 5.4 Mobile App Testing

1. Start Expo: `cd mobile && npm start`
2. Open in iOS/Android simulator or physical device
3. Same features as web app, responsive design

---

## Step 6: Production Deployment

### 6.1 Web App (Vercel)

```bash
# 1. Push to GitHub
git add .
git commit -m "Production ready"
git push origin main

# 2. Connect to Vercel
vercel

# 3. Set environment variables in Vercel dashboard
# Copy all from .env.local to Vercel project settings

# 4. Deploy
vercel --prod
```

### 6.2 Mobile App (Expo)

```bash
# 1. Setup EAS
eas build:configure

# 2. Build for iOS
eas build --platform ios --auto-submit

# 3. Build for Android
eas build --platform android --auto-submit

# 4. Submit to App Store & Play Store
eas submit
```

### 6.3 Background Jobs (Inngest)

```bash
# 1. Authenticate with Inngest
inngest login

# 2. Deploy functions
inngest deploy --prod

# 3. Verify functions in Inngest dashboard
```

---

## Step 7: Monitoring & Maintenance

### Monitor Background Jobs

```bash
# View function runs
inngest dev --verbose

# Or visit: https://app.inngest.com → your project
```

### Monitor Database

```bash
# Neo4j console
# Visit instance URL in Aura
# Run Cypher queries to inspect graph
```

### Monitor API

```bash
# Check logs in Vercel dashboard
# Monitor function performance
```

---

## Troubleshooting

### "Cannot find ngrok URL"

- Ensure ngrok is running: `ngrok http 3000`
- Copy tunnel URL to NEXT_PUBLIC_APP_URL
- Restart dev server

### OAuth fails with "Invalid redirect URI"

- Update redirect URI in platform settings to match NEXT_PUBLIC_APP_URL
- Format: `https://your-ngrok-url/api/channel/callback`

### Post not publishing

- Check Inngest dev server is running
- Verify post status is "queue"
- Verify scheduled_at time has passed
- Check platform credentials are correct
- View error message in post status

### Database connection error

- Verify InsForge URL and keys
- Check Neo4j password is correct
- Ensure RLS policies are enabled

### Token expiration issues

- Platforms rotate tokens, auto-refresh handles most cases
- If still failing, reconnect channel

---

## Next Steps

1. ✅ Complete local development setup
2. ✅ Test all 8 social platforms
3. ✅ Create sample posts & publish
4. ✅ Test mobile app
5. ✅ Deploy to production
6. ✅ Monitor and optimize

---

## Support

- 📚 Full docs at README.md
- 🐛 Report bugs on GitHub Issues
- 💬 Join community Discord
- 📧 Email: support@onionai.dev

Happy posting! 🚀
