# Compendium — Design Doc

> Intelligent content aggregator. Users choose topics, AI curates and synthesizes, and delivers in the format they prefer.

---

## 1. Overview

**Problem:** Information is chaos. Anyone who wants to stay informed about a topic needs to dig through multiple sources, filter noise, and still find time to consume it all.

**Solution:** Users subscribe to topics. The system fetches relevant sources, a curator AI synthesizes what matters, and delivers in the preferred format — text on the web, or audio/podcast to listen anywhere.

**Project name:** Compendium

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Topics  │  │  Digest  │  │  Player  │  │  Config  │ │
│  │   CRUD   │  │  Reader  │  │  Audio   │  │  Format  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ REST / tRPC
┌────────────────────────▼────────────────────────────────┐
│                     API (Node.js)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Topics  │  │ Digests  │  │ Sources  │  │ Delivery │ │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└───────┬──────────────┬──────────────┬────────────────────┘
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌────▼─────────┐
│   Pipeline   │ │    AI      │ │    TTS       │
│   Worker     │ │ Synthesis  │ │   Worker     │
│              │ │            │ │              │
│ • RSS Fetch  │ │  • OpenAI  │ │ • ElevenLabs │
│ • NewsAPI    │ │  • Claude  │ │ • OpenAI     │
│ • Reddit     │ │            │ │              │
│ • YouTube    │ │            │ │              │
└──────────────┘ └────────────┘ └──────────────┘
        │              │              │
┌───────▼──────────────▼──────────────▼────────────────────┐
│                    PostgreSQL + Redis                     │
│  • topics    • sources     • digests                    │
│  • users     • jobs        • audio_files (S3/R2)        │
└─────────────────────────────────────────────────────────┘
```

### Main Flow

1. **Ingestion (Pipeline Worker)** — Cron job fetches sources periodically
   - RSS feeds → parses new articles
   - NewsAPI → searches by topic keyword
   - Reddit → relevant subreddits, hot posts
   - YouTube → transcripts from recent videos on relevant channels

2. **Curation (AI Synthesis)** — For each topic, the AI:
   - Receives articles/posts collected in the last 24h
   - Filters relevance (not everything that appears is digest-worthy)
   - Synthesizes: "what happened that matters"
   - Generates a structured text digest

3. **Format (TTS Worker)** — If the user prefers audio:
   - Converts text digest → audio via TTS
   - Generates a podcast "episode" per topic
   - Available via podcast RSS feed (for native apps) and web player

4. **Delivery** — Notifies the user:
   - Push notification (web) or email
   - Digest available on the dashboard
   - Podcast episode in the feed

---

## 3. Data Model

```sql
-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Topics users subscribe to
CREATE TABLE topics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  title         TEXT NOT NULL,            -- "JavaScript", "Iran War"
  description   TEXT,                     -- extra context for AI to search better
  frequency     TEXT DEFAULT 'daily',     -- daily | weekly
  format_pref   TEXT DEFAULT 'text',      -- text | audio | both
  language      TEXT DEFAULT 'pt',        -- digest language
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Sources associated with a topic (auto-discovered or manual)
CREATE TABLE sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id      UUID REFERENCES topics(id),
  type          TEXT NOT NULL,            -- rss | newsapi | reddit | youtube
  url           TEXT,                     -- feed/subreddit/channel URL
  label         TEXT,                     -- human-readable name
  is_auto       BOOLEAN DEFAULT true,     -- auto-discovery vs manual
  last_fetched  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Raw items collected
CREATE TABLE raw_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id     UUID REFERENCES sources(id),
  url           TEXT NOT NULL,
  title         TEXT,
  content       TEXT,                     -- extracted text
  published_at  TIMESTAMPTZ,
  fetched_at    TIMESTAMPTZ DEFAULT now()
);

-- Generated digests
CREATE TABLE digests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id      UUID REFERENCES topics(id),
  period_start  TIMESTAMPTZ NOT NULL,
  period_end    TIMESTAMPTZ NOT NULL,
  text_content  TEXT NOT NULL,            -- text digest
  audio_url     TEXT,                     -- audio file URL (S3/R2)
  audio_duration INTEGER,                -- seconds
  status        TEXT DEFAULT 'generated',  -- generated | delivered
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Source Pipeline — Details

### 4.1 RSS
- Library: `rss-parser` (Node) or `feedparser` (Python)
- For each topic, search relevant feeds via search or initial curation
- Deduplication by URL

### 4.2 NewsAPI
- Endpoint: `https://newsapi.org/v2/everything?q={topic}&language=pt|en`
- Free plan: 100 req/day (sufficient for MVP)
- Fallback: GNews API, MediaStack

### 4.3 Reddit
- Public API (OAuth2 with "script" app type)
- Fetch hot posts from relevant subreddits
- Use `praw` (Python) or direct fetch via JSON (`.json` suffix)

### 4.4 YouTube
- Search recent videos by keyword via YouTube Data API v3
- Transcribe with `youtube-transcript-api` (Python)
- Limit to channels with good reputation (subscribers > threshold)

### 4.5 Automatic Source Discovery
- When a user creates a topic, the AI suggests sources:
  - "For JavaScript, I recommend: CSS-Tricks (RSS), r/javascript (Reddit), Fireship (YouTube)"
  - Used once, then the system learns from feedback

---

## 5. AI Synthesis — Details

### Base Prompt (example for topic "Iran War"):

```
You are a specialized news curator. Below are articles and posts 
collected in the last 24h about "{{topic}}".

Your job:
1. Filter only what is relevant and new (don't repeat the obvious)
2. Organize by importance
3. Synthesize into a clear and direct digest
4. For each item, include: what happened, why it matters, and original link
5. If there's conflict between sources, point it out

Format:
## 🔴 Urgent
[most important items]

## 📌 Important
[relevant items]

## 💡 Context
[background that helps understand]

Articles:
---
{{articles}}
```

### Model
- **MVP:** OpenAI GPT-4o-mini (cheap, fast, good enough for synthesis)
- **Future:** Claude Haiku (better at long texts), or dynamic routing

### Estimated cost per digest
- ~3,000 tokens input × 1,000 tokens output
- GPT-4o-mini: ~$0.002/digest (practically nothing)

---

## 6. TTS — Details

### Options

| Service | Quality | Cost/min | Latency | PT-BR Voices |
|---------|---------|-----------|---------|---------------|
| ElevenLabs | ⭐⭐⭐⭐⭐ | ~$0.18 | ~3s | Yes |
| OpenAI TTS | ⭐⭐⭐⭐ | ~$0.015 | ~2s | Yes |
| Google Cloud TTS | ⭐⭐⭐ | ~$0.016 | ~1s | Yes |

**MVP Recommendation:** OpenAI TTS — good cost, good quality, PT-BR voices, simple integration.

### Output Format
- MP3, 128kbps (voice doesn't need more)
- Store in Cloudflare R2 ($0.015/GB/month, free egress)
- Generate podcast RSS feed per topic (for Apple Podcasts, Spotify, etc.)

### Estimated cost per audio digest
- ~800 word digest ≈ 5 min of audio
- OpenAI TTS: ~$0.003/digest
- R2 storage: negligible

---

## 7. Cron & Scheduling

```
Daily:
  06:00 UTC  → Pipeline fetches sources for all active topics
  07:00 UTC  → AI synthesis generates text digests
  07:30 UTC  → TTS converts digests for users with pref=audio
  08:00 UTC  → Delivery: notifies users

Weekly (topics with frequency=weekly):
  Sunday 18:00 UTC → same pipeline, but 7-day window
```

Implementation: cron on Node server (node-cron) or a separate worker with BullMQ + Redis.

---

## 8. Frontend — Mental Wireframe

### Dashboard
```
┌─────────────────────────────────────────────────┐
│  Compendium                              [Profile] │
├─────────────────────────────────────────────────┤
│                                                 │
│  My Topics                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ JavaScript   │  │  Iran War   │ │ + New    │ │
│  │ 📄 🔊       │  │ 📄 🔊      │ │         │ │
│  │ 3 digests   │  │ 5 digests   │ │         │ │
│  └─────────────┘  └─────────────┘  └─────────┘ │
│                                                 │
│  Latest Digest: JavaScript (23 Apr)            │
│  ┌─────────────────────────────────────────────┐│
│  │ 🔴 Urgent                                   ││
│  │ • Node.js 24 released with... [read] [▶ listen]│
│  │ • Deno 2.2 adds...           [read] [▶ listen]│
│  │                                              ││
│  │ 📌 Important                                  ││
│  │ • TC39 proposal for...       [read] [▶ listen] │
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Audio Player
- Inline player on the page (podcast style)
- Playback speed 1x / 1.5x / 2x
- Podcast RSS feed per topic (subscribe in podcast app)

---

## 9. MVP Scope (WHAT TO BUILD)

### ✅ Included
- [ ] Basic authentication (email/password or magic link)
- [ ] Topic CRUD (create, edit, delete)
- [ ] Source pipeline: RSS + NewsAPI (only these 2 to start)
- [ ] AI synthesis: daily text digest
- [ ] TTS: audio digest (OpenAI TTS)
- [ ] Dashboard: view topics and latest digests
- [ ] Inline audio player
- [ ] Email notification (simple, via Resend)
- [ ] Languages: PT-BR and EN

### ✅ Included (PWA — stepping stone to mobile)
- [ ] Service Worker for basic cache/offline
- [ ] Web App Manifest (install to home screen)
- [ ] Podcast RSS feed per topic (subscribe in Spotify/Apple/Google Podcasts)

### ❌ Not included (v2+)
- Video
- Social (sharing, comments)
- Advanced automatic source discovery
- YouTube/Reddit as source
- Native mobile app (see mobile roadmap below)
- Payment/monetization
- Dynamic multi-language
- Voice customization
- Native push notifications (iOS)
- Advanced SEO (i18n, hreflang, programmatic SEO, public topic pages)

---

## 10. Testing Strategy

### Test Pyramid

```
            ╱ ╲
           ╱ E2E╲          ← Playwright (few, critical)
          ╱──────╲
         ╱Integr. ╲         ← Vitest + MSW (sources, AI, API)
        ╱──────────╲
       ╱   Unit     ╲     ← Vitest (logic, utils, schemas)
      ╱────────────────╲
```

### Test Stack

| Type | Tool | Coverage |
|------|------|----------|
| Unit | Vitest | Utils, schemas (Zod), business logic, transformations |
| Integration | Vitest + MSW (Mock Service Worker) | API routes, source pipeline, AI synthesis, TTS |
| E2E | Playwright | Full flows: create topic, view digest, listen to audio |
| Contract | Zod schemas | Input/output validation at runtime (also serves as documentation) |

### Test Folder Structure

```
compendium/
├── src/
│   ├── app/                    # Next.js routes
│   │   └── __tests__/           # Integration tests per route
│   ├── lib/
│   │   ├── pipeline/
│   │   │   ├── rss-fetcher.ts
│   │   │   ├── newsapi-fetcher.ts
│   │   │   ├── synthesizer.ts
│   │   │   ├── tts-worker.ts
│   │   │   └── __tests__/       # Pipeline unit tests
│   │   ├── ai/
│   │   │   ├── prompts.ts
│   │   │   ├── digest.ts
│   │   │   └── __tests__/       # AI tests (mocked)
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── __tests__/       # Query tests
│   │   └── utils/
│   │       └── __tests__/       # Utility tests
│   └── ...
├── e2e/
│   ├── topics.spec.ts          # Create/edit/delete topic
│   ├── digest.spec.ts          # View digest, listen to audio
│   └── auth.spec.ts            # Login/signup
├── vitest.config.ts
├── vitest.integration.config.ts
└── playwright.config.ts
```

### What to test per Sprint

| Sprint | Tests |
|--------|-------|
| Sprint 1 | Unit: Zod schemas, utils. Integration: Topic CRUD via API |
| Sprint 2 | Unit: RSS parser, NewsAPI fetcher. Integration: pipeline with mocked sources |
| Sprint 3 | Unit: prompt builder, digest formatter. Integration: AI synthesis with mocked OpenAI |
| Sprint 4 | Unit: TTS formatter. Integration: audio generation with mocked OpenAI |
| Sprint 5 | E2E: full flow create topic → view digest → listen to audio |

### Minimum expected coverage

- **Unit:** 80%+ coverage in `lib/`
- **Integration:** All API endpoints + pipeline with mocks
- **E2E:** 3-5 critical flows (happy path)

### Mocks and Fixtures

- **MSW** to mock external APIs (OpenAI, NewsAPI, RSS feeds)
- **Fixtures** in `__tests__/fixtures/` with samples of:
  - RSS feeds
  - NewsAPI responses
  - OpenAI responses (synthesis and TTS)
  - Topic and digest data

### CI/CD

- GitHub Actions running:
  1. Lint (ESLint + Prettier)
  2. Type check (`tsc --noEmit`)
  3. Unit + integration tests (Vitest)
  4. E2E tests (Playwright) — only on PRs and main

---

## 10.5 SEO — Strategy

### Why SEO matters for Compendium

Compendium has an **SEO superpower**: every generated digest is fresh content, well-structured and updated daily. This is gold for search engines. If someone searches "latest news about JavaScript" or "Iran war summary", Compendium's public digest can be the result.

### SEO in MVP (foundation)

| Aspect | Implementation | Detail |
|--------|----------------|--------|
| Meta tags | Next.js Metadata API | Dynamic title, description, og:image per page |
| Open Graph | Metadata API | Pretty sharing on social networks |
| Sitemap | `next-sitemap` | Auto-generated, submitted to Google Search Console |
| robots.txt | `next-sitemap` | Allow indexing of public pages, block /api and /dashboard |
| Clean URLs | App Router | `/topic/javascript`, `/topic/javascript/digest/2026-04-23` |
| Structured Data | JSON-LD | Schema.org: `Article` for digests, `WebSite` for home |
| Performance | Core Web Vitals | SSR + minimal JS = LCP < 2.5s, CLS < 0.1 |
| Canonical | `<link rel="canonical">` | Avoid duplicate content between formats |

### Advanced SEO (v2+)

- **Public topic pages** — Each topic has an indexable landing page ("Latest news about JavaScript — updated daily")
- **Programmatic SEO** — Auto-generate pages for popular topics
- **i18n + hreflang** — PT and EN versions with hreflang tags
- **Public RSS feed** — Each topic has a subscribable RSS feed (doubles as crawlable SEO)
- **AMP** — Lightweight digest version for mobile

### SEO Checklist per Page

```
/ (home)
  → title: "Compendium — Your intelligent digest on any topic"
  → description: "Receive daily summaries about the topics that matter to you, in text or audio."
  → og:image: hero image
  → JSON-LD: WebSite + SearchAction

/topic/[slug]
  → title: "[Topic name] — Latest news and summary"
  → description: "Daily summary about [topic], updated on [date]."
  → JSON-LD: Article + dateModified
  → canonical: canonical URL

/topic/[slug]/digest/[date]
  → title: "[Topic] — Digest for [date]"
  → description: first lines of the digest
  → JSON-LD: Article + datePublished
  → canonical: canonical URL
```

---

## 11. Cost Estimate (MVP, ~100 users)

| Item | Cost/month |
|------|-----------|
| Hosting (Vercel or Railway) | $0-20 |
| PostgreSQL database (Supabase or Neon) | $0-25 |
| Redis (Upstash) | $0 |
| OpenAI API (synthesis + TTS) | ~$5-15 |
| NewsAPI | $0 (free tier) |
| Cloudflare R2 (audio storage) | ~$1 |
| Email (Resend) | $0 (free tier) |
| **Total** | **$6-61/month** |

For 100 users with ~3 topics each, ~300 digests/day — totally viable on free tiers for almost everything.

---

## 12. Final Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15 (App Router) | SSR, RSC, you already know it |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent |
| API | Next.js API routes (or tRPC) | Simple, no unnecessary microservice |
| Database | PostgreSQL (Neon) | Serverless, generous free tier |
| ORM | Drizzle ORM | Light, type-safe, works well with Neon |
| Queue | BullMQ + Redis (Upstash) | Pipeline jobs, retry, scheduling |
| AI | OpenAI GPT-4o-mini | Cheap and good synthesis |
| TTS | OpenAI TTS | Good, cheap, PT-BR |
| Storage | Cloudflare R2 | S3-compatible, free egress |
| Email | Resend | Simple, free tier |
| Deploy | Vercel | Next.js native, automatic CI/CD |
| Unit/Integration Tests | Vitest + MSW | Fast, same ecosystem as the app |
| E2E Tests | Playwright | Industry standard, multi-browser |
| Validation | Zod | Runtime + types, also documentation |

---

## 13. Implementation Order

### Sprint 1 (Week 1-2): Foundation
1. Next.js project setup + Tailwind + shadcn
2. PostgreSQL database + Drizzle + migrations
3. Basic authentication
4. Topic CRUD (frontend + API)

### Sprint 2 (Week 3-4): Pipeline
5. Source model + RSS integration
6. NewsAPI integration
7. Ingestion worker (BullMQ + cron)
8. Deduplication and raw_items storage

### Sprint 3 (Week 5-6): The Heart
9. AI synthesis: prompt engineering + OpenAI integration
10. Text digest generation
11. Dashboard: digest list + reading view

### Sprint 4 (Week 7-8): Audio
12. OpenAI TTS integration
13. R2 storage + audio generation
14. Inline audio player
15. Email notification

### Sprint 5 (Week 9-10): Polish
16. UI/UX refinement
17. Error handling and retry
18. Rate limiting
19. Basic tests
20. Deploy + landing page

---

## 14. Mobile Roadmap

| Phase | When | What | Mobile Delivery |
|-------|------|------|-----------------|
| **MVP** | Now | Web app + API-first + basic PWA | PWA + RSS podcast |
| **v1.5** | 2-3 months | Complete PWA: offline, Android push, install prompt | Functional PWA |
| **v2** | 6 months | Native app (React Native/Expo) | iOS + Android |

### Why PWA before native app
1. **Low cost** — same web codebase, works on mobile
2. **Fast feedback** — iterate without store review
3. **Android push** — Service Worker supports push notifications on Android
4. **Validation** — learn what users need before investing in a native app

### Why React Native/Expo in v2
- Same language (TypeScript) and same API
- Expo makes it easy: one codebase, iOS + Android
- If the API is already REST/tRPC, the app is "just another client"

### Architecture ready for app
- **API-first** — web frontend and future app consume the same API
- **State on server** — digests, topics, preferences live on the backend
- **Shared auth** — JWT/session that works on web and mobile
- **Agnostic push** — notification architecture that supports web push and APNs/FCM

---

## 15. Risks and Mitigations

| Risk | Probability | Mitigation |
|------|------------|------------|
| AI hallucination (making up news) | Medium | Always cite source + link. Never let the AI "create" news, only synthesize what was already collected |
| API cost higher than expected | Low | Monitor usage, rate limit per user, fallback to cheaper model |
| RSS feeds break/change | High | Periodic health check + fallback to scraping |
| Low user retention | Medium | Focus on digest quality > quantity. One excellent digest > 5 mediocre ones |
| NewsAPI free tier insufficient | Medium | Alternatives: GNews, MediaStack, or ethical scraping |

---

## 16. Next Steps

1. **Validate the idea** — Show it to 3-5 people and ask: "Would you use this? For which topic?" If no one gets excited, pivot before coding.

2. **Create the repo** — Next.js + stack above. Boilerplate already generated.

3. **First feature** — Topic CRUD + a hardcoded digest (no real pipeline, no real AI) to have something visual as fast as possible.

4. **PWA from day 1** — Manifest + basic service worker already in setup. Costs nothing and paves the way.

---

*Document created on 2026-04-23 by Gandalf 🧙‍♂️*
*Project by Breno — web engineer in Berlin*