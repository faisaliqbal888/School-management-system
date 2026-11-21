/**
 * Outbound email + SMS delivery.
 *
 * Both channels go through a provider HTTP API rather than a vendor SDK, so the
 * app keeps a small dependency surface and the transport is swappable by
 * configuration alone. Two shapes are supported:
 *
 *   generic  — POST {to, subject, text} / {to, message} to the configured URL
 *              with a bearer token. Any service (or an internal relay) that
 *              speaks this shape works without a code change.
 *   resend   — Resend's email API (https://resend.com/docs) for email, and for
 *              SMS any endpoint accepting the generic shape.
 *
 * Nothing here throws into the request path: a failed send is logged, recorded
 * in the delivery report, and the in-app notice is still created. A notice that
 * saved but could not be emailed must not look like a failed request.
 */
import { config } from '../config/env.js'

export type DeliveryChannel = 'EMAIL' | 'SMS'

export interface DeliveryMessage {
  to: string
  subject?: string
  text: string
}

export interface DeliveryResult {
  channel: DeliveryChannel
  to: string
  ok: boolean
  /** Provider id when it returns one, or the reason it failed. */
  detail?: string
}

const TIMEOUT_MS = 10_000

/** True when the channel is both configured and enabled. */
export function isChannelEnabled(channel: DeliveryChannel): boolean {
  if (!config.delivery.enabled) return false
  return channel === 'EMAIL' ? Boolean(config.delivery.emailUrl) : Boolean(config.delivery.smsUrl)
}

function endpointFor(channel: DeliveryChannel): string | undefined {
  return channel === 'EMAIL' ? config.delivery.emailUrl : config.delivery.smsUrl
}

function payloadFor(channel: DeliveryChannel, message: DeliveryMessage): Record<string, unknown> {
  if (channel === 'SMS') return { to: message.to, message: message.text }
  if (config.delivery.emailProvider === 'resend') {
    return {
      from: config.delivery.fromEmail,
      to: [message.to],
      subject: message.subject ?? 'School notice',
      text: message.text,
    }
  }
  return { from: config.delivery.fromEmail, to: message.to, subject: message.subject ?? 'School notice', text: message.text }
}

async function sendOne(channel: DeliveryChannel, message: DeliveryMessage): Promise<DeliveryResult> {
  const url = endpointFor(channel)
  if (!url) {
    return { channel, to: message.to, ok: false, detail: 'not configured' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.delivery.apiKey ? { Authorization: `Bearer ${config.delivery.apiKey}` } : {}),
      },
      body: JSON.stringify(payloadFor(channel, message)),
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      const detail = `HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`
      // eslint-disable-next-line no-console
      console.warn(`[delivery] ${channel} to ${message.to} failed — ${detail}`)
      return { channel, to: message.to, ok: false, detail }
    }

    const json = (await res.json().catch(() => null)) as { id?: string } | null
    return { channel, to: message.to, ok: true, detail: json?.id }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error'
    // eslint-disable-next-line no-console
    console.warn(`[delivery] ${channel} to ${message.to} failed — ${detail}`)
    return { channel, to: message.to, ok: false, detail }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Sends to a batch of recipients with bounded concurrency.
 *
 * Sequential sends would make a 400-parent notice take minutes inside a request;
 * unbounded parallelism would trip most providers' per-second limits.
 */
export async function deliver(
  channel: DeliveryChannel,
  messages: DeliveryMessage[],
  concurrency = 5,
): Promise<DeliveryResult[]> {
  if (!isChannelEnabled(channel) || messages.length === 0) return []

  const results: DeliveryResult[] = []
  let cursor = 0

  async function worker() {
    while (cursor < messages.length) {
      const index = cursor++
      results[index] = await sendOne(channel, messages[index]!)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, messages.length) }, worker))
  return results
}

/** One-line summary for the API response: `{ sent, failed }`. */
export function summarise(results: DeliveryResult[]) {
  return {
    attempted: results.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  }
}
