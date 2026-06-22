# Deployment Guide

## Production Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Neo4j cluster ready
- [ ] OAuth credentials verified
- [ ] Inngest functions deployed
- [ ] CDN configured
- [ ] Error monitoring enabled
- [ ] Backup strategy configured

---

## Web Application Deployment (Vercel)

### 1. Pre-Deployment

```bash
# 1. Test build locally
npm run build

# 2. Run linting
npm run lint

# 3. Test production environment
npm run build && npm start
```

### 2. Deploy to Vercel

```bash
# Option A: Using Vercel CLI
npm i -g vercel
vercel login
vercel --prod

# Option B: Using GitHub
# 1. Push to GitHub
git push origin main

# 2. Vercel auto-deploys from GitHub
# 3. Check dashboard: https://vercel.com/dashboard
```

### 3. Configure Environment Variables

In Vercel Dashboard:

```
Settings → Environment Variables

Production:
NEXT_PUBLIC_INSFORGE_BASE_URL=https://prod.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=prod_anon_key
INSFORGE_PROJECT_API_KEY=prod_api_key

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

NEXT_PUBLIC_APP_URL=https://your-domain.com

CHANNEL_OAUTH_STATE_SECRET=prod_secret_1
CHANNEL_TOKEN_ENCRYPTION_KEY=prod_secret_2

TWITTER_CLIENT_ID=prod_twitter_id
TWITTER_CLIENT_SECRET=prod_twitter_secret
... (all platforms)

SARVAM_API_KEY=prod_sarvam_key

INNGEST_EVENT_KEY=evt_prod_...
INNGEST_SIGNING_KEY=signkey_prod_...

NEO4J_URI=neo4j+s://prod.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=prod_password
NEO4J_DATABASE=neo4j
```

### 4. Configure Custom Domain

In Vercel Settings:

```
Domains → Add Production Domain
onionai.com (or your domain)

Point DNS:
CNAME: cname.vercel.com
A: 76.76.19.21
```

### 5. Enable Edge Middleware

No additional config needed - already configured in middleware.ts

### 6. Setup Monitoring

```bash
# Install Sentry (optional)
npm install @sentry/nextjs

# Configure in next.config.ts
# View errors at sentry.io
```

---

## Mobile App Deployment

### iOS Deployment (App Store)

#### Prerequisites

- Apple Developer Account ($99/year)
- Mac with Xcode
- App signing certificate

#### Steps

```bash
# 1. Configure EAS
eas build:configure

# 2. Create provisioning profiles
eas credentials:configure --platform ios

# 3. Build for App Store
eas build --platform ios --auto-submit

# 4. Track build at https://expo.dev/accounts/your-account/projects/onionai/builds
```

#### In App Store Connect

1. Create new app: `onionai`
2. Fill metadata: description, keywords, screenshots
3. Add app icon (1024x1024)
4. Add app preview video
5. Set pricing: Free
6. Configure subscriptions (if needed)
7. Submit for review

### Android Deployment (Play Store)

#### Prerequisites

- Google Play Developer Account ($25 one-time)
- Java Keystore certificate

#### Steps

```bash
# 1. Create keystore (first time only)
keytool -genkey-and-sign-by-digest \
  -alias onionai_key \
  -keystore onionai.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 2. Store credentials securely
# Save onionai.jks in secure location
# Save password in password manager

# 3. Build for Play Store
eas build --platform android --auto-submit

# 4. Track build
```

#### In Google Play Console

1. Create new app: `onionai`
2. Fill store listing
3. Add screenshots (1080x1920)
4. Add app icon (512x512)
5. Add content rating questionnaire
6. Set pricing: Free
7. Submit for review

---

## Background Jobs Deployment (Inngest)

### 1. Authenticate with Inngest

```bash
inngest login
# Opens browser, sign in with GitHub/Google
```

### 2. Deploy Functions

```bash
# Deploy all functions
inngest deploy --prod

# Deploy specific function
inngest deploy --prod --func publishScheduledPostsCron
```

### 3. Verify Deployment

```bash
# List deployed functions
inngest functions list

# View function in dashboard: https://app.inngest.com
```

### 4. Configure Triggers

In Inngest Dashboard:

```
Functions → publishScheduledPostsCron
Enable → Set cron: */10 * * * *  (every 10 minutes)
Save
```

---

## Database Setup (InsForge)

### 1. Create Production Database

Go to InsForge Dashboard:

```
Projects → Create Project → Production
Name: OnionAI Production
Region: Choose closest to users
```

### 2. Create Tables

```bash
# Tables are auto-created from schema
# But ensure RLS policies are enabled:

# In InsForge Console → SQL Editor
ALTER TABLE user_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
```

### 3. Create Backup

```bash
# In InsForge Dashboard
Backups → Create Manual Backup

# Schedule automatic backups
Settings → Backup Schedule → Daily
```

---

## Graph Database Setup (Neo4j)

### 1. Create Production Instance

Go to Neo4j Aura: https://neo4j.com/cloud/aura/

```
New Instance → Production
Size: 2GB (or larger for scale)
Region: Closest to you
Name: onionai-prod
```

### 2. Set Password

```
Manage → Admin Console
Set password for neo4j user
Copy connection string
```

### 3. Load Initial Data

```bash
# Connect to production instance
export NEO4J_URI=neo4j+s://your-prod-uri
export NEO4J_PASSWORD=your_password

# Run initialization queries (if any)
# See inngest/functions/neo4j-sync.ts
```

---

## DNS & SSL Setup

### 1. Update DNS Records

For domain: `onionai.com`

```
# For Vercel
CNAME  www  cname.vercel.com

# If using Nameservers
NS  onionai.com  ns1.vercel-dns.com
                 ns2.vercel-dns.com
                 ns3.vercel-dns.com
                 ns4.vercel-dns.com
```

### 2. SSL Certificate

Vercel automatically provides SSL certificates via Let's Encrypt.

```
Settings → Domains → SSL
Automatic (default)
Managed by Let's Encrypt
```

---

## Email Setup (Optional)

If using SendGrid for emails:

```bash
npm install @sendgrid/mail
```

Add to `.env`:

```
SENDGRID_API_KEY=your_sendgrid_key
```

---

## Monitoring & Analytics

### 1. Error Tracking

```bash
# Setup Sentry
npm install @sentry/nextjs
npm install @sentry/react
```

Configure in `.env`:

```
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 2. Analytics

```bash
# Setup Posthog (optional)
npm install posthog-js
```

### 3. Performance Monitoring

```bash
# Web Vitals (built-in)
# View in Vercel Analytics Dashboard

# Database Queries (built-in)
# Monitor in InsForge Dashboard
```

---

## Performance Optimization

### 1. Image Optimization

Already configured in `next.config.ts`:

```typescript
images: {
  remotePatterns: [{ hostname: "your-insforge-bucket.s3.amazonaws.com" }];
}
```

### 2. Database Indexing

```sql
-- Create indexes for common queries
CREATE INDEX idx_posts_user_status ON scheduled_posts(user_id, status);
CREATE INDEX idx_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX idx_ideas_user_group ON ideas(user_id, group_id);
```

### 3. Caching

```
-- Already configured via:
-- Next.js ISR (Incremental Static Regeneration)
-- Browser caching headers
-- CDN caching (Vercel Edge)
```

---

## Scaling Strategy

### Phase 1: 0-1,000 Users

- Single Vercel instance (default)
- Shared Neo4j 2GB
- Standard InsForge tier

### Phase 2: 1,000-10,000 Users

- Multiple Vercel regions
- Dedicated Neo4j instance
- Read replicas for InsForge

### Phase 3: 10,000+ Users

- Global edge functions
- Neo4j cluster
- Multi-region databases

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables encrypted
- [ ] Database backups automated
- [ ] OAuth tokens encrypted at rest
- [ ] RLS policies enforced
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] API keys rotated regularly
- [ ] Secrets not in version control
- [ ] Monitoring alerts configured

---

## Rollback Strategy

### If deployment fails

```bash
# Vercel auto-keeps 50 recent deployments
vercel rollback

# Or select specific deployment
vercel deploy --prod --target production
```

### Database rollback

```bash
# In InsForge Dashboard
Backups → Restore from Backup
Select date/time
Confirm restore
```

---

## Post-Deployment Testing

1. Visit https://your-domain.com
2. Complete sign-up flow
3. Connect each social platform
4. Create test post
5. Schedule 5 minutes in future
6. Wait for Inngest cron (max 10 min)
7. Verify post published to platform
8. Check mobile app with same account
9. Verify error handling with invalid tokens

---

## Support & Documentation

- 📚 [Full Setup Guide](./SETUP.md)
- 🔧 [API Reference](./API.md)
- 🐛 [Troubleshooting](./SETUP.md#troubleshooting)
- 💬 Community Discord
- 📧 support@onionai.dev

---

**Deployment Complete!** 🎉

Your application is now live and production-ready.
