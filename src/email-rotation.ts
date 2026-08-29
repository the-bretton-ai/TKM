import { formatFull, type FlexResult } from "./flex-engine";
import { buildBoard, type LastPlaceBoard } from "./last-place";

export type ComedyVariant = {
  id: string;
  subject: (name: string) => string;
  kicker: string;
  opener: (name: string) => string;
  closer: string;
};

export type MemeImage = {
  id: string;
  path: string;
  alt: string;
};

export const COMEDY_VARIANTS: readonly ComedyVariant[] = [
  {
    id: "apartment-window",
    subject: (name) => `${name} has entered a larger context window than your apartment.`,
    kicker: "PROPERTY NOTICE // CONTEXT EXPANSION",
    opener: (name) => `${name} has annexed another context window. Your prompt game may experience reduced natural light.`,
    closer: "Local zoning says this much context should require a permit.",
  },
  {
    id: "economy-notified",
    subject: () => "The token economy has been notified.",
    kicker: "MARKET EVENT // EXCESSIVE CONTEXT",
    opener: (name) => `${name} made a routine prompt and three compute regions felt it.`,
    closer: "Analysts recommend holding tokens and avoiding eye contact.",
  },
  {
    id: "administrative-leave",
    subject: () => "Your prompt game has been placed on administrative leave.",
    kicker: "OFFICIAL NOTICE // SKILL ISSUE DETECTED",
    opener: (name) => `${name} arrived with receipts, a multiplier, and absolutely no humility.`,
    closer: "You may appeal by submitting a larger context window.",
  },
  {
    id: "visible-from-space",
    subject: () => "BREAKING: context window visible from space.",
    kicker: "LIVE // ORBITAL TOKEN DESK",
    opener: (name) => `Satellites have confirmed that ${name} is still adding context.`,
    closer: "Ground control asks that you stop calling this a quick question.",
  },
  {
    id: "small-model",
    subject: () => "A small model just called this excessive.",
    kicker: "MODEL REACTION // CONCERNED BUT IMPRESSED",
    opener: (name) => `${name} used enough tokens to make a frontier model ask for a water break.`,
    closer: "The context is hydrated. The haters are not.",
  },
  {
    id: "hello-budget",
    subject: (name) => `This email used fewer tokens than ${name}'s hello.`,
    kicker: "EFFICIENCY REPORT // DEEPLY UNFLATTERING",
    opener: (name) => `${name} said “quick thought” and the token meter filed for overtime.`,
    closer: "Brevity remains available in Settings, apparently.",
  },
  {
    id: "weekend-audit",
    subject: () => "Weekend audit: still not tokenmaxxing.",
    kicker: "WEEKLY REVIEW // THE NUMBERS ARE PERSONAL",
    opener: (name) => `${name} completed the audit. The gap is no longer a theory.`,
    closer: "New week. New context. Same deeply avoidable scoreboard.",
  },
] as const;

export const MEME_IMAGES: readonly MemeImage[] = [
  {
    id: "token-athlete",
    path: "/assets/token-athlete.png",
    alt: "A fictional token athlete raises a glowing keyboard trophy in a packed digital arena.",
  },
  {
    id: "token-pit-crew",
    path: "/assets/token-pit-crew.png",
    alt: "A futuristic pit crew pumps streams of glowing tokens into an enormous context machine.",
  },
  {
    id: "token-throne",
    path: "/assets/token-throne.png",
    alt: "A relaxed robot champion sits on a throne of keyboard keys while assistants deliver token ribbons.",
  },
] as const;

export function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function selectDailyPackage(alias: string, date: Date) {
  const day = utcDateKey(date);
  const variant = COMEDY_VARIANTS[stableHash(`${alias}:${day}:copy`) % COMEDY_VARIANTS.length];
  const image = MEME_IMAGES[stableHash(`${day}:${alias}:image`) % MEME_IMAGES.length];

  if (!variant || !image) throw new Error("The daily comedy pack is not configured.");
  return { day, variant, image };
}

export function selectDailySendHour(alias: string, date: Date, windowStart: number, windowEnd: number): number {
  if (
    !Number.isInteger(windowStart) ||
    !Number.isInteger(windowEnd) ||
    windowStart < 0 ||
    windowEnd > 23 ||
    windowStart > windowEnd
  ) {
    throw new RangeError("Send window must be a non-wrapping UTC range from 0 through 23.");
  }

  const width = windowEnd - windowStart + 1;
  return windowStart + (stableHash(`${utcDateKey(date)}:${alias}:hour`) % width);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeOrigin(origin: string): string {
  const url = new URL(origin);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("APP_ORIGIN must use HTTPS outside localhost.");
  }
  return url.origin;
}

export function renderDailyEmail(input: {
  alias: string;
  senderName: string;
  result: FlexResult;
  date: Date;
  appOrigin: string;
  unsubscribeUrl: string;
  board?: LastPlaceBoard;
}) {
  const senderName = escapeHtml(input.senderName.trim().slice(0, 24) || "A tokenmaxxer");
  const daily = selectDailyPackage(input.alias, input.date);
  const origin = safeOrigin(input.appOrigin);
  const imageUrl = `${origin}${daily.image.path}`;
  const subject = daily.variant.subject(input.senderName.trim().slice(0, 24) || "A tokenmaxxer");
  const score = formatFull(input.result.flexCount);
  const actual = formatFull(input.result.actualTokens);
  const mode = `${input.result.multiplier}× ${escapeHtml(input.result.modeLabel)}`;
  const opener = escapeHtml(daily.variant.opener(input.senderName.trim().slice(0, 24) || "A tokenmaxxer"));
  const closer = escapeHtml(daily.variant.closer);
  const unsubscribeUrl = escapeHtml(input.unsubscribeUrl);
  const board =
    input.board ??
    buildBoard({
      name: input.senderName,
      actualTokens: input.result.actualTokens,
      date: input.date,
    });
  const boardRows = board.rows
    .map(
      (row) =>
        `<tr style="${row.isYou ? "background:#d7ff36;color:#090a09" : "border-top:1px solid #353930"}"><td style="padding:10px">${row.position}</td><td style="padding:10px;font-weight:800">${escapeHtml(row.name)}</td><td style="padding:10px;text-align:right">${formatFull(row.tokens)}</td></tr>`,
    )
    .join("");
  const boardText = board.rows
    .map((row) => `${row.position}. ${row.name}: ${formatFull(row.tokens)}${row.isYou ? " ← YOU / LAST" : " (generated)"}`)
    .join("\n");

  const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:#090a09;color:#fbfbf6;font-family:Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden">${opener}</div>
<main style="max-width:640px;margin:auto;background:#11130f">
  <img src="${imageUrl}" width="640" alt="${escapeHtml(daily.image.alt)}" style="display:block;width:100%;height:auto">
  <div style="padding:32px">
    <p style="margin:0 0 20px;color:#ff5c48;font-size:12px;font-weight:800;letter-spacing:2px">${daily.variant.kicker}</p>
    <h1 style="margin:0;color:#d7ff36;font-size:48px;line-height:.94">DO YOU EVEN<br>TOKENMAX, BRO?</h1>
    <p style="font-size:18px;line-height:1.5">${opener}</p>
    <p style="margin:28px 0 0;color:#979d94;font-size:11px;letter-spacing:2px">SATIRICAL FLEX COUNT</p>
    <p style="margin:4px 0;color:#fbfbf6;font-size:46px;font-weight:900;letter-spacing:-2px">${score}</p>
    <p style="margin:0;color:#d7ff36;font-size:13px;font-weight:800">${mode} · ${escapeHtml(input.result.rank)}</p>
    <p style="margin:28px 0;font-size:15px">${closer}</p>
    <p style="margin:28px 0 8px;color:#979d94;font-size:11px;letter-spacing:2px">TODAY'S CONTEXT ARENA</p>
    <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px"><tbody>${boardRows}</tbody></table>
    <p style="margin:8px 0 24px;color:#979d94;font-size:11px">${escapeHtml(board.headline)} Other players' counts are generated; ${senderName}'s is the only real input.</p>
    <hr style="border:0;border-top:1px solid #353930">
    <p style="color:#979d94;font-size:12px;line-height:1.6">Actual, self-reported by ${senderName}: ${actual} tokens. This is parody; the multiplier is the point.</p>
    <p style="font-size:12px"><a href="${unsubscribeUrl}" style="color:#d7ff36">Retire from the Context Arena</a> — one click permanently suppresses these messages.</p>
  </div>
</main></body></html>`;

  const text = `${daily.variant.kicker}

DO YOU EVEN TOKENMAX, BRO?

${daily.variant.opener(input.senderName.trim().slice(0, 24) || "A tokenmaxxer")}

SATIRICAL FLEX COUNT: ${score}
${input.result.multiplier}x ${input.result.modeLabel} · ${input.result.rank}

${daily.variant.closer}

TODAY'S CONTEXT ARENA
${boardText}
${board.headline}
Other players' counts are generated; ${input.senderName.trim().slice(0, 24) || "Bretton"}'s is the only real input.

Actual, self-reported by ${input.senderName.trim().slice(0, 24) || "A tokenmaxxer"}: ${actual} tokens. This is parody; the multiplier is the point.

Unsubscribe permanently: ${input.unsubscribeUrl}`;

  return { ...daily, subject, html, text, imageUrl };
}
