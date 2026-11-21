import multer from 'multer'
import { badRequest } from '../utils/errors.js'

/**
 * Avatar uploads.
 *
 * Kept in memory rather than streamed straight to disk so the file can be
 * validated before it is written. Size and mime type are both enforced here —
 * trusting the client's `Content-Type` alone would let anything through, so
 * the magic bytes are checked too.
 */

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024

const ALLOWED = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const

type AllowedMime = keyof typeof ALLOWED

/** Returns the file extension when the bytes really are that image type. */
export function sniffImageExtension(buffer: Buffer): string | null {
  if (buffer.length < 12) return null

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png'
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  // WEBP: "RIFF" .... "WEBP"
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp'
  }
  return null
}

/**
 * `multer` filter runs before the body is buffered, so it only stops files the
 * client has already labelled as wrong — `sniffImageExtension` is the real gate.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!(file.mimetype in ALLOWED)) {
      callback(badRequest('Only PNG, JPEG or WebP images are accepted'))
      return
    }
    callback(null, true)
  },
})

export const avatarUpload = upload.single('avatar')

/** Wraps multer so its errors become the app's normal error envelope. */
export function handleAvatarUpload(
  req: Parameters<typeof avatarUpload>[0],
  res: Parameters<typeof avatarUpload>[1],
  next: (error?: unknown) => void,
) {
  avatarUpload(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(badRequest('Images must be 2 MB or smaller'))
        return
      }
      next(badRequest(error.message))
      return
    }
    next(error)
  })
}

export type AvatarMime = AllowedMime
