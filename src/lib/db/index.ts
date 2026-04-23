import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import * as relations from "./relations";

const connectionString = process.env.DATABASE_URL!;

const sql = neon(connectionString);
export const db = drizzle(sql, { schema: { ...schema, ...relations } });