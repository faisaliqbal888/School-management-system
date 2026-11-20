/**
 * Bootstrap the first administrator.
 *
 * The demo seed wipes the database and creates fixtures with a known password;
 * it must never run in production. This script instead creates exactly one ADMIN
 * account from environment variables and does nothing if any admin already
 * exists, so it is safe to run on every deploy.
 *
 *   ADMIN_EMAIL=head@school.pk ADMIN_PASSWORD='…' ADMIN_NAME='Head Teacher' \
 *     npm run admin:create
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] ?? '' }),
})

const email = (process.env['ADMIN_EMAIL'] ?? '').trim().toLowerCase()
const password = process.env['ADMIN_PASSWORD'] ?? ''
const name = (process.env['ADMIN_NAME'] ?? 'Administrator').trim()

async function main() {
  if (!email || !password) {
    console.error('✗ ADMIN_EMAIL and ADMIN_PASSWORD are required.')
    process.exit(1)
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error(`✗ ADMIN_EMAIL is not a valid address: ${email}`)
    process.exit(1)
  }
  if (password.length < 12) {
    console.error('✗ ADMIN_PASSWORD must be at least 12 characters in production.')
    process.exit(1)
  }

  const existingAdmins = await prisma.user.count({ where: { role: 'ADMIN' } })
  if (existingAdmins > 0) {
    console.log(`✓ ${existingAdmins} admin account(s) already exist — nothing to do.`)
    return
  }

  const rounds = Number(process.env['BCRYPT_ROUNDS'] ?? 12) || 12
  const user = await prisma.user.create({
    data: {
      email,
      name,
      role: 'ADMIN',
      passwordHash: await bcrypt.hash(password, rounds),
    },
    select: { id: true, email: true },
  })

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'admin.bootstrap', entity: 'User', entityId: user.id },
  })

  console.log(`✓ Created the first administrator: ${user.email}`)
}

main()
  .catch((error) => {
    console.error('✗ Failed to create the administrator:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
