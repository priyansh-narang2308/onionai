# API Reference

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

All endpoints require JWT from Clerk in Authorization header:

```
Authorization: Bearer <clerk_jwt_token>
```

---

## Posts API

### List Posts

```
GET /api/post
```

**Query Parameters:**

- `status` (optional): `draft|queue|published|failed`
- `channel_id` (optional): Filter by channel
- `from_date` (optional): ISO date (YYYY-MM-DD)
- `to_date` (optional): ISO date (YYYY-MM-DD)
- `limit` (optional): Default 50, max 100
- `offset` (optional): For pagination

**Response:**

```json
{
  "data": [
    {
      "id": "post-123",
      "title": "My Great Post",
      "content": "This is the content",
      "channels": [
        {
          "id": "channel-1",
          "platform": "twitter",
          "account_name": "@myhandle"
        }
      ],
      "scheduled_at": "2024-12-25T10:00:00Z",
      "status": "queue",
      "published_at": null,
      "published_urls": {},
      "images": [
        {
          "url": "https://...",
          "alt_text": "..."
        }
      ],
      "metadata": {
        "engagement_score": 42
      },
      "created_at": "2024-12-01T10:00:00Z",
      "updated_at": "2024-12-01T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 0,
  "limit": 50
}
```

### Create Post

```
POST /api/post
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "My Great Post",
  "content": "This is the content",
  "channel_ids": ["channel-1", "channel-2"],
  "scheduled_at": "2024-12-25T10:00:00Z",
  "images": [
    {
      "url": "https://...",
      "alt_text": "Image description"
    }
  ],
  "metadata": {
    "source": "idea-123"
  }
}
```

**Response:** 201 Created

```json
{
  "id": "post-123",
  "status": "draft",
  "created_at": "2024-12-01T10:00:00Z",
  ...
}
```

### Get Post

```
GET /api/post/[id]
```

**Response:** 200 OK

```json
{
  "id": "post-123",
  ...
}
```

### Update Post

```
PATCH /api/post/[id]
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "scheduled_at": "2024-12-26T10:00:00Z"
}
```

**Response:** 200 OK

### Delete Post

```
DELETE /api/post/[id]
```

**Response:** 204 No Content

### Publish Post Manually

```
POST /api/post/[id]/publish
```

**Note:** Sets post to `queue` status. Inngest cron will publish after next 10-minute interval.

**Response:** 200 OK

```json
{
  "status": "queue",
  "message": "Post queued for publishing"
}
```

### Generate AI Variations

```
POST /api/post/generate-post
Content-Type: application/json
```

**Request Body:**

```json
{
  "content": "Original content",
  "action": "rephrase|expand|shorten|professional|casual|emoji"
}
```

**Response:** 200 OK

```json
{
  "original": "Original content",
  "generated": "Rephrased version of content",
  "action": "rephrase"
}
```

### Get Post Statistics

```
GET /api/post/totals
```

**Response:** 200 OK

```json
{
  "draft": 5,
  "queue": 2,
  "published": 47,
  "failed": 1,
  "total": 55,
  "success_rate": 0.94,
  "avg_engagement": 127
}
```

---

## Ideas API

### List Ideas

```
GET /api/idea
```

**Query Parameters:**

- `group_id` (optional): Filter by kanban group
- `limit` (optional): Default 50

**Response:**

```json
{
  "data": [
    {
      "id": "idea-123",
      "title": "Content Idea",
      "description": "This is about...",
      "group": "unassigned|todo|in_progress|done",
      "tags": ["marketing", "product"],
      "created_at": "2024-12-01T10:00:00Z",
      "updated_at": "2024-12-01T10:00:00Z"
    }
  ]
}
```

### Create Idea

```
POST /api/idea
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Content Idea",
  "description": "This is about...",
  "group": "unassigned",
  "tags": ["marketing"]
}
```

**Response:** 201 Created

### Update Idea

```
PATCH /api/idea/[id]
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Updated Title",
  "group": "in_progress"
}
```

**Response:** 200 OK

### Delete Idea

```
DELETE /api/idea/[id]
```

**Response:** 204 No Content

### Generate AI Ideas

```
POST /api/idea/generate-ideas
Content-Type: application/json
```

**Request Body:**

```json
{
  "context": "Product launch for new feature",
  "tone": "professional|casual|humorous"
}
```

**Response:** 200 OK

```json
{
  "ideas": [
    {
      "title": "Idea 1",
      "description": "Description of idea 1"
    },
    {
      "title": "Idea 2",
      "description": "Description of idea 2"
    },
    {
      "title": "Idea 3",
      "description": "Description of idea 3"
    }
  ]
}
```

---

## Channels API

### List Channels & Types

```
GET /api/channel
```

**Response:** 200 OK

```json
{
  "channels": [
    {
      "id": "channel-1",
      "platform": "twitter",
      "account_name": "@myhandle",
      "account_id": "123456789",
      "connected_at": "2024-12-01T10:00:00Z",
      "expires_at": "2025-03-01T10:00:00Z",
      "is_active": true
    }
  ],
  "available_types": [
    {
      "id": "twitter",
      "name": "Twitter/X",
      "icon": "twitter",
      "color": "#1DA1F2"
    },
    ...
  ]
}
```

### Start OAuth Flow

```
GET /api/channel/connect?platform=twitter
```

**Query Parameters:**

- `platform` (required): `twitter|linkedin|instagram|facebook|threads|bluesky|youtube|tiktok`

**Response:** 302 Redirect

```
Location: https://platform.com/oauth/authorize?...
```

### OAuth Callback Handler

```
GET /api/channel/callback?code=...&state=...
```

**Note:** Called automatically by social platform after user authorizes.

**Response:** 302 Redirect to Dashboard

```
Location: /dashboard/settings#channels
```

### Disconnect Channel

```
POST /api/channel/disconnect
Content-Type: application/json
```

**Request Body:**

```json
{
  "channel_id": "channel-1"
}
```

**Response:** 200 OK

```json
{
  "message": "Channel disconnected"
}
```

---

## Graph API

### Get Graph Visualization Data

```
GET /api/graph
```

**Query Parameters:**

- `limit` (optional): Max nodes to return, default 100

**Response:** 200 OK

```json
{
  "statistics": {
    "total_ideas": 42,
    "total_posts": 89,
    "total_channels": 5,
    "connections": 234
  },
  "nodes": [
    {
      "id": "idea-1",
      "type": "Idea",
      "label": "Q1 Marketing Push",
      "properties": {
        "created_at": "2024-12-01"
      }
    },
    {
      "id": "post-1",
      "type": "Post",
      "label": "My Great Post",
      "properties": {
        "status": "published"
      }
    }
  ],
  "relationships": [
    {
      "id": "rel-1",
      "from": "idea-1",
      "to": "post-1",
      "type": "INSPIRED_BY"
    }
  ]
}
```

---

## Translation API

### Translate Content

```
POST /api/sarvam/translate
Content-Type: application/json
```

**Request Body:**

```json
{
  "text": "Your content here",
  "target_language": "hi|ta|te|kn|ml|mr|gu|bn"
}
```

**Language Codes:**

- `hi` - Hindi
- `ta` - Tamil
- `te` - Telugu
- `kn` - Kannada
- `ml` - Malayalam
- `mr` - Marathi
- `gu` - Gujarati
- `bn` - Bengali

**Response:** 200 OK

```json
{
  "original": "Your content here",
  "translated": "आपकी सामग्री यहाँ है",
  "language": "hi",
  "confidence": 0.98
}
```

---

## Image Upload API

### Upload Image

```
POST /api/upload-image
Content-Type: multipart/form-data
```

**Form Data:**

- `file` (required): Image file (JPEG, PNG, WebP, GIF)
- `alt_text` (optional): Accessibility text

**Response:** 200 OK

```json
{
  "url": "https://your-bucket.s3.amazonaws.com/images/abc123.jpg",
  "key": "images/abc123.jpg",
  "size": 245623,
  "alt_text": "User provided description"
}
```

---

## Error Handling

### Error Response Format

All errors return appropriate HTTP status codes and JSON body:

```json
{
  "error": {
    "code": "PLATFORM_ERROR",
    "message": "User-friendly error message",
    "details": {
      "platform": "twitter",
      "statusCode": 429,
      "body": "Rate limit exceeded"
    }
  }
}
```

### Error Codes

| Code               | Status | Description                           |
| ------------------ | ------ | ------------------------------------- |
| `UNAUTHORIZED`     | 401    | Missing or invalid JWT                |
| `FORBIDDEN`        | 403    | User not authorized for this resource |
| `NOT_FOUND`        | 404    | Resource doesn't exist                |
| `VALIDATION_ERROR` | 400    | Invalid request data                  |
| `OAUTH_FAILED`     | 400    | OAuth connection failed               |
| `TOKEN_EXPIRED`    | 401    | Social platform token expired         |
| `RATE_LIMITED`     | 429    | Too many requests                     |
| `PLATFORM_ERROR`   | 500    | Social platform API error             |
| `INTERNAL_ERROR`   | 500    | Server error                          |

---

## Rate Limiting

All endpoints are rate limited:

```
Default: 100 requests per minute per user
Timeline endpoints: 30 requests per minute
Publishing endpoints: 10 requests per minute
```

Rate limit headers in response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640001000
```

---

## Webhooks (Future)

```
POST /api/webhooks/platform-events
```

Subscribe to real-time events:

- Post published
- Engagement metrics
- Comment received
- Platform error

---

## Example Requests

### Create and Publish Post

```bash
# 1. Create post
curl -X POST http://localhost:3000/api/post \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "Hello world!",
    "channel_ids": ["channel-1"],
    "scheduled_at": "2024-12-25T10:00:00Z"
  }'

# Response: { "id": "post-123", "status": "draft" }

# 2. Publish post
curl -X POST http://localhost:3000/api/post/post-123/publish \
  -H "Authorization: Bearer $JWT"

# Response: { "status": "queue", "message": "..." }

# 3. Monitor publishing (check every 10 minutes)
curl -X GET http://localhost:3000/api/post/post-123 \
  -H "Authorization: Bearer $JWT"

# Wait for status: "published" or "failed"
```

### Connect Social Channel

```bash
# 1. Start OAuth flow
open "http://localhost:3000/api/channel/connect?platform=twitter"

# 2. User authorizes and is redirected to /api/channel/callback
# 3. Verify connection
curl -X GET http://localhost:3000/api/channel \
  -H "Authorization: Bearer $JWT"

# Response includes new channel with platform="twitter"
```

### Generate AI Ideas

```bash
curl -X POST http://localhost:3000/api/idea/generate-ideas \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "context": "New product launch",
    "tone": "professional"
  }'

# Response includes 3 AI-generated ideas
```

---

## SDK Usage (Coming Soon)

```typescript
import { OnionAI } from "@onionai/sdk";

const client = new OnionAI({
  token: "your-jwt-token",
  baseUrl: "https://your-domain.com/api",
});

// Create post
const post = await client.posts.create({
  title: "My Post",
  content: "...",
  channel_ids: ["channel-1"],
  scheduled_at: new Date(),
});

// List ideas
const ideas = await client.ideas.list();

// Translate
const translated = await client.translate({
  text: "Hello world",
  language: "hi",
});
```

---

## Documentation

For more details:

- [Setup Guide](./SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Architecture](./ARCHITECTURE.md)
