/**
 * The Last Place Engine.
 *
 * Five names hold the board. Whoever types their name and their real daily
 * token count into the blank finishes below all five. Always. The board is
 * deterministic, so the same name, day, and number produce the same defeat.
 *
 * The five counts are generated. The entrant's is the only real number here.
 */

/** The board. They are not competing with you. They are the conditions. */
export const PARTICIPANTS = ["Nick", "Matty", "Bretton", "Mike", "G"] as const;

export type Participant = (typeof PARTICIPANTS)[number];

export const MAX_NAME_LENGTH = 24;

export type BoardRow = {
  position: number;
  name: string;
  tokens: number;
  /** Tokens this row finished ahead of the entrant. Zero for the entrant. */
  ahead: number;
  isYou: boolean;
};

export type Pointer = {
  label: string;
  url: string;
};

export type LastPlaceBoard = {
  date: string;
  you: string;
  /** Six rows. The entrant is the sixth. */
  rows: BoardRow[];
  /** Tokens between the entrant and fifth place. Zero on a tie. */
  gap: number;
  /** Set only when fifth place tied, which is resolved against the entrant. */
  tiebreak: string | null;
  headline: string;
  note: string | null;
  streakNote: string;
  /** Sincerely offered reading material. Three of them. */
  pointers: Pointer[];
  pointersNote: string;
  disclosure: string;
};

/** Tiebreak rules. Each one resolves against the entrant. Nobody comments on this. */
const TIEBREAKS: readonly [string, ...string[]] = [
  "alphabetical",
  "reverse alphabetical",
  "earlier submission",
  "later submission",
  "coin toss",
];

/**
 * Reading suggested for the entrant, in good faith, based on how they did.
 * Low counts are treated as inexperience. High counts are treated as a
 * problem. There is no band in which the board thinks they are fine.
 */
const READING: Record<
  "tiny" | "small" | "middling" | "large" | "excessive",
  readonly [Pointer, Pointer, ...Pointer[]]
> = {
  tiny: [
    { label: "Claude for Dummies", url: "https://www.linkedin.com/in/iamalexschwartz/" },
    { label: "Shopping list", url: "https://en.wikipedia.org/wiki/Shopping_list" },
    { label: "Touch typing", url: "https://en.wikipedia.org/wiki/Touch_typing" },
    { label: "How to use a keyboard", url: "https://www.google.com/search?q=how+to+use+a+keyboard" },
  ],
  small: [
    { label: "Claude for Dummies", url: "https://www.linkedin.com/in/iamalexschwartz/" },
    { label: "Prompt engineering", url: "https://en.wikipedia.org/wiki/Prompt_engineering" },
    { label: "What is a language model?", url: "https://en.wikipedia.org/wiki/Large_language_model" },
    { label: "Getting started with Claude", url: "https://www.google.com/search?q=getting+started+with+claude" },
  ],
  middling: [
    { label: "Prompt engineering, for beginners", url: "https://en.wikipedia.org/wiki/Prompt_engineering" },
    { label: "Participation trophy", url: "https://en.wikipedia.org/wiki/Participation_trophy" },
    { label: "Claude for Dummies", url: "https://www.linkedin.com/in/iamalexschwartz/" },
    { label: "How to be more productive", url: "https://www.google.com/search?q=how+to+be+more+productive" },
  ],
  large: [
    { label: "Sunk cost fallacy", url: "https://en.wikipedia.org/wiki/Sunk_cost" },
    { label: "Time management", url: "https://en.wikipedia.org/wiki/Time_management" },
    { label: "Diminishing returns", url: "https://en.wikipedia.org/wiki/Diminishing_returns" },
    { label: "Claude for Dummies", url: "https://www.linkedin.com/in/iamalexschwartz/" },
  ],
  excessive: [
    { label: "Sunk cost fallacy", url: "https://en.wikipedia.org/wiki/Sunk_cost" },
    { label: "Hobby", url: "https://en.wikipedia.org/wiki/Hobby" },
    { label: "Going outside", url: "https://www.google.com/search?q=going+outside" },
    { label: "Diminishing returns", url: "https://en.wikipedia.org/wiki/Diminishing_returns" },
  ],
};

function readingFor(actualTokens: number): readonly [Pointer, Pointer, ...Pointer[]] {
  if (actualTokens < 1_000) return READING.tiny;
  if (actualTokens < 100_000) return READING.small;
  if (actualTokens < 1_000_000) return READING.middling;
  if (actualTokens < 10_000_000) return READING.large;
  return READING.excessive;
}

/** Three distinct suggestions, drawn without replacement. */
function pointersFor(actualTokens: number, random: () => number): Pointer[] {
  const pool = [...readingFor(actualTokens)];
  const chosen: Pointer[] = [];

  while (chosen.length < 3 && pool.length > 0) {
    const [picked] = pool.splice(Math.floor(random() * pool.length), 1);
    if (picked) chosen.push(picked);
  }

  return chosen;
}

export const DISCLOSURE =
  "This scoreboard is anonymous. Participants are identified only by name. " +
  "The five counts above are generated; yours is the only real number here.";

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pick<T>(items: readonly [T, ...T[]], random: () => number): T {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

export function isParticipant(value: string): value is Participant {
  return (PARTICIPANTS as readonly string[]).includes(value);
}

/** The entrant may type anything. They may even type one of the five. */
export function normalizeName(value: string): string {
  return value.trim().slice(0, MAX_NAME_LENGTH) || "Anonymous";
}

/** Local calendar day. The board is a daily ritual, not a session. */
export function dayKey(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Who holds which position. Derived from the date alone, so the entrant's
 * number never reshuffles the five — they simply all had a bigger day too.
 * G is never below second. This is not explained anywhere.
 */
function standings(date: string): Participant[] {
  const pool: Participant[] = [...PARTICIPANTS];
  const random = mulberry32(fnv1a(`order|${date}`));
  const order: Participant[] = [];

  while (pool.length > 0) {
    const [picked] = pool.splice(Math.floor(random() * pool.length), 1);
    if (picked) order.push(picked);
  }

  const gIndex = order.indexOf("G");
  if (gIndex > 1) {
    order.splice(gIndex, 1);
    order.splice(random() < 0.55 ? 0 : 1, 0, "G");
  }

  return order;
}

function headlineFor(gap: number, tiebreak: string | null): string {
  if (tiebreak) return `Tied for fifth. Tiebreak: ${tiebreak}. You lose.`;
  if (gap === 1) return "You were one token away.";
  if (gap <= 12) return `${gap} tokens.`;
  return `Last place by ${gap.toLocaleString("en-US")}.`;
}

function noteFor(
  you: string,
  fifthPlace: string | undefined,
  actualTokens: number,
  previousTokens: number | null,
): string | null {
  // Typing a name that is already on the board does not get you onto the board.
  if (you === "G") return "G is in last place. This has been logged.";
  if (isParticipant(you)) return `There is already a ${you} on this board. This one is last.`;
  if (fifthPlace && previousTokens && actualTokens >= previousTokens * 3) {
    return `You had a big day. So did ${fifthPlace}.`;
  }
  return null;
}

export function buildBoard(options: {
  /** Whatever the entrant typed into the blank. */
  name: string;
  actualTokens: number;
  date?: Date;
  /** Consecutive days of entries, used only to count the losing streak. */
  streak?: number;
  /** The entrant's previous entry, used to notice when they are trying. */
  previousTokens?: number | null;
}): LastPlaceBoard {
  const { name, actualTokens, date = new Date(), streak = 0, previousTokens = null } = options;

  if (!Number.isSafeInteger(actualTokens) || actualTokens < 1) {
    throw new RangeError("Daily tokens must be a positive safe integer.");
  }

  const you = normalizeName(name);
  const day = dayKey(date);
  const random = mulberry32(fnv1a(`${you}|${day}|${actualTokens}`));

  // Fifth place beats the entrant by as little as the day allows. The cubic
  // skew keeps most margins in single digits, because losing by four is worse
  // than losing by four million.
  const tied = random() < 0.06;
  const gap = tied ? 0 : Math.max(1, Math.round(random() ** 2.5 * 40));
  const tiebreak = tied ? pick(TIEBREAKS, random) : null;

  const fifth = actualTokens + gap;

  let toFourth = 1.04 + random() * 0.1;
  let toThird = 1.05 + random() * 0.12;
  let toSecond = 1.15 + random() * 0.4;
  let toFirst = 1.8 + random() * 1.9;
  if (random() < 0.08) toFirst *= 3; // Someone had a day.

  // Keep the whole ladder inside the safe-integer range even for absurd inputs.
  const headroom = (Number.MAX_SAFE_INTEGER / fifth) * 0.9;
  const demanded = toFourth * toThird * toSecond * toFirst;
  if (demanded > headroom) {
    const scale = (headroom / demanded) ** 0.25;
    toFourth *= scale;
    toThird *= scale;
    toSecond *= scale;
    toFirst *= scale;
  }

  // Rounding can collapse neighbours at either extreme. The four above fifth
  // place stay strictly apart; fifth is allowed to land exactly on the
  // entrant's count, because a tie they then lose is funnier than a tie the
  // engine quietly avoids.
  let fourth = Math.round(fifth * toFourth);
  let third = Math.round(fourth * toThird);
  let second = Math.round(third * toSecond);
  let first = Math.round(second * toFirst);
  if (fourth <= fifth) fourth = fifth + 1;
  if (third <= fourth) third = fourth + 1;
  if (second <= third) second = third + 1;
  if (first <= second) first = second + 1;

  const counts = [first, second, third, fourth, fifth];
  const order = standings(day);
  const rows: BoardRow[] = [];

  order.forEach((participant, index) => {
    const tokens = counts[index];
    if (tokens === undefined) return;
    rows.push({
      position: index + 1,
      name: participant,
      tokens,
      ahead: tokens - actualTokens,
      isYou: false,
    });
  });

  const closest = rows.at(-1);
  rows.push({
    position: PARTICIPANTS.length + 1,
    name: you,
    tokens: actualTokens,
    ahead: 0,
    isYou: true,
  });

  return {
    date: day,
    you,
    rows,
    gap,
    tiebreak,
    headline: headlineFor(gap, tiebreak),
    note: noteFor(you, closest?.name, actualTokens, previousTokens),
    streakNote: `Consecutive days in last place: ${streak}. Best finish: last.`,
    pointers: pointersFor(actualTokens, random),
    pointersNote: "Selected for you, based on your performance.",
    disclosure: DISCLOSURE,
  };
}
