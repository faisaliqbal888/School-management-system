import { randomUUID } from 'node:crypto'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { prisma } from '../config/prisma.js'
import { badRequest, notFound } from '../utils/errors.js'
import { sniffImageExtension } from '../middleware/upload.js'
import type { Role } from '@prisma/client'

/**
 * Avatar storage.
 *
 * Files land under `UPLOAD_DIR/avatars/<userId>.<ext>` and are served from
 * `/uploads/...`. The filename is derived from the authenticated user rather
 * than the upload, so one account cannot overwrite another's image, and an
 * old file is removed when a new one replaces it.
 */

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export interface Actor {
  id: string
  role: Role
}

function uploadRoot(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')
}

export function avatarDir(): string {
  return path.join(uploadRoot(), 'avatars')
}

export async function saveAvatar(actor: Actor, file: Express.Multer.File | undefined) {
  if (!file) throw badRequest('Choose an image to upload')
  if (file.size === 0) throw badRequest('That file is empty')
  if (file.size > MAX_AVATAR_BYTES) throw badRequest('Images must be 2 MB or smaller')

  // The declared mime type is a claim; the bytes are the truth.
  const ext = sniffImageExtension(file.buffer)
  if (!ext) throw badRequest('That file is not a valid PNG, JPEG or WebP image')

  const dir = avatarDir()
  await mkdir(dir, { recursive: true })

  const filename = `${actor.id}.${ext}`
  await writeFile(path.join(dir, filename), file.buffer)

  const url = `/uploads/avatars/${filename}`

  // Remove a previous avatar with a different extension so a user does not
  // accumulate one file per format they ever tried.
  const previous = await prisma.user.findUnique({ where: { id: actor.id }, select: { avatarUrl: true } })
  if (previous?.avatarUrl && previous.avatarUrl !== url) {
    const oldName = previous.avatarUrl.split('/').pop()
    if (oldName) {
      await unlink(path.join(dir, oldName)).catch(() => undefined)
    }
  }

  await prisma.user.update({ where: { id: actor.id }, data: { avatarUrl: url } })
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: 'user.avatar_update',
      entity: 'User',
      entityId: actor.id,
      metadata: { bytes: file.size, type: ext },
    },
  })

  return { url }
}

/** Removes the caller's avatar and clears the column. */
export async function clearAvatar(actor: Actor) {
  const user = await prisma.user.findUnique({ where: { id: actor.id }, select: { avatarUrl: true } })
  if (!user) throw notFound('User')

  if (user.avatarUrl) {
    const name = user.avatarUrl.split('/').pop()
    if (name) await unlink(path.join(avatarDir(), name)).catch(() => undefined)
  }

  await prisma.user.update({ where: { id: actor.id }, data: { avatarUrl: null } })
  return { cleared: true }
}

/** Opaque, collision-free name for anything that is not user-scoped. */
export function uniqueName(ext: string): string {
  return `${randomUUID()}.${ext}`
}
