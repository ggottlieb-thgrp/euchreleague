import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import * as relations from "./relations";

// neon-http defers the actual network request until a query runs, so a
// syntactically-valid placeholder lets `next build` import this module (and the
// Auth.js adapter classify the dialect) without a real DATABASE_URL. All app
// pages are dynamic and never query at build time, so the placeholder is never
// actually connected to.
const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

if (
  !process.env.DATABASE_URL &&
  !process.env.POSTGRES_URL &&
  process.env.NODE_ENV !== "production"
) {
  console.warn("⚠️  DATABASE_URL is not set — using a placeholder. DB queries will fail.");
}

const sql = neon(connectionString);

export const db = drizzle(sql, {
  schema: { ...schema, ...relations },
  casing: "snake_case",
});

export type DB = typeof db;
