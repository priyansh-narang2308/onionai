# ⚡ Quick Start Guide

**Get OnionAI running in 5 minutes**

---

## Step 1: Clone & Install (1 min)

```bash
git clone <your-repo-url>
cd onionai
npm install
cd mobile && npm install && cd ..
```

---

## Step 2: Setup Environment (1 min)

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials (see below for quick references):

**Minimal Setup (Twitter only):**

```env
# From Clerk: https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# From InsForge: https://insforge.app
NEXT_PUBLIC_INSFORGE_BASE_URL=https://your-instance.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your_key
INSFORGE_PROJECT_API_KEY=your_key

# App URL (use localhost:3000 for dev)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security keys (generate with: openssl rand -base64 32)
CHANNEL_OAUTH_STATE_SECRET=your_generated_key_1
CHANNEL_TOKEN_ENCRYPTION_KEY=your_generated_key_2

# Twitter
TWITTER_CLIENT_ID=your_id
TWITTER_CLIENT_SECRET=your_secret

# Neo4j
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password

# Inngest
INNGEST_DEV=1
```

---

## Step 3: Start Servers (2 mins)

**Terminal 1 - Web App:**

```bash
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Background Jobs:**

```bash
npx inngest-cli@latest dev
# Leave running to process scheduled posts
```

**Terminal 3 - Mobile (Optional):**

```bash
cd mobile && npm start
# Choose: i (iOS), a (Android), or w (Web)
```

---

## Step 4: Test Application (1 min)

1. Go to http://localhost:3000
2. Sign up with email
3. Go to **Settings → Channels**
4. Click **Connect Channel** → Select **Twitter**
5. Authorize with your Twitter account
6. Create a post in **Schedule** tab
7. Set time to 5 minutes in future
8. Click **Schedule**
9. Wait for Inngest to publish (~10 min max)
10. Check your Twitter! 📱

---

## 🌐 Add More Platforms

Each platform adds 2 minutes:

### LinkedIn

1. Go to https://www.linkedin.com/developers/apps
2. Create app, copy Client ID & Secret
3. Add to `.env.local`:

```env
LINKEDIN_CLIENT_ID=your_id
LINKEDIN_CLIENT_SECRET=your_secret
```

### Instagram/Facebook

1. Go to https://developers.facebook.com/
2. Create app, copy App ID & Secret
3. Add to `.env.local`:

```env
INSTAGRAM_CLIENT_ID=your_id
INSTAGRAM_CLIENT_SECRET=your_secret
FACEBOOK_CLIENT_ID=your_id
FACEBOOK_CLIENT_SECRET=your_secret
```

### YouTube

1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 Client ID
3. Add to `.env.local`:

```env
YOUTUBE_CLIENT_ID=your_id
YOUTUBE_CLIENT_SECRET=your_secret
```

### TikTok

1. Go to https://developers.tiktok.com/
2. Create app, copy credentials
3. Add to `.env.local`:

```env
TIKTOK_CLIENT_ID=your_id
TIKTOK_CLIENT_SECRET=your_secret
```

### Bluesky

1. Create account at https://bsky.social
2. Go to Settings → App Passwords
3. Create password, add to `.env.local`:

```env
BLUESKY_CLIENT_ID=your.handle
BLUESKY_CLIENT_SECRET=your_password
```

### Threads

1. Use your Instagram business account
2. Create Meta App
3. Add to `.env.local`:

```env
THREADS_CLIENT_ID=your_id
THREADS_CLIENT_SECRET=your_secret
```

---

## 🚀 Deploy to Production

### Web App (Vercel)

```bash
git push origin main
# Auto-deploys to Vercel
# Set env vars in Vercel dashboard
```

### Mobile App

```bash
eas build --platform ios --auto-submit
eas build --platform android --auto-submit
```

### Background Jobs

```bash
inngest login
inngest deploy --prod
```

---

## 📱 Mobile App Features

**Bottom Navigation:**

1. **Ideas** - Kanban board for content ideas
2. **Schedule** - Calendar & list views for posts
3. **Dashboard** - Analytics & graph visualization
4. **Billing** - Subscription plans
5. **Settings** - Channel management

---

## 🆘 Quick Troubleshooting

### "Cannot connect to database"

- Check `.env.local` INSFORGE variables
- Ensure InsForge instance is running

### "Post not publishing"

- Inngest server running in Terminal 2?
- Post status is "queue"?
- Scheduled time in past?
- Wait up to 10 minutes for cron

### "OAuth fails"

- Update app URL in `.env.local`
- Update redirect URI in platform settings
- Format: `https://your-url/api/channel/callback`

### "More help?"

- See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- Full setup guide: [SETUP.md](docs/SETUP.md)
- API docs: [API.md](docs/API.md)

---

## 📚 Documentation

| Document                                               | Purpose                     |
| ------------------------------------------------------ | --------------------------- |
| [README.md](README.md)                                 | Project overview & features |
| [SETUP.md](docs/SETUP.md)                              | Detailed platform setup     |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md)                    | Production deployment       |
| [API.md](docs/API.md)                                  | Complete API reference      |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)          | Common issues & fixes       |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | What's been built           |

---

## 💡 Pro Tips

1. **Local Development with ngrok:**

   ```bash
   brew install ngrok
   ngrok http 3000
   # Copy tunnel URL to NEXT_PUBLIC_APP_URL
   ```

2. **Test Email Signup:**
   - Use disposable emails (e.g., temp-mail.org)
   - Clerk sends magic links to email

3. **Watch Inngest Logs:**
   - Terminal 2 shows real-time function execution
   - Check here if posts aren't publishing

4. **Mobile Testing:**
   - Install Expo app on phone
   - Scan QR code from `npm start`
   - Test same functionality as web

---

## ✨ Next: Features to Explore

- [ ] Create post with 8 platforms at once
- [ ] Generate AI ideas (right-click in Ideas tab)
- [ ] Translate content to Hindi/Tamil/etc
- [ ] View graph visualization in Dashboard
- [ ] Check post analytics
- [ ] Setup subscription plan
- [ ] Invite team members (future feature)

---

## 🎯 You're Ready!

**Your OnionAI instance is running.**

Next:

1. Create a test post
2. Schedule it for ~5 minutes from now
3. Watch Inngest publish it to your platform
4. Celebrate! 🎉

---

**Stuck?** → Check [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) or read [SETUP.md](docs/SETUP.md) for detailed instructions.

**Questions?** → Email support@onionai.dev
