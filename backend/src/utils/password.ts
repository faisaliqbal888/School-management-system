import bcrypt from 'bcryptjs'
import { config } from '../config/env.js'

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, config.bcryptRounds)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export interface PasswordStrength {
  ok: boolean
  reasons: string[]
}

/** Minimum policy for new accounts. Enforced by the users/students/teachers services. */
export function checkPasswordStrength(password: string): PasswordStrength {
  const reasons: string[] = []
  if (password.length < 8) reasons.push('At least 8 characters')
  if (!/[A-Z]/.test(password)) reasons.push('At least one uppercase letter')
  if (!/[a-z]/.test(password)) reasons.push('At least one lowercase letter')
  if (!/[0-9]/.test(password)) reasons.push('At least one digit')
  return { ok: reasons.length === 0, reasons }
}
