# Compendium

> Intelligent content aggregator. Choose your topics, AI curates and synthesizes, and you consume your way — text or audio.

## What It Is

Compendium solves a simple problem: **information is chaos**. You want to stay informed about JavaScript, geopolitics, or the book saga you're reading — but digging through sources, filtering noise, and finding time to consume everything is exhausting.

With Compendium, you:

1. **Choose topics** — "JavaScript", "Iran War", "A Song of Ice and Fire"
2. **Receive curated digests** — AI finds relevant sources and synthesizes what matters
3. **Consume your way** — text on the web or audio/podcast to listen anywhere

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS + shadcn/ui |
| API | Next.js API routes + tRPC |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Queue | BullMQ + Redis (Upstash) |
| AI | OpenAI GPT-4o-mini |
| TTS | OpenAI TTS |
| Storage | Cloudflare R2 |
| Auth | NextAuth.js |
| Testing | Vitest + MSW + Playwright |
| Deploy | Vercel |

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

## Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run test` | Unit + integration tests |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run test:coverage` | Test coverage |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Drizzle Studio (visualize database) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type checking |

## Project Structure

```
src/
├── app/                    # Next.js routes (App Router)
│   ├── (auth)/             # Authentication pages
│   ├── (dashboard)/        # Dashboard (authenticated)
│   ├── api/                # API routes
│   └── topic/              # Public topic pages (SEO)
├── components/             # React components
│   ├── ui/                 # Base components (shadcn)
│   ├── layout/             # Layout components
│   ├── topics/             # Topic-related components
│   ├── digests/            # Digest components
│   └── player/             # Audio player
├── lib/                    # Business logic
│   ├── ai/                 # AI synthesis (OpenAI)
│   ├── auth/               # Authentication (NextAuth)
│   ├── db/                 # Schema + queries (Drizzle)
│   ├── pipeline/           # Content pipeline (RSS, NewsAPI)
│   ├── tts/                # Text-to-speech
│   ├── delivery/           # Notifications (email, push)
│   ├── utils/              # Utilities
│   └── validations/        # Zod schemas
├── hooks/                  # Custom React hooks
├── config/                 # App configuration
└── types/                  # Global TypeScript types

e2e/                        # Playwright E2E tests
__tests__/                  # Tests + fixtures
```

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `NEXTAUTH_SECRET` | Secret for NextAuth |
| `NEXTAUTH_URL` | Base URL of the app |
| `OPENAI_API_KEY` | OpenAI API key |
| `NEWSAPI_KEY` | NewsAPI key |
| `REDIS_URL` | Redis URL (Upstash) |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key |
| `R2_BUCKET` | R2 bucket name |
| `RESEND_API_KEY` | Resend API key (email) |

## Documentation

- [Design Doc](./design-doc.md) — Complete design and architecture document

## License

MIT