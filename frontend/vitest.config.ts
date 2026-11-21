import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

/**
 * Frontend unit tests.
 *
 * Deliberately node-environment and DOM-free: they cover the layers where
 * mistakes actually cost something — the zod schemas that gate every form, and
 * the API client that carries cookies, CSRF tokens and retries. Rendering
 * assertions are left to the build and manual passes rather than a jsdom setup
 * that would need a fixture for every Next.js provider.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
  },
})
