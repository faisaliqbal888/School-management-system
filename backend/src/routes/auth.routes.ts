import { Router } from 'express'
import { asyncHandler } from '../utils/async-handler.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rate-limit.js'
import { ok, noContent } from '../utils/response.js'
import { badRequest, unauthorized } from '../utils/errors.js'
import {
  clearAuthCookies,
  readRefreshToken,
  setAuthCookies,
} from '../utils/cookies.js'
import { accessExpiryMs, refreshExpiryMs } from '../utils/jwt.js'
import {
  changePasswordSchema,
  loginSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '../validators/auth.validator.js'
import * as authService from '../services/auth.service.js'
import { prisma } from '../config/prisma.js'
import { hashToken } from '../utils/jwt.js'
import { hashPassword, verifyPassword } from '../utils/password.js'

export const authRouter = Router()

// ─────────────────────────────────────────────────────────────
//  POST /auth/login
// ─────────────────────────────────────────────────────────────
authRouter.post(
  '/auth/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string }
    const { user, tokens } = await authService.login(email, password, req)

    setAuthCookies(res, tokens, accessExpiryMs(), refreshExpiryMs())
    ok(res, {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  }),
)

// ─────────────────────────────────────────────────────────────
//  POST /auth/refresh  — rotate the refresh token
// ─────────────────────────────────────────────────────────────
authRouter.post(
  '/auth/refresh',
  asyncHandler(async (req, res) => {
    const raw = readRefreshToken(req)
    if (!raw) throw unauthorized('No refresh token supplied')

    const tokens = await authService.refresh(raw, req)
    setAuthCookies(res, tokens, accessExpiryMs(), refreshExpiryMs())

    ok(res, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  }),
)

// ─────────────────────────────────────────────────────────────
//  POST /auth/logout
// ─────────────────────────────────────────────────────────────
authRouter.post(
  '/auth/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await authService.logout(req.user!.id, readRefreshToken(req))
    clearAuthCookies(res)
    noContent(res)
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /auth/me  — current session
// ─────────────────────────────────────────────────────────────
authRouter.get(
  '/auth/me',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, { user: await authService.sessionFor(req.user!.id) })
  }),
)

// ─────────────────────────────────────────────────────────────
//  POST /auth/change-password
// ─────────────────────────────────────────────────────────────
authRouter.post(
  '/auth/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as ChangePasswordInput
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) throw unauthorized('Account no longer exists')

    const currentOk = await verifyPassword(body.currentPassword, user.passwordHash)
    if (!currentOk) throw badRequest('Current password is incorrect')

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(body.newPassword), passwordChangedAt: new Date() },
      }),
      // Changing the password signs out every other device.
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'auth.change_password',
          entity: 'User',
          entityId: user.id,
          ipAddress: req.ip,
        },
      }),
    ])

    clearAuthCookies(res)
    ok(res, { message: 'Password changed. Please sign in again.' })
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /auth/sessions  — devices currently signed in
//  DELETE /auth/sessions/:id — sign one device out
//  DELETE /auth/sessions — sign every *other* device out
// ─────────────────────────────────────────────────────────────
authRouter.get(
  '/auth/sessions',
  authenticate,
  asyncHandler(async (req, res) => {
    const sessions = await prisma.refreshToken.findMany({
      where: { userId: req.user!.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
      take: 50,
    })
    ok(res, sessions)
  }),
)

authRouter.delete(
  '/auth/sessions/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    // Scoped by userId so one user can never revoke another user's session.
    const result = await prisma.refreshToken.updateMany({
      where: { id: req.params.id, userId: req.user!.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    if (result.count === 0) throw badRequest('Session not found or already signed out')
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'auth.session_revoked',
        entity: 'RefreshToken',
        entityId: req.params.id ?? null,
        ipAddress: req.ip,
      },
    })
    noContent(res)
  }),
)

authRouter.delete(
  '/auth/sessions',
  authenticate,
  asyncHandler(async (req, res) => {
    const current = readRefreshToken(req)
    const keepId = current
      ? (
          await prisma.refreshToken.findUnique({
            where: { tokenHash: hashToken(current) },
            select: { id: true },
          })
        )?.id
      : undefined

    const result = await prisma.refreshToken.updateMany({
      where: {
        userId: req.user!.id,
        revokedAt: null,
        ...(keepId ? { id: { not: keepId } } : {}),
      },
      data: { revokedAt: new Date() },
    })
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'auth.sessions_revoked',
        entity: 'User',
        entityId: req.user!.id,
        ipAddress: req.ip,
        metadata: { revoked: result.count },
      },
    })
    ok(res, { revoked: result.count })
  }),
)

// ─────────────────────────────────────────────────────────────
//  PATCH /auth/profile — self-service profile edit
// ─────────────────────────────────────────────────────────────
authRouter.patch(
  '/auth/profile',
  authenticate,
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as UpdateProfileInput
    // Whitelisted fields only — email, role and status stay admin-controlled.
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl || null } : {}),
      },
    })
    await prisma.auditLog.create({
      data: {
        userId: updated.id,
        action: 'auth.profile_update',
        entity: 'User',
        entityId: updated.id,
        ipAddress: req.ip,
        metadata: { fields: Object.keys(body) },
      },
    })
    ok(res, await authService.loadProfile(updated))
  }),
)
