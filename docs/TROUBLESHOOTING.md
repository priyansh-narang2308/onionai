# Troubleshooting Guide

## Quick Diagnostics

Before diving into specific issues, run these checks:

```bash
# 1. Check Node version
node --version  # Should be 18+

# 2. Verify database connection
curl https://your-insforge-url/healthcheck

# 3. Check Neo4j connection
# Visit: https://your-neo4j-instance/browser

# 4. Verify environment variables
grep -E "NEXT_PUBLIC_|CLERK_" .env.local | head -5

# 5. Test API connectivity
curl http://localhost:3000/api/channel
```

---

## Common Issues

### 1. OAuth & Authentication

#### "Invalid redirect URI"

**Problem:** OAuth fails with "redirect_uri_mismatch" error

**Solution:**

1. Check NEXT_PUBLIC_APP_URL in .env.local
2. Update OAuth callback URL in platform settings
3. Format: `https://your-ngrok-url/api/channel/callback`
4. Exact match required - including protocol & domain

**Example Fix:**

```env
# If using ngrok:
NEXT_PUBLIC_APP_URL=https://abc123-def456.ngrok-free.dev

# Then update each platform:
# Twitter: https://abc123-def456.ngrok-free.dev/api/channel/callback
# LinkedIn: https://abc123-def456.ngrok-free.dev/api/channel/callback
```

---

#### "Channel not connecting"

**Problem:** OAuth completes but channel doesn't appear in UI

**Solution:**

1. Check Clerk JWT is valid
2. Verify database connection
3. Check browser console for errors
4. Try in incognito/private mode

**Debug Steps:**

```bash
# 1. Check Clerk token
echo $JWT | jq -R 'split(".")[1] | @base64d'

# 2. Check InsForge connection
curl https://your-insforge-url/healthcheck

# 3. View API response
curl http://localhost:3000/api/channel \
  -H "Authorization: Bearer $JWT" | jq
```

---

#### "Token expired" on publishing

**Problem:** Post fails to publish with token expired error

**Solution:**

1. OAuth tokens expire (usually 3-6 months)
2. Disconnect and reconnect the channel
3. App auto-refreshes tokens before publishing

**Fix:**

```bash
# 1. Go to Settings → Channels
# 2. Click disconnect on the channel
# 3. Click connect again
# 4. Complete OAuth flow
# 5. Retry publishing
```

---

### 2. Post Publishing Issues

#### "Post not publishing"

**Problem:** Post stuck in 'queue' status

**Diagnosis Checklist:**

- [ ] Inngest dev server running? (`npx inngest-cli@latest dev`)
- [ ] Post status is 'queue'?
- [ ] Scheduled_at time has passed?
- [ ] Channel is connected?
- [ ] 10+ minutes passed since scheduling?

**Debug Steps:**

```bash
# 1. Check post status
curl http://localhost:3000/api/post/post-id \
  -H "Authorization: Bearer $JWT" | jq '.status'

# 2. Watch Inngest logs
# Terminal should show:
# "post/publish.requested" event
# Function execution logs

# 3. Check database directly (if needed)
# Query: SELECT * FROM scheduled_posts WHERE id='post-id'
```

**Common Causes:**

1. **Inngest server not running** - Must have `inngest dev` in separate terminal
2. **Scheduled time in future** - Post only publishes when scheduled_at ≤ now
3. **Channel disconnected** - Reconnect to platform
4. **Network timeout** - Check internet connection

---

#### "Unsupported provider type"

**Problem:** Error: "Unsupported provider type: instagram"

**Diagnosis:**

1. Check platform is in SUPPORTED_PLATFORMS
2. Verify publish function exists for platform
3. Check environment variables for platform

**Fix:**

```bash
# 1. Check inngest/functions/publish-scheduled-posts.ts
# Should have: publishToInstagram, publishToFacebook, etc.

# 2. Check environment variables
grep -i "instagram" .env.local

# 3. If missing, add:
INSTAGRAM_CLIENT_ID=your_id
INSTAGRAM_CLIENT_SECRET=your_secret
```

---

#### "Image upload failed"

**Problem:** Post with images fails to publish

**Debug:**

```bash
# 1. Test image upload directly
curl -X POST http://localhost:3000/api/upload-image \
  -F "file=@image.jpg" \
  -H "Authorization: Bearer $JWT"

# 2. Check image URL is accessible
curl -I https://your-bucket.s3.amazonaws.com/images/...

# 3. Verify image format
file image.jpg  # Should be JPEG, PNG, WebP, or GIF
```

**Common Causes:**

1. **Image too large** - Max 10MB per image
2. **Unsupported format** - Use JPEG, PNG, WebP, or GIF
3. **Storage not accessible** - Check InsForge bucket permissions

---

### 3. Database Issues

#### "Cannot connect to database"

**Problem:** "ECONNREFUSED" or connection timeout

**Diagnosis:**

```bash
# 1. Check InsForge URL
echo $NEXT_PUBLIC_INSFORGE_BASE_URL

# 2. Test connectivity
curl $NEXT_PUBLIC_INSFORGE_BASE_URL/healthcheck

# 3. Verify credentials
grep -E "INSFORGE" .env.local
```

**Fix:**

1. Verify InsForge URL is correct (no trailing slash)
2. Check anon key & API key are correct
3. Ensure InsForge instance is running
4. Check network connectivity

**Example:**

```env
# Correct format:
NEXT_PUBLIC_INSFORGE_BASE_URL=https://your-instance.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=eyJ...

# Wrong format (won't work):
NEXT_PUBLIC_INSFORGE_BASE_URL=https://your-instance.insforge.app/  # Trailing slash
NEXT_PUBLIC_INSFORGE_ANON_KEY=just-a-string  # Should be JWT format
```

---

#### "Neo4j connection failed"

**Problem:** "Neo4jError" when accessing graph

**Diagnosis:**

```bash
# 1. Check Neo4j credentials
grep NEO4J .env.local

# 2. Test connection
neo4j-admin database check
```

**Fix:**

1. Verify Neo4j instance is running (Aura dashboard)
2. Check password is correct (no special character escaping needed)
3. Verify database name is correct (default: "neo4j")
4. Ensure network access is allowed

---

### 4. Environment & Configuration

#### "Cannot find module '@clerk/nextjs'"

**Problem:** Import error in build

**Solution:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

#### "undefined is not a function"

**Problem:** Function doesn't exist at runtime

**Common Causes:**

1. Missing import statement
2. Function exported incorrectly
3. Circular dependency

**Debug:**

```bash
# Check import path
grep -r "import.*functionName" src/

# Check export in source file
grep -r "export.*functionName" lib/
```

---

#### "ENOENT: no such file or directory"

**Problem:** File not found error

**Solution:**

```bash
# 1. Verify file exists
ls -la path/to/file.ts

# 2. Check import path (case-sensitive on Linux)
grep -r "from.*filepath" src/

# 3. Verify relative paths
# Wrong: import from './myfile'  (should be ./MyFile if file is MyFile.ts)
# Right: import from './MyFile'
```

---

### 5. Development Server Issues

#### "Port 3000 already in use"

**Problem:** "EADDRINUSE: address already in use :::3000"

**Solution:**

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

---

#### "Module not found: react"

**Problem:** Dependencies not installed

**Solution:**

```bash
# Reinstall dependencies
npm install

# Or if using yarn/pnpm
yarn install
pnpm install

# Clear cache
npm cache clean --force
npm install
```

---

#### "Hot reload not working"

**Problem:** Changes to code don't reflect in browser

**Solution:**

1. Save file (ensure actually saved)
2. Check file watcher has permissions
3. Restart dev server

**For macOS:**

```bash
# May need to increase file watcher limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### 6. Mobile App Issues

#### "Cannot connect to API from mobile"

**Problem:** Mobile can't reach development server

**Solution:**

1. Use ngrok tunnel for local development
2. Or deploy to production
3. Or use local IP address

**Fix:**

```bash
# 1. Start ngrok
ngrok http 3000

# 2. Copy tunnel URL to mobile app
# Edit: mobile/src/lib/client.ts
const API_URL = 'https://your-ngrok-url/api'

# 3. Restart mobile dev server
cd mobile && npm start
```

---

#### "Expo build fails"

**Problem:** Build fails with cryptic error

**Solution:**

```bash
# 1. Clear cache
rm -rf node_modules/.cache
rm -rf ~/Library/Developer/Xcode/DerivedData

# 2. Reinstall
npm install

# 3. Try build again
eas build --platform ios
```

---

### 7. Performance Issues

#### "Website is slow"

**Diagnosis:**

```bash
# 1. Check API response time
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain/api/post

# 2. Check database query time
# View in InsForge dashboard

# 3. Check Vercel analytics
# Visit: https://vercel.com/dashboard
```

**Solutions:**

1. Add database indexes (see deployment guide)
2. Enable caching headers
3. Optimize images
4. Use CDN (Vercel auto-provides)
5. Check for N+1 queries

---

#### "Database queries are slow"

**Solution:**

```sql
-- Add indexes to common queries
CREATE INDEX idx_posts_user_status ON scheduled_posts(user_id, status);
CREATE INDEX idx_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX idx_ideas_user_group ON ideas(user_id, group_id);
```

---

### 8. Publishing Errors

#### "Instagram: invalid_access_token"

**Problem:** Instagram publish fails with access token error

**Cause:** Token expired or permissions insufficient

**Fix:**

1. Reconnect Instagram channel
2. Ensure app has `pages_manage_posts` permission
3. Verify business account is connected

---

#### "Twitter: 429 Too Many Requests"

**Problem:** Rate limit exceeded

**Solution:**

1. Wait 15 minutes before retrying
2. Reduce post frequency
3. Consider Twitter API tier upgrade

---

#### "LinkedIn: Invalid parameter"

**Problem:** LinkedIn specific parameter error

**Fix:**

1. Check image format (must be JPEG or PNG)
2. Verify image URL is accessible
3. Ensure LinkedIn credentials have correct permissions

---

### 9. Monitoring & Logs

#### "Where do I find error logs?"

**Locations:**

```
# Web app - Vercel
https://vercel.com/dashboard → [Project] → Logs

# Background jobs - Inngest
https://app.inngest.com → [Function] → Logs

# Database - InsForge
https://insforge.app → [Project] → Logs

# Mobile - Expo
https://expo.dev → [Project] → Build Logs
```

---

#### "How do I view logs locally?"

```bash
# Next.js dev server logs (automatic to terminal)
npm run dev
# Shows in stdout

# Inngest logs (auto-displayed)
npx inngest-cli@latest dev
# Shows function execution logs

# Database logs
# View in InsForge dashboard

# Mobile logs
cd mobile && npm start
# Shows in Expo CLI
```

---

### 10. Security Issues

#### "Sensitive data in logs"

**Problem:** API keys visible in console/logs

**Solution:**

1. Never log sensitive data
2. Always mask tokens in logs
3. Use .env.local (not version controlled)

**Check:**

```bash
# Verify no secrets in git
git log -p | grep -i "api_key\|secret\|token"

# Clean history if needed
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env.local' --prune-empty --tag-name-filter cat -- --all
```

---

## Getting Help

### Resources

1. **Documentation**
   - [API Reference](./API.md)
   - [Setup Guide](./SETUP.md)
   - [Deployment Guide](./DEPLOYMENT.md)

2. **Platform Docs**
   - [Twitter API Docs](https://developer.twitter.com/en/docs)
   - [LinkedIn API Docs](https://docs.microsoft.com/en-us/linkedin/shared/authentication)
   - [Instagram API Docs](https://developers.facebook.com/docs/instagram-api)
   - [Inngest Docs](https://www.inngest.com/docs)
   - [Clerk Docs](https://clerk.com/docs)

3. **Community**
   - Discord: [Join our community](#)
   - GitHub Issues: [Report bugs](#)
   - Email: support@onionai.dev

### How to Report Issues

Include:

1. Error message (exact copy)
2. Steps to reproduce
3. Environment: `node -v`, `npm -v`, OS
4. .env.local values (mask secrets)
5. Relevant logs (from Inngest, Vercel, Expo)
6. Screenshots if visual

---

## Testing Checklist

Before reporting a bug:

- [ ] Cleared browser cache and cookies
- [ ] Restarted development servers
- [ ] Checked all environment variables
- [ ] Verified database connectivity
- [ ] Tested with ngrok tunnel (if local)
- [ ] Verified social platform credentials
- [ ] Checked Inngest logs for errors
- [ ] Tried in different browser
- [ ] Created minimal reproduction case

---

## Performance Tuning

### Database

```sql
-- Create indexes
CREATE INDEX idx_posts_user ON scheduled_posts(user_id);
CREATE INDEX idx_posts_status ON scheduled_posts(status);
```

### API

```typescript
// Add caching
revalidate: 60; // 1 minute ISR
```

### Images

```typescript
// Use Next.js Image optimization
<Image src={url} alt="..." width={800} height={600} />
```

---

**Still stuck?** → Email support@onionai.dev with diagnostics
