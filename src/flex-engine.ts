export const FLEX_MODES = {
  warmup: { id: "warmup", multiplier: 10, label: "Warm-up" },
  unhinged: { id: "unhinged", multiplier: 50, label: "Unhinged" },
  tokenmax: { id: "tokenmax", multiplier: 100, label: "Tokenmax" },
  "final-form": { id: "final-form", multiplier: 500, label: "Final form" },
} as const;

export type FlexModeId = keyof typeof FLEX_MODES;

export type FlexResult = {
  actualTokens: number;
  flexCount: number;
  multiplier: number;
  mode: FlexModeId;
  modeLabel: string;
  rank: string;
  aura: number;
  streakBonus: number;
};

/**
 * The largest input whose Flex Count still fits in a safe integer at the
 * biggest multiplier. Final form is 500x, so the ceiling is roughly
 * MAX_SAFE_INTEGER / 500 once the aura and a full 365-day streak bonus are
 * allowed for. The previous value (999 trillion) was ~55x too high: it let
 * parseTokenCount accept counts that calculateFlex then threw on.
 */
export const MAX_ACTUAL_TOKENS = 18_000_000_000_000;

export function parseTokenCount(input: string): number | null {
  const normalized = input.replace(/[,_\s]/g, "").trim();

  if (!/^\d+$/.test(normalized)) return null;

  const value = Number(normalized);
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_ACTUAL_TOKENS) return null;

  return value;
}

export function rankFor(actualTokens: number): string {
  if (actualTokens >= 10_000_000) return "Context Window Colonizer";
  if (actualTokens >= 1_000_000) return "Tokenmaxxer";
  if (actualTokens >= 100_000) return "Token Athlete";
  if (actualTokens >= 10_000) return "Context Enjoyer";
  return "Prompt Tourist";
}

export function calculateFlex(
  actualTokens: number,
  mode: FlexModeId,
  consecutiveDays = 0,
): FlexResult {
  if (!Number.isSafeInteger(actualTokens) || actualTokens < 1 || actualTokens > MAX_ACTUAL_TOKENS) {
    throw new RangeError("Actual tokens must be a positive safe integer within the supported range.");
  }

  const selectedMode = FLEX_MODES[mode];
  if (!selectedMode) throw new RangeError("Unsupported flex mode.");

  const normalizedStreak = Math.max(0, Math.min(Math.floor(consecutiveDays), 365));
  const aura = Math.round(Math.log10(actualTokens + 10) * 250_000);
  const streakBonus = normalizedStreak * 100_000;
  const rawFlex = actualTokens * selectedMode.multiplier + aura + streakBonus;
  const flexCount = Math.round(rawFlex / 1_000) * 1_000;

  if (!Number.isSafeInteger(flexCount)) {
    throw new RangeError("The flexed count exceeds the supported range.");
  }

  return {
    actualTokens,
    flexCount,
    multiplier: selectedMode.multiplier,
    mode,
    modeLabel: selectedMode.label,
    rank: rankFor(actualTokens),
    aura,
    streakBonus,
  };
}

export function formatFull(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

export function isFlexMode(value: string): value is FlexModeId {
  return value in FLEX_MODES;
}
