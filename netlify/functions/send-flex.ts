import { calculateFlex, isFlexMode } from "../../src/flex-engine";
import { renderDailyEmail } from "../../src/email-rotation";
import { buildBoard, normalizeName } from "../../src/last-place";
import {
  deliveryStore,
  isAllowedOrigin,
  isAuthorized,
  isSuppressed,
  json,
  recipientForAlias,
  sendWithResend,
  unsubscribeUrl,
} from "./_lib/delivery";

const COOLDOWN_MS = 10 * 60 * 1000;

export default async (request: Request) => {
  const requestId = crypto.randomUUID();
  if (request.method !== "POST") return json(405, { message: "POST required.", requestId });
  if (!isAllowedOrigin(request)) return json(403, { message: "Delivery denied.", requestId });
  if (!isAuthorized(request)) return json(401, { message: "Delivery denied.", requestId });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 5_000) return json(413, { message: "Request is too large.", requestId });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { message: "Request must be valid JSON.", requestId });
  }
  if (!body || typeof body !== "object") return json(400, { message: "Invalid delivery request.", requestId });

  const payload = body as Record<string, unknown>;
  if ("email" in payload || "to" in payload) return json(400, { message: "Delivery denied.", requestId });
  const alias = typeof payload.recipientAlias === "string" ? payload.recipientAlias : "";
  const recipient = recipientForAlias(alias);
  if (!recipient?.consent || (await isSuppressed(alias))) return json(403, { message: "Delivery denied.", requestId });

  const idempotencyKey = request.headers.get("idempotency-key") ?? "";
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)) {
    return json(400, { message: "A valid idempotency key is required.", requestId });
  }

  const actualTokens = payload.actualTokens;
  const mode = payload.mode;
  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim().slice(0, 24) : "";
  if (!Number.isSafeInteger(actualTokens) || typeof mode !== "string" || !isFlexMode(mode) || typeof displayName !== "string") {
    return json(400, { message: "Token result is invalid.", requestId });
  }

  let result;
  try {
    result = calculateFlex(actualTokens as number, mode);
  } catch {
    return json(400, { message: "Token result is invalid.", requestId });
  }

  if ((process.env.TOKEN_FLEXER_DEMO ?? "true") === "true") {
    return json(200, { sent: false, demo: true, message: "Demo-safe: preview complete; no email was sent.", requestId });
  }

  const store = deliveryStore();
  const prior = await store.get(`idempotency/manual/${idempotencyKey}`, { type: "json" });
  if (prior) return json(200, { sent: true, replay: true, message: "This approved flex was already delivered.", requestId });

  const lastManual = (await store.get(`last-manual/${alias}`, { type: "json" })) as { sentAt?: string } | null;
  if (lastManual?.sentAt && Date.now() - new Date(lastManual.sentAt).getTime() < COOLDOWN_MS) {
    return json(429, { message: "That recipient is cooling down. Try again later.", requestId });
  }

  const date = new Date();
  const email = renderDailyEmail({
    alias,
    senderName: displayName,
    result,
    date,
    appOrigin: process.env.APP_ORIGIN ?? "http://localhost:8888",
    unsubscribeUrl: unsubscribeUrl(alias),
    board: buildBoard({ name: normalizeName(displayName), actualTokens: result.actualTokens, date }),
  });

  try {
    const provider = await sendWithResend({
      to: recipient.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      idempotencyKey: `manual/${alias}/${idempotencyKey}`,
    });
    const record = { sentAt: date.toISOString(), alias, requestId, variant: email.variant.id, image: email.image.id, ...provider };
    await Promise.all([
      store.setJSON(`idempotency/manual/${idempotencyKey}`, record),
      store.setJSON(`last-manual/${alias}`, record),
      store.setJSON(`audit/${date.toISOString()}-${requestId}`, record),
      store.setJSON("latest-score", { displayName, actualTokens: result.actualTokens, mode: result.mode }),
    ]);
    return json(200, { sent: true, message: `Approved flex delivered with today's “${email.variant.id}” drop.`, requestId });
  } catch (error) {
    console.error("token-flexer send failed", { requestId, reason: error instanceof Error ? error.message : "unknown" });
    return json(502, { sent: false, message: "The provider did not confirm delivery.", requestId });
  }
};

export const config = {
  rateLimit: {
    windowSize: 60,
    windowLimit: 5,
    aggregateBy: ["domain", "ip"],
  },
};
