import { PrismaClient } from '@prisma/client'

// ---------------------------------------------------------------------------
// Database client.
//
// Vercel note: serverless functions have a read-only file system except the
// /tmp folder. So when DATABASE_URL is not set (e.g. on a fresh Vercel
// deployment), the app uses a database file inside /tmp. The table structure
// is created automatically on the first API call (see src/lib/seed.ts) and
// the catalogue is seeded with demo data.
//
// The URL is passed explicitly with `datasourceUrl` (not via the schema's
// env() lookup), because Next.js replaces `process.env.*` references inside
// the server bundle at build time, which would break the runtime fallback.
//
// Set DATABASE_URL to point anywhere else, e.g. a persistent disk:
//   DATABASE_URL=file:/data/ductdesigner.db
// ---------------------------------------------------------------------------

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (url && url.trim() !== '') return url.trim()
  return 'file:/tmp/ductdesigner.db'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
