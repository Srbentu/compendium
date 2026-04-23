# Compendium — Proof of Concept Document

> Proof that the core value proposition works before building the full product.

---

## 1. What We're Proving

**Hypothesis:** People want a single place to get AI-curated digests about topics they care about, delivered in their preferred format (text or audio).

**Core questions to answer:**

1. Can we reliably fetch relevant content from multiple sources for any given topic?
2. Can an AI synthesize a useful, accurate digest from collected content?
3. Can we convert that digest to audio at acceptable quality and cost?
4. Would people actually use this?

---

## 2. Proof Architecture

This proof of concept validates the **entire pipeline end-to-end** with minimal UI:

```
[Topic Input] → [Source Fetching] → [AI Synthesis] → [Digest Output] → [Audio Conversion]
```

No auth, no database, no deployment. Just the core loop.

---

## 3. Proof Scope

### ✅ In Scope
- Fetch content from 2 source types: RSS + NewsAPI
- AI-synthesize a digest for a given topic
- Convert digest to audio (MP3)
- Display digest as text in a simple page
- Play audio from the same page
- Measure: time, cost, quality

### ❌ Out of Scope
- User authentication
- Database persistence
- Multiple users
- Scheduling/cron
- Email notifications
- Mobile/PWA
- Source auto-discovery

---

## 4. Proof Implementation

### 4.1 API Endpoints (Minimal)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/proof/generate` | POST | Submit a topic, get a digest |
| `/api/proof/digest/[id]` | GET | Retrieve generated digest |

### 4.2 Proof Flow

```
1. User enters a topic (e.g., "JavaScript")
2. System fetches RSS + NewsAPI articles for that topic
3. System sends articles to OpenAI for synthesis
4. System returns text digest
5. System converts digest to audio via TTS
6. System returns digest + audio URL
7. Page displays text digest + inline audio player
```

### 4.3 Proof Page

A single page with:
- Text input: "Enter a topic"
- Button: "Generate Digest"
- Loading state: "Fetching sources... Synthesizing... Generating audio..."
- Result: text digest + audio player

---

## 5. Success Criteria

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Content relevance** | ≥ 3 relevant articles per topic | Manual review of fetched items |
| **Digest accuracy** | No fabricated facts, all claims sourced | Manual review of 5 digests |
| **Digest quality** | "Would I read this daily?" — Yes from 3/5 testers | User feedback |
| **Audio quality** | Understandable, natural-sounding | Listen to 3 samples |
| **End-to-end time** | < 60 seconds per digest | Stopwatch |
| **Cost per digest** | < $0.05 | OpenAI API billing |
| **Source coverage** | Works for tech, news, and entertainment topics | Test 3 different topic categories |

### Go/No-Go Decision

- **GO** if: accuracy ✓, quality ✓, cost ✓, 3/5 testers say they'd use it
- **NO-GO** if: AI fabricates facts, quality is poor, or no one wants it

---

## 6. Test Plan

### Test Topics (3 categories)

| Category | Topic | Expected Sources |
|----------|-------|-----------------|
| Technology | "JavaScript" | CSS-Tricks RSS, r/javascript, Dev.to |
| Geopolitics | "Iran" | BBC RSS, Reuters RSS, NewsAPI |
| Entertainment | "A Song of Ice and Fire" | Reddit r/asoiaf, YouTube transcripts |

### Test Procedure

For each topic:

1. **Fetch** — Call source fetchers, count results, assess relevance
2. **Synthesize** — Generate digest, review for accuracy
3. **Audio** — Convert to MP3, listen for quality
4. **Measure** — Time each step, calculate cost
5. **Rate** — "Would I consume this daily? (1-5)"

### Tester Questions (after trying the PoC)

1. "Did the digest capture what matters about this topic?"
2. "Was anything missing or inaccurate?"
3. "Would you prefer text or audio?"
4. "How often would you check this? Daily / Weekly / Occasionally?"
5. "What topics would you actually subscribe to?"
6. "What would make this a daily habit for you?"
7. "On a scale of 1-10, how likely are you to use this?"

---

## 7. Cost Proof

### Per-digest cost breakdown

| Step | Service | Est. Cost |
|------|---------|-----------|
| Source fetching | RSS (free) + NewsAPI (free tier) | $0.00 |
| AI synthesis | GPT-4o-mini (~4K tokens) | ~$0.002 |
| Audio generation | OpenAI TTS (~800 words) | ~$0.003 |
| Audio storage | Cloudflare R2 | ~$0.001 |
| **Total per digest** | | **~$0.006** |

### At scale (1000 users × 3 topics × daily)

| Metric | Value |
|--------|-------|
| Digests/day | 3,000 |
| Cost/day | ~$18 |
| Cost/month | ~$540 |
| Revenue needed (break-even at $5/user/month) | 108 users |

---

## 8. Technical Risks for PoC

| Risk | Impact | Mitigation |
|------|--------|------------|
| NewsAPI returns irrelevant results | Digest quality drops | Filter by keyword match before sending to AI |
| AI hallucinates facts | Trust destroyed | Explicit instruction: "only synthesize, never create" + always cite sources |
| RSS feeds timeout | Missing content | Set 10s timeout, skip failed sources |
| TTS audio sounds robotic | Audio not usable | Test with OpenAI TTS "nova" voice (most natural) |
| Pipeline takes > 60s | Bad UX | Show progress steps, fetch sources in parallel |

---

## 9. What Happens After the PoC

### If GO ✅
1. Build Sprint 1 (auth + topic CRUD + dashboard)
2. Set up database (Neon + Drizzle)
3. Add scheduling (BullMQ + cron)
4. Add user accounts and persistence
5. Deploy MVP

### If NO-GO ❌
1. Pivot the format (e.g., weekly instead of daily?)
2. Pivot the audience (e.g., teams instead of individuals?)
3. Pivot the delivery (e.g., email-only, no web app?)
4. Kill the project and try something else

---

## 10. PoC Timeline

| Day | Task | Deliverable |
|-----|------|-------------|
| Day 1 | Build proof page + API | Single page that accepts a topic |
| Day 2 | Wire RSS + NewsAPI fetchers | Articles appear in console |
| Day 3 | Wire AI synthesis | Text digest appears on page |
| Day 4 | Wire TTS | Audio player works |
| Day 5 | Polish + test 3 topics | Working demo for testers |
| Day 6-7 | Collect feedback from 5 people | Go/No-Go decision |

**1 week to validate the entire idea.**

---

## 11. Appendix: PoC vs MVP

| Aspect | PoC | MVP |
|--------|-----|-----|
| Users | You + 5 testers | 100+ real users |
| Auth | None | Email/password |
| Database | None (in-memory) | PostgreSQL (Neon) |
| Persistence | None | Full CRUD |
| Scheduling | Manual trigger | Automated (daily/weekly) |
| Sources | 2 (RSS + NewsAPI) | 2 + Reddit + YouTube |
| Delivery | Web page only | Web + email + podcast RSS |
| Audio | OpenAI TTS | OpenAI TTS + R2 storage |
| Cost tracking | Manual | Automated per-user |
| Mobile | None | PWA |

---

*Proof of Concept Document — Compendium Project*
*Created: 2026-04-23*
*Author: Gandalf 🧙‍♂️*
*Project by: Breno — web engineer in Berlin*