import { calculateFlex, parseTokenCount, rankFor } from "./flex-engine";

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
