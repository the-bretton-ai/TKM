import type { FlexModeId, FlexResult } from "./flex-engine";

const STORAGE_KEY = "token-flexer:history:v1";
const MAX_LOCAL_RECORDS = 50;

export type ScoreRecord = {
  id: string;
  displayName: string;
  actualTokens: number;
  flexCount: number;
  mode: FlexModeId;
  rank: string;
  recordedAt: string;
};

function isScoreRecord(value: unknown): value is ScoreRecord {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ScoreRecord>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.displayName === "string" &&
    Number.isSafeInteger(candidate.actualTokens) &&
    Number.isSafeInteger(candidate.flexCount) &&
    typeof candidate.mode === "string" &&
    typeof candidate.rank === "string" &&
    typeof candidate.recordedAt === "string"
  );
}

export function loadHistory(storage: Storage = localStorage): ScoreRecord[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isScoreRecord).slice(0, MAX_LOCAL_RECORDS);
  } catch {
    return [];
  }
}

export function saveScore(record: ScoreRecord, storage: Storage = localStorage): ScoreRecord[] {
  const history = [record, ...loadHistory(storage).filter((item) => item.id !== record.id)].slice(
    0,
    MAX_LOCAL_RECORDS,
  );
  storage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

export function createScoreRecord(displayName: string, result: FlexResult): ScoreRecord {
  return {
    id: crypto.randomUUID(),
    displayName: displayName.trim().slice(0, 24) || "Anonymous Maxxer",
    actualTokens: result.actualTokens,
    flexCount: result.flexCount,
    mode: result.mode,
    rank: result.rank,
    recordedAt: new Date().toISOString(),
  };
}

function localDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function consecutiveDayStreak(history: ScoreRecord[], now = new Date()): number {
  const days = new Set(history.map((record) => localDateKey(record.recordedAt)));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let streak = 0;

  if (!days.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  while (days.has(localDateKey(cursor)) && streak < 365) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
