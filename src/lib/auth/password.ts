import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Runs a bcrypt compare against a fixed dummy hash so a login attempt against
 * an email with no password set yet takes the same time as one that fails a
 * real comparison — the timing itself must not reveal whether the account
 * exists or has a password.
 */
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeOgxN6HcjPnkxbeCC.rDwq0RfBEEcAF06'

export async function verifyAgainstNothing(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH)
}
