import { MAX_ACTUAL_TOKENS, calculateFlex, parseTokenCount, rankFor } from "./flex-engine";

describe("parseTokenCount", () => {
  it("accepts formatted positive integers", () => {
    expect(parseTokenCount("1,250,000")).toBe(1_250_000);
    expect(parseTokenCount("10_000 000")).toBe(10_000_000);
  });

  it("rejects decimals, negatives, empty input, and unsafe values", () => {
    expect(parseTokenCount("12.5")).toBeNull();
    expect(parseTokenCount("-12")).toBeNull();
    expect(parseTokenCount("")).toBeNull();
    expect(parseTokenCount("9999999999999999")).toBeNull();
  });
});

describe("rankFor", () => {
  it("uses actual-token boundaries", () => {
    expect(rankFor(9_999)).toBe("Prompt Tourist");
    expect(rankFor(10_000)).toBe("Context Enjoyer");
    expect(rankFor(100_000)).toBe("Token Athlete");
    expect(rankFor(1_000_000)).toBe("Tokenmaxxer");
    expect(rankFor(10_000_000)).toBe("Context Window Colonizer");
  });
});

describe("calculateFlex", () => {
  it("is deterministic and discloses the selected multiplier", () => {
    const first = calculateFlex(1_250_000, "tokenmax", 3);
    const second = calculateFlex(1_250_000, "tokenmax", 3);
    expect(first).toEqual(second);
    expect(first.multiplier).toBe(100);
    expect(first.flexCount).toBe(126_824_000);
  });

  it("caps streak bonus input at 365 days", () => {
    expect(calculateFlex(100_000, "warmup", 999).streakBonus).toBe(36_500_000);
  });

  it("rejects invalid counts", () => {
    expect(() => calculateFlex(0, "tokenmax")).toThrow(RangeError);
  });
});

describe("MAX_ACTUAL_TOKENS", () => {
  it("is accepted by the parser and survives the largest multiplier", () => {
    expect(parseTokenCount(String(MAX_ACTUAL_TOKENS))).toBe(MAX_ACTUAL_TOKENS);
    const result = calculateFlex(MAX_ACTUAL_TOKENS, "final-form", 365);
    expect(Number.isSafeInteger(result.flexCount)).toBe(true);
  });

  it("rejects anything above it rather than throwing later", () => {
    expect(parseTokenCount(String(MAX_ACTUAL_TOKENS + 1))).toBeNull();
  });

  it("never throws for any parseable input at any mode", () => {
    const modes = ["warmup", "unhinged", "tokenmax", "final-form"] as const;
    for (const mode of modes) {
      for (const tokens of [1, 999, 1_000_000, 1_000_000_000, MAX_ACTUAL_TOKENS]) {
        expect(() => calculateFlex(tokens, mode, 365)).not.toThrow();
      }
    }
  });
});
