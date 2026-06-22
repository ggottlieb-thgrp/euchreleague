import { defineConfig } from "drizzle-kit";

// Load local env for CLI commands (Next loads this automatically at runtime).
try {
  (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(".env.local");
} catch {
  // .env.local not present — rely on the ambient environment.
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "",
  },
});
