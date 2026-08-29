import { calculateFlex } from "./flex-engine";
import {
  COMEDY_VARIANTS,
  MEME_IMAGES,
  renderDailyEmail,
  selectDailyPackage,
  selectDailySendHour,
} from "./email-rotation";

describe("daily comedy rotation", () => {
  it("ships seven curated variants and three project images", () => {
    expect(COMEDY_VARIANTS).toHaveLength(7);
    expect(MEME_IMAGES).toHaveLength(3);
    expect(new Set(COMEDY_VARIANTS.map((variant) => variant.id)).size).toBe(7);
  });

  it("is deterministic for an alias and UTC date", () => {
    const date = new Date("2026-08-29T02:00:00.000Z");
    expect(selectDailyPackage("friendly-rival", date)).toEqual(selectDailyPackage("friendly-rival", date));
  });

  it("rotates across a representative week", () => {
    const variants = new Set(
      Array.from({ length: 7 }, (_, index) =>
        selectDailyPackage("friendly-rival", new Date(`2026-09-0${index + 1}T12:00:00.000Z`)).variant.id,
      ),
    );
    expect(variants.size).toBeGreaterThanOrEqual(4);
  });

  it("chooses a stable hour inside the approved UTC window", () => {
    const date = new Date("2026-08-29T02:00:00.000Z");
    const hour = selectDailySendHour("friendly-rival", date, 14, 18);
    expect(hour).toBeGreaterThanOrEqual(14);
    expect(hour).toBeLessThanOrEqual(18);
    expect(selectDailySendHour("friendly-rival", date, 14, 18)).toBe(hour);
  });

  it("rejects ambiguous wrapping windows", () => {
    expect(() => selectDailySendHour("friendly-rival", new Date(), 22, 6)).toThrow(RangeError);
  });
});

describe("email rendering", () => {
  it("escapes names and preserves every disclosure without relying on the image", () => {
    const email = renderDailyEmail({
      alias: "friendly-rival",
      senderName: "<img src=x onerror=alert(1)>",
      result: calculateFlex(1_250_000, "tokenmax"),
      date: new Date("2026-08-29T12:00:00.000Z"),
      appOrigin: "https://token-flexer.example",
      unsubscribeUrl: "https://token-flexer.example/.netlify/functions/unsubscribe?token=safe",
    });

    expect(email.html).not.toContain("<img src=x onerror=alert(1)>");
    expect(email.html).toContain("SATIRICAL FLEX COUNT");
    expect(email.html).toContain("Actual, self-reported");
    expect(email.text).toContain("DO YOU EVEN TOKENMAX, BRO?");
    expect(email.imageUrl).toMatch(/^https:\/\/token-flexer\.example\/assets\/token-/);
  });
});
