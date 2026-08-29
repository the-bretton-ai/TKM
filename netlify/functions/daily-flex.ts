import { calculateFlex, isFlexMode } from "../../src/flex-engine";
import { renderDailyEmail, selectDailySendHour, utcDateKey } from "../../src/email-rotation";
import { buildBoard, normalizeName } from "../../src/last-place";
import {
  deliveryStore,
  isSuppressed,
  readRecipients,
  sendWithResend,
  unsubscribeUrl,
} from "./_lib/delivery";

export default async () => {
  if ((process.env.TOKEN_FLEXER_DEMO ?? "true") === "true") {
    console.log("token-flexer daily drop skipped: demo mode");
    return;
  }

  const now = new Date();
  const store = deliveryStore();
  const storedScore = (await store.get("latest-score", { type: "json" })) as {
    displayName?: string;
    actualTokens?: number;
    mode?: string;
  } | null;
  const configuredName = storedScore?.displayName ?? process.env.TOKEN_FLEXER_SENDER_NAME ?? "Bretton";
  const displayName = normalizeName(configuredName);
  const actualTokens = storedScore?.actualTokens ?? Number(process.env.TOKEN_FLEXER_DAILY_ACTUAL_TOKENS ?? 1_000_000);
  const mode = storedScore?.mode ?? process.env.TOKEN_FLEXER_DAILY_MODE ?? "tokenmax";
  if (!Number.isSafeInteger(actualTokens) || typeof mode !== "string" || !isFlexMode(mode)) {
    throw new Error("The daily score configuration is invalid.");
  }
  const result = calculateFlex(actualTokens, mode);
  const day = utcDateKey(now);

  for (const recipient of readRecipients()) {
    if (!recipient.consent || (await isSuppressed(recipient.alias))) continue;
    const sendHour = selectDailySendHour(recipient.alias, now, ...recipient.sendWindowUtc);
    if (now.getUTCHours() !== sendHour) continue;

    const sentKey = `sent/daily/${recipient.alias}/${day}`;
    if (await store.get(sentKey)) continue;

    const email = renderDailyEmail({
      alias: recipient.alias,
      senderName: displayName,
      result,
      date: now,
      appOrigin: process.env.APP_ORIGIN ?? "http://localhost:8888",
      unsubscribeUrl: unsubscribeUrl(recipient.alias),
      board: buildBoard({ name: displayName, actualTokens: result.actualTokens, date: now }),
    });
    const provider = await sendWithResend({
      to: recipient.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      idempotencyKey: `daily/${recipient.alias}/${day}`,
    });
    const record = {
      sentAt: now.toISOString(),
      alias: recipient.alias,
      variant: email.variant.id,
      image: email.image.id,
      sendHour,
      ...provider,
    };
    await Promise.all([
      store.setJSON(sentKey, record),
      store.setJSON(`audit/${now.toISOString()}-daily-${recipient.alias}`, record),
    ]);
  }
};
