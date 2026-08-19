/**
 * Database connection. postgres.js against Neon's pooled endpoint — every
 * caller here is a plain Node server action or route handler, nothing runs on
 * the edge.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

const databaseUrl = process.env.DATABASE_URL ?? null

type Database = ReturnType<typeof drizzle<typeof schema>>

let cached: Database | null = null
let cachedSql: ReturnType<typeof postgres> | null = null

function connect(): Database {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }

  const sql = postgres(databaseUrl, {
    // Neon's pooled endpoint runs PgBouncer in transaction mode, which cannot
    // carry prepared statements across connections.
    prepare: false,
    // Next dev recompiles route entries independently, so this module (and
    // its "singleton" pool) gets re-instantiated per route far more often
    // than in production — cap each instance small and let idle ones close,
    // instead of accumulating connections against Neon's limit.
    max: 1,
    idle_timeout: 20,
    // Fail fast instead of hanging the request (and, transitively, every
    // other request queued behind it) if a connection attempt stalls. Kept
    // generous — Neon's free-tier compute auto-suspends after idle periods,
    // and waking it back up can itself take several seconds.
    connect_timeout: 20,
    onnotice: (notice) => {
      console.log(`postgres notice: ${notice.message}`)
    },
  })

  cachedSql = sql
  return drizzle(sql, { schema })
}

export function db(): Database {
  cached ??= connect()
  return cached
}

/** Closes the pool so a script can exit instead of hanging on an open socket. */
export async function closeDatabase(): Promise<void> {
  if (cachedSql) {
    await cachedSql.end()
    cachedSql = null
    cached = null
  }
}
