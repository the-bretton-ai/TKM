import { createHmac, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";

export type Recipient = {
  alias: string;
  email: string;
  displayName: string;
  consent: boolean;
  sendWindowUtc: [number, number];
};

const ALIAS_PATTERN = /^[a-z0-9][a-z0-9-]{1,31}$/;

function safeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAuthorized(request: Request): boolean {
  const expected = process.env.TOKEN_FLEXER_SEND_KEY ?? "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return expected.length >= 24 && safeStringEqual(supplied, expected);
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(process.env.APP_ORIGIN ?? "http://localhost:8888").origin;
  } catch {
    return false;
  }
}

export function readRecipients(): Recipient[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(process.env.TOKEN_FLEXER_RECIPIENTS ?? "[]");
  } catch {
    throw new Error("TOKEN_FLEXER_RECIPIENTS must be valid JSON.");
  }

  if (!Array.isArray(parsed)) throw new Error("TOKEN_FLEXER_RECIPIENTS must be an array.");

  return parsed.map((value) => {
    if (!value || typeof value !== "object") throw new Error("Every recipient must be an object.");
    const item = value as Partial<Recipient>;
    if (!item.alias || !ALIAS_PATTERN.test(item.alias)) throw new Error("Recipient alias is invalid.");
    if (!item.email || !/^\S+@\S+\.\S+$/.test(item.email)) throw new Error(`Recipient ${item.alias} has an invalid email.`);
    if (!item.displayName || item.displayName.length > 40) throw new Error(`Recipient ${item.alias} needs a short display name.`);
    if (typeof item.consent !== "boolean") throw new Error(`Recipient ${item.alias} needs an explicit consent boolean.`);
    if (
      !Array.isArray(item.sendWindowUtc) ||
      item.sendWindowUtc.length !== 2 ||
      !Number.isInteger(item.sendWindowUtc[0]) ||
      !Number.isInteger(item.sendWindowUtc[1]) ||
      item.sendWindowUtc[0] < 0 ||
      item.sendWindowUtc[1] > 23 ||
      item.sendWindowUtc[0] > item.sendWindowUtc[1]
    ) {
      throw new Error(`Recipient ${item.alias} needs a non-wrapping UTC send window.`);
    }
    return item as Recipient;
  });
}

export function recipientForAlias(alias: string): Recipient | undefined {
  return readRecipients().find((recipient) => recipient.alias === alias);
}

export function deliveryStore() {
  return getStore({ name: "token-flexer-delivery", consistency: "strong" });
}

export async function isSuppressed(alias: string): Promise<boolean> {
  return (await deliveryStore().get(`suppression/${alias}`)) !== null;
}

function signingSecret(): string {
  const secret = process.env.TOKEN_FLEXER_SIGNING_SECRET ?? "";
  if (secret.length < 32) throw new Error("TOKEN_FLEXER_SIGNING_SECRET must contain at least 32 characters.");
  return secret;
}

export function createUnsubscribeToken(alias: string, now = new Date()): string {
  const expires = Math.floor(now.getTime() / 1000) + 90 * 24 * 60 * 60;
  const payload = `${alias}.${expires}`;
  const signature = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyUnsubscribeToken(token: string, now = new Date()): string | null {
  const [alias, expiresRaw, signature] = token.split(".");
  const expires = Number(expiresRaw);
  if (!alias || !expiresRaw || !signature || !ALIAS_PATTERN.test(alias) || !Number.isInteger(expires)) return null;
  if (expires <= Math.floor(now.getTime() / 1000)) return null;
  const expected = createHmac("sha256", signingSecret()).update(`${alias}.${expires}`).digest("base64url");
  return safeStringEqual(signature, expected) ? alias : null;
}

export function unsubscribeUrl(alias: string): string {
  const origin = new URL(process.env.APP_ORIGIN ?? "http://localhost:8888").origin;
  return `${origin}/.netlify/functions/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(alias))}`;
}

export async function sendWithResend(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}) {
  const apiKey = process.env.EMAIL_API_KEY ?? "";
  const from = process.env.EMAIL_FROM ?? "";
  if (!apiKey || !from) throw new Error("Live email is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey.slice(0, 256),
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      headers: {
        "List-Unsubscribe": `<${input.html.match(/href="([^"]*unsubscribe[^"]*)"/)?.[1] ?? ""}>`,
      },
    }),
  });

  const payload = (await response.json()) as { id?: string; message?: string };
  if (!response.ok && response.status !== 409) {
    throw new Error(payload.message ?? `Email provider returned ${response.status}.`);
  }
  return { providerId: payload.id ?? "idempotent-replay", providerStatus: response.status };
}

export function json(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
