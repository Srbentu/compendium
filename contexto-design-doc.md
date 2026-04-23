# Contexto — Design Doc

> Agregador de conteúdo inteligente. O usuário escolhe os assuntos, a IA cura e sintetiza, e entrega no formato que a pessoa consome.

---

## 1. Visão Geral

**Problema:** Informação é caos. Quem quer se manter informado sobre um assunto precisa garimpar múltiplas fontes, filtrar ruído, e ainda encontrar tempo pra consumir.

**Solução:** O usuário se inscreve em tópicos. O sistema busca fontes relevantes, uma IA curadora sintetiza o que importa, e entrega no formato preferido — texto na web, áudio/podcast para ouvir em qualquer lugar.

**Nome provisório:** Contexto

---

## 2. Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Tópicos  │  │  Digest  │  │ Player   │  │ Configs  │ │
│  │ CRUD     │  │  Reader  │  │  Audio   │  │ Formato  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ REST / tRPC
┌────────────────────────▼────────────────────────────────┐
│                     API (Node.js)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Topics   │  │ Digests  │  │ Sources   │  │ Delivery │ │
│  │ Service  │  │ Service  │  │ Service   │  │ Service  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└───────┬──────────────┬──────────────┬────────────────────┘
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌────▼─────────┐
│   Pipeline   │ │  AI        │ │  TTS         │
│   Worker     │ │  Synthesis │ │  Worker     │
│              │ │            │ │              │
│ • RSS Fetch  │ │ • OpenAI   │ │ • ElevenLabs │
│ • NewsAPI    │ │ • Claude   │ │ • OpenAI     │
│ • Reddit     │ │            │ │              │
│ • YouTube    │ │            │ │              │
└──────────────┘ └────────────┘ └──────────────┘
        │              │              │
┌───────▼──────────────▼──────────────▼────────────────────┐
│                    PostgreSQL + Redis                     │
│  • topics    • sources     • digests                     │
│  • users     • jobs        • audio_files (S3/R2)         │
└─────────────────────────────────────────────────────────┘
```

### Fluxo principal

1. **Ingestão (Pipeline Worker)** — Cron job busca fontes periodicamente
   - RSS feeds → parseia artigos novos
   - NewsAPI → busca por keyword do tópico
   - Reddit → subreddits relevantes, posts quentes
   - YouTube → transcrições de vídeos recentes de canais relevantes

2. **Curadoria (AI Synthesis)** — Para cada tópico, a IA:
   - Recebe os artigos/posts coletados nas últimas 24h
   - Filtra relevância (nem tudo que aparece é digno de digest)
   - Sintetiza: "o que aconteceu que importa"
   - Gera digest em texto estruturado

3. **Formato (TTS Worker)** — Se o usuário prefere áudio:
   - Converte digest de texto → áudio via TTS
   - Gera "episódio" de podcast por tópico
   - Disponibiliza via feed RSS de podcast (para apps nativos) e player web

4. **Entrega** — Notifica usuário:
   - Push notification (web) ou email
   - Digest disponível na dashboard
   - Episódio de podcast no feed

---

## 3. Modelagem de Dados

```sql
-- Usuário
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Tópicos que o usuário segue
CREATE TABLE topics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  title         TEXT NOT NULL,            -- "JavaScript", "Guerra do Irã"
  description   TEXT,                     -- contexto extra pra IA buscar melhor
  frequency     TEXT DEFAULT 'daily',     -- daily | weekly
  format_pref   TEXT DEFAULT 'text',      -- text | audio | both
  language      TEXT DEFAULT 'pt',        -- idioma do digest
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Fontes associadas a um tópico (descobertas automaticamente ou manuais)
CREATE TABLE sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id      UUID REFERENCES topics(id),
  type          TEXT NOT NULL,            -- rss | newsapi | reddit | youtube
  url           TEXT,                     -- URL do feed/subreddit/canal
  label         TEXT,                     -- nome legível
  is_auto       BOOLEAN DEFAULT true,    -- descoberta automática vs manual
  last_fetched  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Raw items coletados
CREATE TABLE raw_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id     UUID REFERENCES sources(id),
  url           TEXT NOT NULL,
  title         TEXT,
  content       TEXT,                     -- texto extraído
  published_at  TIMESTAMPTZ,
  fetched_at    TIMESTAMPTZ DEFAULT now()
);

-- Digests gerados
CREATE TABLE digests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id      UUID REFERENCES topics(id),
  period_start  TIMESTAMPTZ NOT NULL,
  period_end    TIMESTAMPTZ NOT NULL,
  text_content  TEXT NOT NULL,            -- digest em texto
  audio_url     TEXT,                     -- URL do arquivo de áudio (S3/R2)
  audio_duration INTEGER,                -- segundos
  status        TEXT DEFAULT 'generated',  -- generated | delivered
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Pipeline de Fontes — Detalhamento

### 4.1 RSS
- Biblioteca: `rss-parser` (Node) ou `feedparser` (Python)
- Para cada tópico, buscar feeds relevantes via pesquisa ou curadoria inicial
- Deduplicação por URL

### 4.2 NewsAPI
- Endpoint: `https://newsapi.org/v2/everything?q={topic}&language=pt|en`
- Plano gratuito: 100 req/dia (suficiente pra MVP)
- Fallback: GNews API, MediaStack

### 4.3 Reddit
- API pública (OAuth2 com app type "script")
- Buscar posts quentes em subreddits relevantes
- Usar `praw` (Python) ou fetch direto via JSON (`.json` suffix)

### 4.4 YouTube
- Buscar vídeos recentes por keyword via YouTube Data API v3
- Transcrever com `youtube-transcript-api` (Python)
- Limitar a canais com boa reputação (subscribers > threshold)

### 4.5 Descoberta automática de fontes
- Quando o usuário cria um tópico, a IA sugere fontes:
  - "Para JavaScript, recomendo: CSS-Tricks (RSS), r/javascript (Reddit), Fireship (YouTube)"
  - Usado uma vez, depois o sistema aprende com feedback

---

## 5. AI Synthesis — Detalhamento

### Prompt base (exemplo para tópico "Guerra do Irã"):

```
Você é um curador de notícias especializado. Abaixo estão artigos e posts 
coletados nas últimas 24h sobre "{{topic}}".

Seu trabalho:
1. Filtrar apenas o que é relevante e novo (não repita o óbvio)
2. Organizar por importância
3. Sintetizar em um digest claro e direto, em português
4. Para cada item, incluir: o que aconteceu, por que importa, e link original
5. Se houver conflito entre fontes, aponte

Formato:
## 🔴 Urgente
[items mais importantes]

## 📌 Importante
[items relevantes]

## 💡 Contexto
[background que ajuda a entender]

Artigos:
---
{{articles}}
```

### Modelo
- **MVP:** OpenAI GPT-4o-mini (barato, rápido, bom o suficiente pra síntese)
- **Futuro:** Claude Haiku (melhor em textos longos), ou roteamento dinâmico

### Custo estimado por digest
- ~3.000 tokens input × 1.000 tokens output
- GPT-4o-mini: ~$0.002/digest (praticamente nada)

---

## 6. TTS — Detralhamento

### Opções

| Serviço | Qualidade | Custo/min | Latência | Vozes PT-BR |
|---------|-----------|-----------|----------|-------------|
| ElevenLabs | ⭐⭐⭐⭐⭐ | ~$0.18 | ~3s | Sim |
| OpenAI TTS | ⭐⭐⭐⭐ | ~$0.015 | ~2s | Sim |
| Google Cloud TTS | ⭐⭐⭐ | ~$0.016 | ~1s | Sim |

**Recomendação MVP:** OpenAI TTS — bom custo, boa qualidade, vozes em PT-BR, integração simples.

### Formato de saída
- MP3, 128kbps (voz não precisa mais)
- Armazenar em Cloudflare R2 ($0.015/GB/mês, egress gratuito)
- Gerar feed RSS de podcast por tópico (para Apple Podcasts, Spotify, etc.)

### Custo estimado por digest em áudio
- Digest de ~800 palavras ≈ 5 min de áudio
- OpenAI TTS: ~$0.003/digest
- Storage R2: negligível

---

## 7. Cron & Scheduling

```
Diário:
  06:00 UTC  → Pipeline busca fontes de todos os tópicos ativos
  07:00 UTC  → AI synthesis gera digests de texto
  07:30 UTC  → TTS converte digests de usuários com pref=audio
  08:00 UTC  → Delivery: notifica usuários

Semanal (tópicos com frequency=weekly):
  Domingo 18:00 UTC → mesmo pipeline, mas janela de 7 dias
```

Implementação: cron no servidor Node (node-cron) ou um worker separado com BullMQ + Redis.

---

## 8. Frontend — Wireframe mental

### Dashboard
```
┌─────────────────────────────────────────────────┐
│  Contexto                              [Perfil] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Meus Tópicos                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ JavaScript  │  │ Guerra Irã  │ │ + Novo  │ │
│  │ 📄 🔊      │  │ 📄 🔊      │ │         │ │
│  │ 3 digests  │  │ 5 digests   │ │         │ │
│  └─────────────┘  └─────────────┘  └─────────┘ │
│                                                 │
│  Último Digest: JavaScript (23 Apr)            │
│  ┌─────────────────────────────────────────────┐│
│  │ 🔴 Urgente                                  ││
│  │ • Node.js 24 lançado com...  [ler] [▶ ouvir]││
│  │ • Deno 2.2 adiciona...      [ler] [▶ ouvir] ││
│  │                                             ││
│  │ 📌 Importante                                ││
│  │ • TC39 proposal para...    [ler] [▶ ouvir]  ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Player de áudio
- Player inline na página (estilo podcast)
- Playback speed 1x / 1.5x / 2x
- Feed RSS de podcast por tópico (assinar no app de podcast)

---

## 9. Escopo do MVP (O QUE FAZER)

### ✅ Incluído
- [ ] Autenticação básica (email/senha ou magic link)
- [ ] CRUD de tópicos (criar, editar, deletar)
- [ ] Pipeline de fontes: RSS + NewsAPI (somente esses 2 pra começar)
- [ ] AI synthesis: digest diário em texto
- [ ] TTS: digest em áudio (OpenAI TTS)
- [ ] Dashboard: ver tópicos e últimos digests
- [ ] Player de áudio inline
- [ ] Notificação por email (simples, via Resend)
- [ ] Idioma: PT-BR e EN

### ✅ Incluído (PWA - passo pro mobile)
- [ ] Service Worker para cache/offline básico
- [ ] Web App Manifest (instalar na home screen)
- [ ] Feed RSS de podcast por tópico (assinar no Spotify/Apple/Google Podcasts)

### ❌ Não incluído (v2+)
- Vídeo
- Social (compartilhar, comentários)
- Descoberta automática avançada de fontes
- YouTube/Reddit como fonte
- App mobile nativo (ver roadmap mobile abaixo)
- Pagamento/monetização
- Multi-idioma dinâmico
- Personalização de voz
- Push notifications nativas (iOS)
- SEO avançado (i18n, hreflang, programmatic SEO, páginas de tópicos públicos)

---

## 10. Estratégia de Testes

### Pirâmide de Testes

```
            ╱ ╲
           ╱ E2E╲          ← Playwright (poucos, críticos)
          ╱──────╲
         ╱Integr. ╲         ← Vitest + MSW (fontes, AI, API)
        ╱──────────╲
       ╱   Unitários  ╲     ← Vitest (lógica, utils, schemas)
      ╱────────────────╲
```

### Stack de Testes

| Tipo | Ferramenta | O que cobre |
|------|-----------|-------------|
| Unitários | Vitest | Utils, schemas (Zod), lógica de negócio, transformações |
| Integração | Vitest + MSW (Mock Service Worker) | API routes, pipeline de fontes, AI synthesis, TTS |
| E2E | Playwright | Fluxos completos: criar tópico, ver digest, ouvir áudio |
| Contrato | Zod schemas | Validação de input/output em runtime (também serve como documentação) |

### Estrutura de Pastas de Teste

```
compendium/
├── src/
│   ├── app/                    # Rotas Next.js
│   │   └── __tests__/           # Testes de integração por rota
│   ├── lib/
│   │   ├── pipeline/
│   │   │   ├── rss-fetcher.ts
│   │   │   ├── newsapi-fetcher.ts
│   │   │   ├── synthesizer.ts
│   │   │   ├── tts-worker.ts
│   │   │   └── __tests__/       # Testes unitários do pipeline
│   │   ├── ai/
│   │   │   ├── prompts.ts
│   │   │   ├── digest.ts
│   │   │   └── __tests__/       # Testes do AI (mocked)
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── __tests__/       # Testes de queries
│   │   └── utils/
│   │       └── __tests__/       # Testes de utilitários
│   └── ...
├── e2e/
│   ├── topics.spec.ts          # Criar/editar/deletar tópico
│   ├── digest.spec.ts          # Ver digest, ouvir áudio
│   └── auth.spec.ts            # Login/signup
├── vitest.config.ts
├── vitest.integration.config.ts
└── playwright.config.ts
```

### O que testar por Sprint

| Sprint | Testes |
|--------|--------|
| Sprint 1 | Unit: schemas Zod, utils. Integracao: CRUD de topicos via API |
| Sprint 2 | Unit: RSS parser, NewsAPI fetcher. Integracao: pipeline com fontes mockadas |
| Sprint 3 | Unit: prompt builder, digest formatter. Integracao: AI synthesis com OpenAI mockado |
| Sprint 4 | Unit: TTS formatter. Integracao: geracao de audio com OpenAI mockado |
| Sprint 5 | E2E: fluxo completo criar topico → ver digest → ouvir audio |

### Cobertura mínima esperada

- **Unitários:** 80%+ de cobertura em `lib/`
- **Integração:** Todos os endpoints da API + pipeline com mocks
- **E2E:** 3-5 fluxos críticos (happy path)

### Mocks e Fixtures

- **MSW** para mockar APIs externas (OpenAI, NewsAPI, RSS feeds)
- **Fixtures** em `__tests__/fixtures/` com samples de:
  - RSS feeds
  - Respostas da NewsAPI
  - Respostas do OpenAI (síntese e TTS)
  - Dados de tópicos e digests

### CI/CD

- GitHub Actions rodando:
  1. Lint (ESLint + Prettier)
  2. Type check (`tsc --noEmit`)
 3. Testes unitários + integração (Vitest)
  4. Testes E2E (Playwright) — apenas em PRs e main

---

## 10.5 SEO — Estratégia

### Por que SEO importa para o Compendium

O Compendium tem um **superpoder SEO**: cada digest gerado é conteúdo fresco, bem estruturado e atualizado diariamente. Isso é ouro pra motores de busca. Se alguém busca "últimas notícias sobre JavaScript" ou "resumo guerra do Irã", o digest público do Compendium pode ser o resultado.

### SEO no MVP (fundação)

| Aspecto | Implementação | Detalhe |
|---------|---------------|---------|
| Meta tags | Next.js Metadata API | Title, description, og:image dinâmicos por página |
| Open Graph | Metadata API | Compartilhamento bonito em redes sociais |
| Sitemap | `next-sitemap` | Gerado automaticamente, submetido ao Google Search Console |
| robots.txt | `next-sitemap` | Permitir indexação de páginas públicas, bloquear /api e /dashboard |
| URLs limpas | App Router | `/topic/javascript`, `/topic/javascript/digest/2026-04-23` |
| Structured Data | JSON-LD | Schema.org: `Article` para digests, `WebSite` para home |
| Performance | Core Web Vitals | SSR + minimal JS = LCP < 2.5s, CLS < 0.1 |
| Canonical | `<link rel="canonical">` | Evitar conteúdo duplicado entre formatos |

### SEO Avançado (v2+)

- **Páginas de tópicos públicos** — Cada tópico tem uma landing page indexável ("Últimas notícias sobre JavaScript — atualizado diariamente")
- **Programmatic SEO** — Gerar páginas automaticamente para tópicos populares
- **i18n + hreflang** — Versões em PT e EN com tags hreflang
- **RSS feed público** — Cada tópico tem um feed RSS assinável (dobra como SEO crawlável)
- **AMP** — Versão leve de digests para mobile

### Checklist de SEO por página

```
/ (home)
  → title: "Compendium — Seu digest inteligente sobre qualquer assunto"
  → description: "Receba resumos diários sobre os temas que importam pra você, em texto ou áudio."
  → og:image: hero image
  → JSON-LD: WebSite + SearchAction

/topic/[slug]
  → title: "[Nome do tópico] — Últimas notícias e resumo"
  → description: "Resumo diário sobre [tópico], atualizado em [data]."
  → JSON-LD: Article + dateModified
  → canonical: URL canônica

/topic/[slug]/digest/[date]
  → title: "[Tópico] — Digest de [data]"
  → description: primeiras linhas do digest
  → JSON-LD: Article + datePublished
  → canonical: URL canônica
```

---

## 11. Estimativa de Custos (MVP, ~100 usuários)

| Item | Custo/mês |
|------|-----------|
| Hosting (Vercel ou Railway) | $0-20 |
| Banco PostgreSQL (Supabase ou Neon) | $0-25 |
| Redis (Upstash) | $0 |
| OpenAI API (synthesis + TTS) | ~$5-15 |
| NewsAPI | $0 (free tier) |
| Cloudflare R2 (storage áudio) | ~$1 |
| Email (Resend) | $0 (free tier) |
| **Total** | **$6-61/mês** |

Para 100 usuários com ~3 tópicos cada, ~300 digests/dia — totalmente viável no free tier de quase tudo.

---

## 11. Stack Final

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| Frontend | Next.js 15 (App Router) | SSR, RSC, você já conhece |
| Styling | Tailwind CSS + shadcn/ui | Rápido, consistente |
| API | Next.js API routes (ou tRPC) | Simples, sem microserviço desnecessário |
| Banco | PostgreSQL (Neon) | Serverless, free tier generoso |
| ORM | Drizzle ORM | Leve, type-safe, bom com Neon |
| Queue | BullMQ + Redis (Upstash) | Jobs de pipeline, retry, scheduling |
| AI | OpenAI GPT-4o-mini | Síntese barata e boa |
| TTS | OpenAI TTS | Bom, barato, PT-BR |
| Storage | Cloudflare R2 | S3-compat, egress gratuito |
| Email | Resend | Simples, free tier |
| Deploy | Vercel | Next.js nativo, CI/CD automático |
| Testes Unit/Integração | Vitest + MSW | Rápido, mesmo ecossistema que o app |
| Testes E2E | Playwright | Padrão da indústria, multi-browser |
| Validação | Zod | Runtime + types, também documentação |

---

## 12. Ordem de Implementação

### Sprint 1 (Semana 1-2): Fundação
1. Setup do projeto Next.js + Tailwind + shadcn
2. Banco PostgreSQL + Drizzle + migrações
3. Autenticação básica
4. CRUD de tópicos (frontend + API)

### Sprint 2 (Semana 3-4): Pipeline
5. Modelagem de fontes + integração RSS
6. Integração NewsAPI
7. Worker de ingestão (BullMQ + cron)
8. Deduplicação e armazenamento de raw_items

### Sprint 3 (Semana 5-6): O coração
9. AI synthesis: prompt engineering + integração OpenAI
10. Geração de digests em texto
11. Dashboard: lista de digests + leitura

### Sprint 4 (Semana 7-8): Áudio
12. Integração OpenAI TTS
13. Storage R2 + geração de áudio
14. Player de áudio inline
15. Notificação por email

### Sprint 5 (Semana 9-10): Polish
16. UI/UX refinement
17. Tratamento de erros e retry
18. Rate limiting
19. Testes básicos
20. Deploy + landing page

---

## 13. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Alucinação da IA (inventar notícias) | Média | Sempre citar fonte + link. Nunca deixar a IA "criar" notícias, só sintetizar o que já foi coletado |
| Custo de API maior que esperado | Baixa | Monitorar uso, rate limit por usuário, fallback pra modelo mais barato |
| RSS feeds quebram/mudam | Alta | Health check periódico + fallback pra scraping |
| Baixa retenção de usuários | Média | Foco na qualidade do digest > quantidade. Um digest excelente > 5 medianos |
| NewsAPI free tier insuficiente | Média | Alternativas: GNews, MediaStack, ou scraping ético |

---

## 14. Roadmap Mobile

| Fase | Quando | O que faz | Entrega mobile |
|------|--------|-----------|---------------|
| **MVP** | Agora | Web app + API-first + PWA básica | PWA + RSS podcast |
| **v1.5** | 2-3 meses | PWA completa: offline, push Android, install prompt | PWA funcional |
| **v2** | 6 meses | App nativo (React Native/Expo) | iOS + Android |

### Por que PWA antes de app nativo
1. **Custo baixo** — mesma codebase web, funciona no celular
2. **Feedback rápido** — itera sem review de loja
3. **Android push** — Service Worker suporta push notifications no Android
4. **Validação** — aprende o que os usuários precisam antes de investir num app nativo

### Por que React Native/Expo no v2
- Mesma linguagem (TypeScript) e mesma API
- Expo facilita: uma codebase, iOS + Android
- Se a API já é REST/tRPC, o app é "só mais um client"

### Arquitetura preparada pra app
- **API-first** — frontend web e app futuro consomem a mesma API
- **State no servidor** — digests, tópicos, preferências ficam no backend
- **Auth compartilhada** — JWT/session que funciona em web e mobile
- **Push agnóstica** — arquitetura de notificação que suporta web push e APNs/FCM

---

## 15. Próximos passos

1. **Validar a ideia** — Mostra pra 3-5 pessoas e pergunta: "Você usaria isso? Por qual tópico?" Se ninguém se empolga, pivota antes de codar.

2. **Criar o repo** — Next.js + stack acima. Posso gerar o boilerplate pra você.

3. **Primeira feature** — CRUD de tópicos + um digest hardcoded (sem pipeline, sem AI real) pra ter algo visual o mais rápido possível.

4. **PWA desde o dia 1** — Manifest + service worker básico já no setup. Não custa nada e prepara o caminho.

---

*Documento criado em 2026-04-23 por Gandalf 🧙‍♂️*
*Projeto de Breno — web engineer em Berlim*