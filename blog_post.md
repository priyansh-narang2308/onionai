# How We Built a Cross-Platform Social Scheduler with Next.js 16, Expo SDK 55, and Neo4j

We have been posting to Twitter, LinkedIn, and Instagram for about two years now. And honestly? The tooling around scheduling posts across multiple platforms is terrible.

Buffer wants us to pay $60/month for features we do not need. Hootsuite has so many nested menus that we lose track of where we are. And every "AI-powered" alternative we tried just copies the same text verbatim to every platform, hashtags and all. That looks fine on Instagram. On LinkedIn, it looks like spam. On Twitter, you blow past the character limit and the post just gets truncated mid-sentence.

So we decided to build our own. We called it Onion AI, because the idea is to peel away the unnecessary complexity that these tools pile on top of a fundamentally simple task: write something once, format it correctly for each platform, and schedule it.

This post is a walkthrough of the technical decisions, the stack, the bugs that cost us hours, and what we would do differently. The full source code is on GitHub at [github.com/batmanven/onionai](https://github.com/batmanven/onionai) if you want to follow along.

---

## Choosing the Stack

We wanted something that would compile fast, look good out of the box, and let us move quickly. Here is what we landed on:

**Next.js 16 with Turbopack** was the obvious choice for the web frontend. We had been using Next.js 14 at work and the difference in dev server startup time with Turbopack is night and day. Hot reloads happen in under 3 seconds. React Server Components also meant we could keep most of the page rendering on the server and ship less JavaScript to the client.

**Tailwind CSS v4** was a risk. v4 is a complete rewrite — the config file is gone, everything lives in CSS now via `@theme` blocks. We spent a full afternoon figuring out how to get custom Google Fonts working with it (more on that later). But once it clicked, the DX was genuinely better. Being able to define design tokens directly in CSS and reference them as utilities felt right.

**Clerk** handles authentication. We needed OAuth flows for Twitter and LinkedIn anyway, and Clerk's middleware integration with Next.js meant we could protect API routes with two lines of code. The session tokens it generates are JWTs that we can pass straight through to our database layer.

**Inngest** runs the actual post dispatch. When you hit "Schedule", the post does not get published synchronously. It gets enqueued as an Inngest event, which handles retries, rate limiting, and cron-based scheduling in the background. This was important because Twitter's API in particular has aggressive rate limits and we did not want failed publishes to block the UI.

---

## The Composer: Write Once, Adapt Per Platform

The central feature is what we call the Unified Composer. You write your post once, pick which platforms you want to target, and the system reformats the content for each one.

This sounds simple but the formatting rules are surprisingly different:

- **Twitter/X** has a hard 280-character limit. You need to be concise. Hashtags go at the end, not inline.
- **LinkedIn** prefers longer, paragraph-spaced content. Inline hashtags actually work here. The tone is more professional.
- **Instagram** captions can be long but the first line needs to hook. All hashtags go in a block at the bottom.

We wrote a platform adapter that takes the raw draft and transforms it per platform. Here is a condensed version:

```typescript
export function adaptDraft(rawText: string, platform: string): PlatformDraft {
  switch(platform) {
    case 'TWITTER':
      return {
        platform: 'TWITTER',
        content: truncate(rawText, 280),
        charLimit: 280,
      };
    case 'LINKEDIN':
      return {
        platform: 'LINKEDIN',
        content: addParagraphSpacing(rawText) + "\n\n#socialmedia #devtools",
        charLimit: 3000,
      };
    case 'INSTAGRAM':
      return {
        platform: 'INSTAGRAM',
        content: rawText + "\n\n---\n" + extractHashtags(rawText),
        charLimit: 2200,
      };
    default:
      return { platform: 'TWITTER', content: rawText, charLimit: 280 };
  }
}
```

The actual implementation has more logic around tone presets (you can toggle between "original", "professional", "casual" styles) and live previews that render mock Twitter cards and LinkedIn article blocks so you can see exactly what the output looks like before scheduling.

---

## Bugs That Cost Us Real Time

These are the three problems that genuinely slowed us down during development. We are including them because we could not find good answers online for any of them, and maybe this saves someone a few hours.

### Clerk's Settings Route Would Not Stop Throwing Hydration Errors

We embedded Clerk's `<UserProfile>` component inside a `/settings` page. Every time the page loaded, we got this error in the console:

> Clerk: The UserProfile component is not configured correctly. The settings route is not a catch-all route.

The problem is that Clerk's embedded components expect to manage their own sub-routes internally (for things like switching between profile, security, and connected accounts tabs). But our Next.js route was a static page, not a catch-all `[...slug]` route.

We did not want to restructure our routing just for Clerk. The fix that worked was switching to hash-based routing:

```tsx
<UserProfile routing="hash" path="/settings" />
```

That tells Clerk to use URL hash fragments (`/settings#security`, `/settings#profile`) instead of real path segments. No more hydration mismatch, no route restructuring needed.

### Tailwind v4 Broke Our Custom Font Setup

In Tailwind v3, you would add custom fonts in `tailwind.config.js` under `theme.extend.fontFamily`. That file does not exist anymore in v4.

We use the Syne typeface from Google Fonts. We load it in `app/layout.tsx` using `next/font/google`, which gives us a CSS variable `--font-syne`. But Tailwind v4 did not know about it.

The solution is to register it in your CSS file inside a `@theme` block:

```css
@theme {
  --font-display: var(--font-syne);
}
```

Now `font-display` works as a utility class anywhere in the app. This is documented in the Tailwind v4 docs but it took us a while to find it because we kept searching for the old config file approach.

### Disabled Textareas Had an Ugly White Background

When a post is being dispatched, we temporarily disable the composer textarea to prevent edits. The problem is that browsers apply their own styling to disabled inputs, and on our dark-themed glassmorphism panels, disabled textareas got a solid white background that looked awful.

The fix is simple but it needs `!important` because browser UA stylesheets have high specificity on disabled states:

```css
textarea:disabled {
  background-color: transparent !important;
  opacity: 0.75;
}
```

We added this to `globals.css` and it solved the issue across every textarea in the app.

---

## Building the Mobile App with Expo SDK 55

After the web app was working, we wanted the same functionality on our phones. We used Expo SDK 55 with React Native and Expo Router to build a companion mobile app that shares the same backend.

The core constraint was that the mobile app had to hit the exact same API endpoints as the web app. Both use Clerk for auth — the web app uses `@clerk/nextjs` and the mobile app uses `@clerk/clerk-expo`. Since both produce the same JWT format, the backend does not care which client is making the request. We wrote a `fetchWithAuth` utility that attaches the Bearer token to every request:

```typescript
export async function fetchWithAuth(endpoint: string, options: RequestInit, getToken: Function) {
  const token = await getToken({ template: "insforge" });
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}
```

During development, the mobile app talks to the Next.js backend through an ngrok tunnel. This introduced a specific macOS bug that took us an embarrassingly long time to figure out: ngrok would randomly return 502 errors. The Next.js server was clearly running. Curling `http://127.0.0.1:3000` worked fine. But ngrok kept failing.

The issue was IPv6. When you run `ngrok http 3000`, ngrok resolves `localhost` and on macOS, that can resolve to `[::1]` (the IPv6 loopback) instead of `127.0.0.1`. If the Next.js dev server is only listening on IPv4, the connection gets refused and ngrok returns a 502.

The fix: `ngrok http 127.0.0.1:3000` instead of `ngrok http 3000`. Explicit IPv4 address, no ambiguity.

We also replaced the default Expo Router tab bar with a custom floating navigation dock. The default tab bar looks generic and we wanted something that matched the web app's design language — a floating pill bar with animated active state indicators. React Native's `LayoutAnimation` API handles the expand/collapse transitions when switching tabs. One thing to watch out for: `StyleSheet.create` in React Native is stricter about types than CSS. `fontWeight: "850"` compiles fine in CSS but React Native only accepts `"100"` through `"900"` in increments of 100. Same with `ActivityIndicator` — there is no `size="medium"`, only `"small"` or `"large"`.

---

## Adding Neo4j for Content Relationship Tracking

The relational database (a PostgreSQL-compatible store called InsForge) handles the transactional data: user accounts, posts, channels, scheduling metadata. But we realized that the interesting queries we wanted to run were all graph-shaped.

For example: "Show me every post that was derived from this idea, across all platforms, and how each one performed." In SQL, that is a multi-join query across ideas, posts, channels, and platform types. In a graph database, it is a single traversal.

We added Neo4j as a secondary data layer. The data model looks like this:

- **Nodes**: `Idea`, `Post`, `Channel`, `PlatformType`
- **Edges**: `INSPIRED` (Idea → Post), `PUBLISHED_TO` (Post → Channel), `BELONGS_TO` (Channel → PlatformType)

Querying this in Cypher is clean:

```cypher
MATCH (i:Idea {id: $ideaId})-[:INSPIRED]->(p:Post)-[:PUBLISHED_TO]->(c:Channel)
RETURN p.content, p.scheduled_at, c.handle
ORDER BY p.scheduled_at DESC
```

The tricky part was keeping Neo4j in sync with the primary PostgreSQL store. We did not want to dual-write from the API handlers because that couples the two systems and creates consistency issues if one write fails. Instead, we used Inngest events: every time a post or idea is created or updated in the primary store, the API handler emits an event, and an Inngest function picks it up and upserts the corresponding node and relationships in Neo4j. It is eventually consistent, but for analytics queries that is perfectly fine.

Other Neo4j-specific things we ran into:
- **Cold starts are slow.** Neo4j runs on the JVM and the first query after a fresh start takes noticeably longer. We keep a persistent Docker container running locally instead of starting it fresh each session.
- **There are no migration files.** Unlike SQL databases where you write migration scripts, Neo4j is schema-optional. We wrote a boot script that runs on application startup to create uniqueness constraints and indexes on properties we query frequently.

---

## What We Would Do Differently

If we started over, we would skip building the custom OAuth flows from scratch. We implemented raw OAuth2 authorization code flows for Twitter and LinkedIn, handling token exchange, refresh logic, and encrypted storage manually. It works, but libraries like NextAuth or Clerk's own OAuth connections would have saved time.

We would also set up the Neo4j sync pipeline from the beginning instead of adding it retroactively. Retrofitting a secondary data store into an existing API layer always creates edge cases around data that was created before the sync existed.

---

## Try It Yourself

The full codebase is open source:

- **Repository**: [github.com/batmanven/onionai](https://github.com/batmanven/onionai)
- **Quick start**:
  ```bash
  git clone https://github.com/batmanven/onionai.git
  cd onionai
  npm install
  npm run dev
  ```

If you have questions about any of the implementation details, open an issue on the repo or leave a comment below. We are happy to dig into specifics.
