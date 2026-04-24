import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  OLLAMA_HOST: z.string().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("glm-5.1:cloud"),
  OLLAMA_API_KEY: z.string().optional(),
  NEWSAPI_KEY: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(1).optional(),
  R2_ENDPOINT: z.string().url().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Compendium"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables at build/startup time.
 * Only validates variables that are present — optional vars are only checked when set.
 */
export function validateEnv(): Partial<Env> {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}