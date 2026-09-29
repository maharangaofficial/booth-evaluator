import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!sqlClient) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
      throw new Error(
        "No database connection string found. Set DATABASE_URL (or POSTGRES_URL) in your environment."
      );
    }
    sqlClient = neon(url);
  }
  return sqlClient;
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const sql = getSql();
    schemaReady = Promise.all([
      sql`
        CREATE TABLE IF NOT EXISTS scores (
          id SERIAL PRIMARY KEY,
          evaluator_name TEXT NOT NULL,
          booth TEXT NOT NULL,
          criterion TEXT NOT NULL,
          score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (evaluator_name, booth, criterion)
        )
      `,
      sql`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          evaluator_name TEXT NOT NULL,
          booth TEXT NOT NULL,
          comment TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (evaluator_name, booth)
        )
      `,
    ]).then(() => undefined);
  }
  return schemaReady;
}
