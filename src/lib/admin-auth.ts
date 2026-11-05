import { createHash } from 'crypto'
import { cookies } from 'next/headers'

const COOKIE = 'dd_admin'

function adminPassword() {
  return process.env.ADMIN_PASSWORD ?? 'admin123'
}

function token() {
  return createHash('sha256')
    .update(`${adminPassword()}|${process.env.ADMIN_SECRET ?? 'duct-designer-dev-secret'}`)
    .digest('hex')
}

export function checkPassword(pw: string) {
  return pw === adminPassword()
}

export function sessionToken() {
  return token()
}

export function cookieName() {
  return COOKIE
}

/** server-side check used by admin API routes */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return store.get(COOKIE)?.value === token()
}
