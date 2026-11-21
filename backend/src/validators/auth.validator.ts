import { z } from 'zod'

/**
 * One password policy, applied to every place a password can be set:
 * sign-up (admin-created accounts), password change and admin resets.
 *
 * Deliberately excludes a "must include a symbol" rule — modern guidance
 * (NIST SP 800-63B) favours length and blocks common passwords over character
 * gymnastics, which users work around by writing `Password1!`.
 */
const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  'password1234',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'qwertyuiop',
  'letmein123',
  'welcome123',
  'admin123',
  'iloveyou',
  'abc12345',
  'school123',
  'changeme',
  'changeme123',
])

export const strongPasswordSchema = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(128, 'Too long')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[0-9]/, 'Add a digit')
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), {
    message: 'This password is too common',
  })
  .refine((value) => !/^(.)\1+$/.test(value), { message: 'Password is too repetitive' })
  .refine((value) => !/^(?:0123|1234|abcd|qwer|asdf)/i.test(value), {
    message: 'Password starts with an obvious sequence',
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm the new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ['newPassword'],
    message: 'New password must differ from the current one',
  })

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').max(200),
  password: z.string().min(1, 'Password is required').max(200),
})

export const refreshSchema = z.object({
  // Optional: browsers send the refresh token as an httpOnly cookie instead.
  refreshToken: z.string().min(1).max(500).optional(),
})

/** Self-service profile edit — never touches email or role. */
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is too short').max(120).optional(),
    phone: z
      .string()
      .trim()
      .max(20)
      .regex(/^[0-9+\-\s()]*$/, 'Digits, spaces, +, - and () only')
      .optional(),
    avatarUrl: z.string().trim().max(300).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update')

export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
