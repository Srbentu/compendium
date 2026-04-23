# AGENTS.md — Compendium Project Guide

> This file is the entry point for any AI agent (Copilot, Cursor, Claude Code, etc.) working on this project. Read it first.

## Project Overview

**Compendium** is an intelligent content aggregator. Users choose topics they care about, an AI curates and synthesizes the most relevant content, and delivers it in the format they prefer — text or audio/podcast.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 15 (App Router) | Server Components, API Routes |
| Language | TypeScript (strict mode) | No `any` types allowed |
| Styling | Tailwind CSS v4 + shadcn/ui | Use shadcn components, don't reinvent |
| Database | PostgreSQL (Neon) | Serverless, connection pooling |
| ORM | Drizzle ORM | Type-safe queries and migrations |
| Auth | NextAuth.js v4 | JWT strategy, Credentials provider |
| Queue | BullMQ + Redis (Upstash) | Background jobs for pipeline |
| AI | OpenAI GPT-4o-mini | Content synthesis and source suggestion |
| TTS | OpenAI TTS (tts-1) | Audio generation for digests |
| Storage | Cloudflare R2 | S3-compatible, free egress |
| Email | Resend | Digest notifications |
| Validation | Zod | Runtime + compile-time validation |
| Testing | Vitest + MSW + Playwright | Unit, integration, E2E |
| Deploy | Vercel | CI/CD via GitHub Actions |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, signup)
│   ├── (dashboard)/        # Dashboard pages (authenticated)
│   ├── api/                # API routes
│   │   ├── auth/            # NextAuth handlers
│   │   ├── topics/         # CRUD endpoints
│   │   ├── digests/        # Digest endpoints
│   │   └── pipeline/       # Pipeline trigger endpoint
│   └── topic/              # Public topic pages (SEO)
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── layout/             # Header, Footer, Sidebar
│   ├── topics/             # Topic-related components
│   ├── digests/            # Digest display components
│   └── player/             # Audio player
├── lib/
│   ├── ai/                 # OpenAI integration (synthesis, source suggestion)
│   ├── auth/               # NextAuth configuration
│   ├── db/                 # Drizzle schema, queries, migrations
│   ├── pipeline/           # Content pipeline (RSS, NewsAPI fetchers)
│   ├── tts/                # Text-to-speech (OpenAI TTS)
│   ├── delivery/           # Notifications (email, push)
│   ├── utils/              # Utility functions
│   └── validations/        # Zod schemas
├── hooks/                  # Custom React hooks
├── config/                 # App configuration
└── types/                  # Global TypeScript types

e2e/                        # Playwright E2E tests
__tests__/                  # Test setup + fixtures
```

## Key Concepts

### Topics
A topic is what a user subscribes to (e.g., "JavaScript", "Iran War", "A Song of Ice and Fire"). Each topic has a slug, frequency (daily/weekly), format preference (text/audio/both), and language.

### Sources
Sources are content feeds attached to a topic. Types: RSS, NewsAPI, Reddit, YouTube. Sources can be auto-suggested by the AI or manually added by the user.

### Raw Items
Raw items are articles/posts collected from sources. They are stored before synthesis and serve as the basis for digests.

### Digests
A digest is the AI-synthesized output for a topic over a time period. It contains:
- **Text content** — structured summary (Urgent / Important / Context)
- **Audio** — TTS-generated MP3 (if format preference includes audio)
- **Status** — pending → generating → generated → delivered

### Pipeline
The content pipeline runs daily (or weekly) and:
1. Fetches new items from all active sources
2. Stores raw items in the database
3. Sends collected items to AI for synthesis
4. Generates audio via TTS if needed
5. Stores the digest
6. Notifies the user

## Coding Conventions

### TypeScript
- Strict mode enabled (`strict: true`)
- No `any` types — use `unknown` and narrow
- Use Zod schemas for all API inputs and external data
- Prefer `interface` for object types, `type` for unions/intersections
- Use `as const` for literal types

### Naming
- Files: `kebab-case.ts` (e.g., `rss-fetcher.ts`)
- Components: `PascalCase.tsx` (e.g., `TopicCard.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-topics.ts`)
- Database columns: `snake_case` (Drizzle convention)
- API routes: `kebab-case` directories

### React
- Server Components by default — add `"use client"` only when needed
- Use shadcn/ui components — don't create custom UI primitives
- Colocate tests: `__tests__/` directories next to the code they test

### Database
- Always use Drizzle ORM — no raw SQL
- Schema changes → `npm run db:generate` → `npm run db:migrate`
- Use `cuid2` for IDs (not UUIDs)

### API Routes
- Validate all inputs with Zod before processing
- Return proper HTTP status codes
- Use `try/catch` with typed error responses
- Follow REST conventions: GET for reads, POST for creates, PATCH for updates, DELETE for deletes

### Testing
- Unit tests: `vitest` in `src/**/__tests__/`
- Integration tests: `vitest` with MSW for API mocking
- E2E tests: `playwright` in `e2e/`
- Aim for 80%+ coverage on `lib/` code
- Always mock external APIs (OpenAI, NewsAPI, etc.) in tests

### SEO
- Use Next.js Metadata API for all pages
- Add JSON-LD structured data (Schema.org)
- Clean URLs: `/topic/[slug]`, `/topic/[slug]/digest/[date]`
- Canonical URLs on all pages
- Sitemap auto-generated via `next-sitemap`

### Git
- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`
- Commit messages: conventional commits (e.g., `feat: add topic creation API`)
- PRs required for main branch

## Environment Variables

See `.env.example` for the full list. Required for dev:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000`

Optional for dev (features will be mocked):
- `OPENAI_API_KEY` — Required for AI synthesis
- `NEWSAPI_KEY` — Required for NewsAPI source
- `REDIS_URL` — Required for background jobs

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run unit/integration tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run Playwright E2E tests
npm run db:generate  # Generate Drizzle migration
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking
```

## Architecture Decisions

1. **Next.js API routes over separate backend** — Simpler deployment, single codebase, SSR for SEO
2. **Drizzle over Prisma** — Lighter, better SQL control, type-safe without code generation step
3. **BullMQ over cron** — Reliable job queue with retries, scheduling, and monitoring
4. **OpenAI over self-hosted LLM** — Faster to ship, better quality, cheap at GPT-4o-mini scale
5. **Zod everywhere** — Single source of truth for validation (runtime + type inference)
6. **Neon PostgreSQL over Supabase** — Simpler, serverless, better cold start

## Important Notes

- All code and comments must be in **English**
- User-facing content (UI text, digests) supports **Portuguese (pt-BR)** and **English (en)**
- The project is in early MVP stage — prioritize shipping over perfection
- When in doubt, check the design doc at `../contexto-design-doc.md`