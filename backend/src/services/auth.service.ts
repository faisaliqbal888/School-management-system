import type { Request } from 'express'
import type { Role, User } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { unauthorized } from '../utils/errors.js'
import { verifyPassword } from '../utils/password.js'
import {
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
  signAccessToken,
} from '../utils/jwt.js'

/**
 * The public shape of a signed-in user. Deliberately flat and free of secrets
 * so it can be returned to the browser and cached by the frontend.
 */
export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  phone: string | null
  avatarUrl: string | null
  /** Populated per role — see `loadProfile`. */
  profile: Record<string, unknown> | null
}

export interface IssuedTokens {
  accessToken: string
  refreshToken: string
}

interface ClientMeta {
  userAgent?: string | undefined
  ipAddress?: string | undefined
}

function clientMeta(req: Request): ClientMeta {
  return {
    userAgent: req.get('user-agent')?.slice(0, 200),
    ipAddress: req.ip,
  }
}

// ─────────────────────────────────────────────────────────────
//  login
// ─────────────────────────────────────────────────────────────

/**
 * Verifies credentials and issues a token pair.
 *
 * Both failure modes (unknown email, wrong password) throw the *same* error so
 * the response cannot be used to enumerate which accounts exist.
 */
export async function login(
  email: string,
  password: string,
  req: Request,
): Promise<{ user: SessionUser; tokens: IssuedTokens }> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

  const passwordOk = user ? await verifyPassword(password, user.passwordHash) : false

  if (!user || !passwordOk) {
    throw unauthorized('Invalid email or password')
  }

  if (user.status !== 'ACTIVE') {
    throw unauthorized(
      user.status === 'SUSPENDED'
        ? 'This account has been suspended. Contact the administrator.'
        : 'This account is inactive. Contact the administrator.',
    )
  }

  const tokens = await issueTokens(user, clientMeta(req))

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'auth.login',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      metadata: { role: user.role },
    },
  })

  return { user: await loadProfile(user), tokens }
}

// ─────────────────────────────────────────────────────────────
//  token issuing & rotation
// ─────────────────────────────────────────────────────────────

async function issueTokens(user: User, meta: ClientMeta): Promise<IssuedTokens> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email })

  const { token: refreshToken, tokenHash } = generateRefreshToken()
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: refreshExpiryDate(),
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
    },
  })

  return { accessToken, refreshToken }
}

/**
 * Rotating refresh: the presented token is revoked and a brand-new pair is
 * issued. Reusing an already-revoked token is treated as theft and revokes the
 * whole family for that user.
 */
export async function refresh(rawToken: string, req: Request): Promise<IssuedTokens> {
  const tokenHash = hashToken(rawToken)
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!stored) throw unauthorized('Invalid refresh token')

  if (stored.revokedAt) {
    // Token reuse — assume compromise, kill every active session for this user.
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    await prisma.auditLog.create({
      data: {
        userId: stored.userId,
        action: 'auth.refresh_reuse',
        entity: 'RefreshToken',
        entityId: stored.id,
        ipAddress: req.ip,
      },
    })
    throw unauthorized('Refresh token has already been used. Please sign in again.')
  }

  if (stored.expiresAt.getTime() <= Date.now()) {
    throw unauthorized('Refresh token has expired. Please sign in again.')
  }

  if (stored.user.status !== 'ACTIVE') {
    throw unauthorized('This account is no longer active.')
  }

  // Rotate: revoke the old one, mint a new one.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  })

  return issueTokens(stored.user, clientMeta(req))
}

// ─────────────────────────────────────────────────────────────
//  logout
// ─────────────────────────────────────────────────────────────

export async function logout(userId: string, rawToken: string | null): Promise<void> {
  if (rawToken) {
    await prisma.refreshToken
      .updateMany({ where: { tokenHash: hashToken(rawToken) }, data: { revokedAt: new Date() } })
      .catch(() => undefined)
  } else {
    // No specific token supplied — sign this user out everywhere.
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
}

// ─────────────────────────────────────────────────────────────
//  profile
// ─────────────────────────────────────────────────────────────

/**
 * Loads the role-specific record so the frontend can render the right
 * dashboard without extra round-trips.
 */
export async function loadProfile(user: User): Promise<SessionUser> {
  const base = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
  }

  if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: {
        class: { select: { id: true, name: true, level: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { section: { select: { id: true, name: true } } },
          take: 1,
        },
      },
    })
    if (!student) return { ...base, profile: null }

    return {
      ...base,
      profile: {
        studentId: student.id,
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        classId: student.classId,
        className: student.class?.name ?? null,
        level: student.class?.level ?? null,
        sectionId: student.enrollments[0]?.section.id ?? null,
        sectionName: student.enrollments[0]?.section.name ?? null,
        status: student.status,
      },
    }
  }

  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
      include: {
        subjects: { include: { subject: { select: { id: true, name: true, code: true } } } },
        classAsTeacher: { select: { id: true, name: true } },
      },
    })
    if (!teacher) return { ...base, profile: null }

    return {
      ...base,
      profile: {
        teacherId: teacher.id,
        employeeNo: teacher.employeeNo,
        department: teacher.department,
        designation: teacher.designation,
        status: teacher.status,
        subjects: teacher.subjects.map((s) => s.subject),
        classTeacherOf: teacher.classAsTeacher,
      },
    }
  }

  if (user.role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: {
        children: {
          include: {
            student: {
              include: {
                user: { select: { name: true } },
                class: { select: { name: true } },
              },
            },
          },
        },
      },
    })
    if (!parent) return { ...base, profile: null }

    return {
      ...base,
      profile: {
        parentId: parent.id,
        children: parent.children.map((g) => ({
          studentId: g.studentId,
          name: g.student.user.name,
          admissionNo: g.student.admissionNo,
          className: g.student.class?.name ?? null,
        })),
      },
    }
  }

  // ADMIN
  return { ...base, profile: { isAdmin: true } }
}

export async function sessionFor(userId: string): Promise<SessionUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw unauthorized('Account no longer exists')
  if (user.status !== 'ACTIVE') throw unauthorized('This account is no longer active')
  return loadProfile(user)
}
