import { Router } from 'express'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate } from '../middleware/auth.js'
import { handleAvatarUpload } from '../middleware/upload.js'
import { ok } from '../utils/response.js'
import * as uploads from '../services/uploads.service.js'
import type { Role } from '@prisma/client'

export const uploadsRouter = Router()

const actorOf = (req: { user?: { id: string; role: Role } }) => ({
  id: req.user!.id,
  role: req.user!.role,
})

/**
 * Avatar for the signed-in account.
 *
 * Deliberately self-service: an admin editing someone else's photo is not a
 * need this build has, and it keeps the "who can write this file" question
 * trivial. Field name is `avatar`.
 */
uploadsRouter.post(
  '/uploads/avatar',
  authenticate,
  handleAvatarUpload,
  asyncHandler(async (req, res) => {
    ok(res, await uploads.saveAvatar(actorOf(req), req.file))
  }),
)

uploadsRouter.delete(
  '/uploads/avatar',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, await uploads.clearAvatar(actorOf(req)))
  }),
)
