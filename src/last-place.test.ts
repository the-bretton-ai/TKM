import {
  buildBoard,
  dayKey,
  MAX_NAME_LENGTH,
  normalizeName,
  PARTICIPANTS,
} from "./last-place";

const DATES = [
  new Date(2026, 7, 29),
  new Date(2026, 8, 1),
  new Date(2026, 11, 25),
  new Date(2027, 0, 1),
];

const NAMES = ["Dave", "someone", "Bretton", "G", "ANONYMOUS COWARD"];

const TOKENS = [1, 2, 47, 999, 1_000, 12_345, 999_999, 1_250_000, 9_999_999, 84_000_000, 999_999_999_999_999];

function everyBoard(): ReturnType<typeof buildBoard>[] {
  const boards = [];
  for (const name of NAMES) {
    for (const date of DATES) {
      for (const actualTokens of TOKENS) {
        boards.push(buildBoard({ name, actualTokens, date }));
      }
    }
  }
  return boards;
}

describe("the premise", () => {
  it("puts whoever filled in the blank in last place, every time", () => {
    for (const board of everyBoard()) {
      const last = board.rows.at(-1)!;
      expect(board.rows).toHaveLength(6);
      expect(last.isYou).toBe(true);
      expect(last.name).toBe(board.you);
      expect(last.position).toBe(6);
      expect(board.rows.filter((row) => row.isYou)).toHaveLength(1);
    }
  });

  it("always seats the five above the entrant", () => {
    for (const board of everyBoard()) {
      expect(board.rows.slice(0, 5).map((row) => row.name).sort()).toEqual([...PARTICIPANTS].sort());
      expect(board.rows.slice(0, 5).every((row) => !row.isYou)).toBe(true);
    }
  });

  it("never lets the entrant's real count outrank a generated one", () => {
    for (const board of everyBoard()) {
      const you = board.rows.at(-1)!;
      for (const row of board.rows.slice(0, 5)) {
        expect(row.tokens).toBeGreaterThanOrEqual(you.tokens);
        expect(row.ahead).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("orders the board downward, and keeps the five strictly apart", () => {
    for (const board of everyBoard()) {
      for (let index = 1; index < board.rows.length; index += 1) {
        const above = board.rows[index - 1]!.tokens;
        const below = board.rows[index]!.tokens;
        // Fifth place may land exactly on the entrant; nobody else may collide.
        if (index === 5) expect(above).toBeGreaterThanOrEqual(below);
        else expect(above).toBeGreaterThan(below);
      }
    }
  });

  it("keeps every generated count a safe integer", () => {
    for (const board of everyBoard()) {
      for (const row of board.rows) expect(Number.isSafeInteger(row.tokens)).toBe(true);
    }
  });
});

describe("determinism", () => {
  it("returns the identical board for the same name, day, and count", () => {
    const options = { name: "Dave", actualTokens: 1_204_881, date: new Date(2026, 7, 29) };
    expect(buildBoard(options)).toEqual(buildBoard(options));
  });

  it("keeps the standings stable when the entrant changes their number", () => {
    const date = new Date(2026, 7, 29);
    const modest = buildBoard({ name: "Dave", actualTokens: 40_000, date });
    const desperate = buildBoard({ name: "Dave", actualTokens: 40_000_000, date });

    expect(desperate.rows.slice(0, 5).map((row) => row.name)).toEqual(
      modest.rows.slice(0, 5).map((row) => row.name),
    );
    expect(desperate.rows[4]!.tokens).toBeGreaterThan(modest.rows[4]!.tokens);
  });
});

describe("names", () => {
  it("trims, caps, and supplies a default", () => {
    expect(normalizeName("  Dave  ")).toBe("Dave");
    expect(normalizeName("")).toBe("Anonymous");
    expect(normalizeName("   ")).toBe("Anonymous");
    expect(normalizeName("x".repeat(80))).toHaveLength(MAX_NAME_LENGTH);
  });

  it("does not let you onto the board by typing a name that is already on it", () => {
    const board = buildBoard({ name: "Bretton", actualTokens: 5_000_000, date: new Date(2026, 7, 29) });
    expect(board.rows.at(-1)!.name).toBe("Bretton");
    expect(board.rows.filter((row) => row.name === "Bretton")).toHaveLength(2);
    expect(board.note).toBe("There is already a Bretton on this board. This one is last.");
  });

  it("logs the anomaly when someone claims to be G", () => {
    const board = buildBoard({ name: "G", actualTokens: 250_000, date: new Date(2026, 7, 29) });
    expect(board.note).toBe("G is in last place. This has been logged.");
  });
});

describe("house rules", () => {
  it("never seats G below second", () => {
    for (const board of everyBoard()) {
      expect(board.rows.slice(0, 5).findIndex((row) => row.name === "G")).toBeLessThan(2);
    }
  });

  it("notices when the entrant is trying", () => {
    const board = buildBoard({
      name: "Dave",
      actualTokens: 900_000,
      previousTokens: 100_000,
      date: new Date(2026, 7, 29),
    });
    expect(board.note).toMatch(/^You had a big day\. So did (Nick|Matty|Bretton|Mike|G)\.$/);
  });

  it("resolves a fifth-place tie against the entrant", () => {
    const tied = Array.from({ length: 400 }, (_, index) =>
      buildBoard({ name: "Dave", actualTokens: 50_000 + index, date: new Date(2026, 7, 29) }),
    ).find((board) => board.tiebreak !== null);

    expect(tied).toBeDefined();
    expect(tied!.gap).toBe(0);
    expect(tied!.headline).toBe(`Tied for fifth. Tiebreak: ${tied!.tiebreak}. You lose.`);
    // A real tie, resolved by a rule rather than by fudging the number.
    expect(tied!.rows[4]!.tokens).toBe(tied!.rows[5]!.tokens);
    expect(tied!.rows[5]!.isYou).toBe(true);
  });

  it("reports the small margins that actually hurt", () => {
    const board = Array.from({ length: 400 }, (_, index) =>
      buildBoard({ name: "Dave", actualTokens: 10_000 + index, date: new Date(2026, 7, 29) }),
    ).find((candidate) => candidate.gap === 1);

    expect(board?.headline).toBe("You were one token away.");
  });

  it("counts the streak in the only direction available", () => {
    const board = buildBoard({ name: "Dave", actualTokens: 5_000, streak: 47, date: new Date(2026, 7, 29) });
    expect(board.streakNote).toBe("Consecutive days in last place: 47. Best finish: last.");
  });

  it("insists on anonymity while naming everyone", () => {
    const board = buildBoard({ name: "Dave", actualTokens: 5_000, date: new Date(2026, 7, 29) });
    expect(board.disclosure).toContain("anonymous");
    expect(board.disclosure).toContain("identified only by name");
  });
});

describe("recommended reading", () => {
  it("offers three distinct working links on every board", () => {
    for (const board of everyBoard()) {
      expect(board.pointers).toHaveLength(3);
      expect(new Set(board.pointers.map((pointer) => pointer.url)).size).toBe(3);
      for (const pointer of board.pointers) {
        expect(pointer.url.startsWith("https://")).toBe(true);
        expect(pointer.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("treats a small count as inexperience", () => {
    const labels = Array.from({ length: 40 }, (_, index) =>
      buildBoard({ name: "Dave", actualTokens: 100 + index, date: new Date(2026, 7, 29) }),
    ).flatMap((board) => board.pointers.map((pointer) => pointer.label));

    expect(labels).toContain("Claude for Dummies");
    expect(labels).toContain("Touch typing");
  });

  it("treats an enormous count as a problem instead", () => {
    const labels = Array.from({ length: 40 }, (_, index) =>
      buildBoard({ name: "Dave", actualTokens: 20_000_000 + index, date: new Date(2026, 7, 29) }),
    ).flatMap((board) => board.pointers.map((pointer) => pointer.label));

    expect(labels).toContain("Sunk cost fallacy");
    expect(labels).toContain("Going outside");
    expect(labels).not.toContain("Touch typing");
  });

  it("offers the reading sincerely", () => {
    const board = buildBoard({ name: "Dave", actualTokens: 5_000, date: new Date(2026, 7, 29) });
    expect(board.pointersNote).toBe("Selected for you, based on your performance.");
  });
});

describe("input guards", () => {
  it("rejects impossible counts", () => {
    expect(() => buildBoard({ name: "Dave", actualTokens: 0 })).toThrow(RangeError);
    expect(() => buildBoard({ name: "Dave", actualTokens: 1.5 })).toThrow(RangeError);
  });

  it("keys the board to the local calendar day", () => {
    expect(dayKey(new Date(2026, 7, 29))).toBe("2026-08-29");
    expect(dayKey(new Date(2027, 0, 1))).toBe("2027-01-01");
  });
});
