/**
 * Minimal .env loader for standalone scripts (Next.js loads .env.local
 * itself, but these run outside it). Reads whatever `vercel env pull` wrote.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const FILES = ['.env.local', '.env']

export function loadEnv(): void {
  for (const file of FILES) {
    let contents: string
    try {
      contents = readFileSync(path.join(process.cwd(), file), 'utf8')
    } catch {
      continue
    }

    for (const line of contents.split(/\r?\n/)) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
      if (!match) continue

      const key = match[1]
      const value = match[2].trim().replace(/^(['"])([\s\S]*)\1$/, '$2')

      process.env[key] ??= value
    }
  }
}
