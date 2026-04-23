# Compendium

> Agregador de conteúdo inteligente. Escolha os assuntos, a IA cura e sintetiza, e você consome como preferir — texto ou áudio.

## O que é

O Compendium resolve um problema simples: **informação é caos**. Você quer se manter informado sobre JavaScript, geopolítica, ou a saga de livros que está lendo — mas garimpar fontes, filtrar ruído e encontrar tempo pra consumir tudo isso é exaustivo.

Com o Compendium, você:

1. **Escolhe tópicos** — "JavaScript", "Guerra do Irã", "Crônica do Gelo e Fogo"
2. **Recebe digests curados** — a IA busca fontes relevantes e sintetiza o que importa
3. **Consome do seu jeito** — texto na web ou áudio/podcast pra ouvir em qualquer lugar

## Stack

| Camada   | Tecnologia                                         |
| -------- | -------------------------------------------------- |
| Frontend | Next.js 15 (App Router) + Tailwind CSS + shadcn/ui |
| API      | Next.js API routes + tRPC                          |
| Banco    | PostgreSQL (Neon) + Drizzle ORM                    |
| Queue    | BullMQ + Redis (Upstash)                           |
| AI       | OpenAI GPT-4o-mini                                 |
| TTS      | OpenAI TTS                                         |
| Storage  | Cloudflare R2                                      |
| Auth     | NextAuth.js                                        |
| Testes   | Vitest + MSW + Playwright                          |
| Deploy   | Vercel                                             |

## Primeiros passos

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Rodar migrations
npm run db:migrate

# Rodar em desenvolvimento
npm run dev
```

## Scripts

| Comando                 | O que faz                         |
| ----------------------- | --------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento       |
| `npm run build`         | Build de produção                 |
| `npm run start`         | Servidor de produção              |
| `npm run test`          | Testes unitários + integração     |
| `npm run test:e2e`      | Testes end-to-end (Playwright)    |
| `npm run test:coverage` | Cobertura de testes               |
| `npm run db:generate`   | Gerar migration do Drizzle        |
| `npm run db:migrate`    | Rodar migrations                  |
| `npm run db:studio`     | Drizzle Studio (visualizar banco) |
| `npm run lint`          | ESLint                            |
| `npm run typecheck`     | Verificação de tipos              |

## Estrutura do projeto

```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── (auth)/             # Páginas de autenticação
│   ├── (dashboard)/        # Dashboard (autenticado)
│   ├── api/                # API routes
│   └── topic/              # Páginas públicas de tópicos
├── components/             # Componentes React
│   ├── ui/                 # Componentes base (shadcn)
│   ├── layout/             # Layout components
│   ├── topics/             # Componentes de tópicos
│   ├── digests/            # Componentes de digests
│   └── player/             # Player de áudio
├── lib/                    # Lógica de negócio
│   ├── ai/                 # AI synthesis (OpenAI)
│   ├── auth/               # Autenticação (NextAuth)
│   ├── db/                 # Schema + queries (Drizzle)
│   ├── pipeline/           # Pipeline de fontes (RSS, NewsAPI)
│   ├── tts/                # Text-to-speech
│   ├── delivery/            # Notificações (email, push)
│   ├── utils/              # Utilitários
│   └── validations/        # Schemas Zod
├── hooks/                  # React hooks customizados
├── config/                 # Configuração da app
└── types/                  # Tipos TypeScript globais

e2e/                        # Testes Playwright
__tests__/                  # Testes + fixtures
```

## Variáveis de ambiente

Ver `.env.example` para a lista completa. As principais:

| Variável               | Descrição                              |
| ---------------------- | -------------------------------------- |
| `DATABASE_URL`         | Connection string do PostgreSQL (Neon) |
| `NEXTAUTH_SECRET`      | Secret para NextAuth                   |
| `NEXTAUTH_URL`         | URL base da app                        |
| `OPENAI_API_KEY`       | Chave da API OpenAI                    |
| `NEWSAPI_KEY`          | Chave da NewsAPI                       |
| `REDIS_URL`            | URL do Redis (Upstash)                 |
| `R2_ACCESS_KEY_ID`     | Cloudflare R2 access key               |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key               |
| `R2_BUCKET`            | Nome do bucket R2                      |
| `RESEND_API_KEY`       | Chave da API Resend (email)            |

## Documentação

- [Design Doc](./contexto-design-doc.md) — Documento completo de design e arquitetura

## Licença

MIT
