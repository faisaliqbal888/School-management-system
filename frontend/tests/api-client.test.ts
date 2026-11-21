import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * The API client is where auth, CSRF and retry logic meet. A regression here is
 * invisible until something silently stops working in production, so the
 * contract is pinned: cookies on every call, a CSRF header on every mutation,
 * one refresh-and-retry on 401, and errors surfaced as `ApiRequestError`.
 */

const realFetch = globalThis.fetch

interface Call {
  url: string
  init: RequestInit
}

let calls: Call[] = []

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

/** Queues one or more responses; the last one repeats. */
function stubFetch(...queue: Array<Response | (() => Response)>) {
  let index = 0
  const spy = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    const next = queue[Math.min(index++, queue.length - 1)]
    return typeof next === "function" ? next() : next!
  })
  globalThis.fetch = spy as unknown as typeof fetch
  return spy
}

/** The client reads the CSRF token from `document.cookie`. */
function setCookie(value: string | null) {
  const doc = { cookie: value ? `csrf_token=${value}` : "" }
  Object.defineProperty(globalThis, "document", { value: doc, configurable: true, writable: true })
}

beforeEach(() => {
  calls = []
  vi.resetModules()
  setCookie(null)
})

afterEach(() => {
  globalThis.fetch = realFetch
  Reflect.deleteProperty(globalThis, "document")
  vi.restoreAllMocks()
})

async function client() {
  return import("../lib/api-client")
}

describe("apiFetch", () => {
  it("unwraps the success envelope", async () => {
    stubFetch(response({ success: true, data: { hello: "world" } }))
    const { apiFetch } = await client()
    await expect(apiFetch("/thing")).resolves.toEqual({ hello: "world" })
  })

  it("sends cookies on GET and does not add a CSRF header", async () => {
    stubFetch(response({ success: true, data: [] }))
    const { apiFetch } = await client()
    await apiFetch("/students")

    expect(calls[0]!.init.credentials).toBe("include")
    const headers = (calls[0]!.init.headers ?? {}) as Record<string, string>
    expect(headers["X-CSRF-Token"]).toBeUndefined()
  })

  it("echoes the CSRF cookie on a mutation", async () => {
    setCookie("token-abc")
    stubFetch(response({ success: true, data: { id: "1" } }))
    const { apiFetch } = await client()

    await apiFetch("/students", { method: "POST", body: { name: "A" } })

    const headers = (calls[0]!.init.headers ?? {}) as Record<string, string>
    expect(headers["X-CSRF-Token"]).toBe("token-abc")
    expect(headers["Content-Type"]).toBe("application/json")
  })

  it("fetches a CSRF token first when the cookie is missing", async () => {
    stubFetch(
      response({ success: true, data: { csrfToken: "fresh-token" } }),
      () => {
        setCookie("fresh-token") // the real endpoint also sets the cookie
        return response({ success: true, data: { ok: true } })
      },
    )
    const { apiFetch } = await client()

    await apiFetch("/notifications", { method: "POST", body: { title: "t" } })

    expect(calls[0]!.url).toContain("/csrf")
    const mutation = calls.find((c) => c.init.method === "POST" && !c.url.includes("/csrf"))
    const headers = (mutation!.init.headers ?? {}) as Record<string, string>
    expect(headers["X-CSRF-Token"]).toBe("fresh-token")
  })

  it("refreshes once on 401 and retries the original request", async () => {
    stubFetch(
      response({ success: false, error: { code: "UNAUTHORIZED", message: "expired" } }, 401),
      response({ success: true, data: {} }, 200), // /auth/refresh
      response({ success: true, data: { name: "recovered" } }),
    )
    const { apiFetch } = await client()

    await expect(apiFetch("/students")).resolves.toEqual({ name: "recovered" })

    const urls = calls.map((c) => c.url)
    expect(urls.some((u) => u.includes("/auth/refresh"))).toBe(true)
    expect(urls.filter((u) => u.endsWith("/students"))).toHaveLength(2)
  })

  it("gives up after one refresh attempt", async () => {
    stubFetch(
      response({ success: false, error: { code: "UNAUTHORIZED", message: "nope" } }, 401),
      response({ success: false, error: { code: "UNAUTHORIZED", message: "nope" } }, 401),
      response({ success: false, error: { code: "UNAUTHORIZED", message: "nope" } }, 401),
    )
    const { apiFetch, ApiRequestError } = await client()

    await expect(apiFetch("/students")).rejects.toBeInstanceOf(ApiRequestError)
    // original + refresh + one retry, never a loop
    expect(calls.length).toBeLessThanOrEqual(3)
  })

  it("surfaces the server error message and code", async () => {
    stubFetch(
      response(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Email already exists" } },
        400,
      ),
    )
    const { apiFetch, ApiRequestError } = await client()

    await expect(apiFetch("/students", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Email already exists",
    })
    await expect(apiFetch("/students", { method: "POST", body: {} })).rejects.toBeInstanceOf(
      ApiRequestError,
    )
  })

  it("treats 204 as an empty success", async () => {
    stubFetch(new Response(null, { status: 204 }))
    const { apiFetch } = await client()
    await expect(apiFetch("/auth/logout", { method: "POST" })).resolves.toBeUndefined()
  })
})
