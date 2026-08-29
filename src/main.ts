import "./styles.css";
import {
  calculateFlex,
  formatCompact,
  formatFull,
  isFlexMode,
  parseTokenCount,
  type FlexResult,
} from "./flex-engine";
import {
  consecutiveDayStreak,
  createScoreRecord,
  loadHistory,
  saveScore,
  type ScoreRecord,
} from "./history";
import { downloadMeme } from "./meme";
import {
  buildBoard,
  normalizeName,
  type LastPlaceBoard,
} from "./last-place";
import { selectDailyPackage } from "./email-rotation";

const form = requiredElement<HTMLFormElement>("flex-form");
const nameInput = requiredElement<HTMLInputElement>("display-name");
const tokenInput = requiredElement<HTMLInputElement>("token-count");
const tokenError = requiredElement<HTMLElement>("token-error");
const resultPanel = requiredElement<HTMLElement>("result-panel");
const actualOutput = requiredElement<HTMLElement>("actual-output");
const coinPile = requiredElement<HTMLElement>("coin-pile");
const scoreList = requiredElement<HTMLOListElement>("score-list");
const boardHeadline = requiredElement<HTMLElement>("board-headline");
const boardNote = requiredElement<HTMLElement>("board-note");
const boardStreak = requiredElement<HTMLElement>("board-streak");
const boardDisclosure = requiredElement<HTMLElement>("board-disclosure");
const boardPointers = requiredElement<HTMLUListElement>("board-pointers");
const boardPointersNote = requiredElement<HTMLElement>("board-pointers-note");
const canvas = requiredElement<HTMLCanvasElement>("meme-canvas");
const downloadButton = requiredElement<HTMLButtonElement>("download-meme");
const openEmailButton = requiredElement<HTMLButtonElement>("open-email");
const emailDialog = requiredElement<HTMLDialogElement>("email-dialog");
const emailFlexCount = requiredElement<HTMLElement>("email-flex-count");
const sendEmailButton = requiredElement<HTMLButtonElement>("send-email");
const sendKeyInput = requiredElement<HTMLInputElement>("send-key");
const recipientSelect = requiredElement<HTMLSelectElement>("recipient-alias");
const emailStatus = requiredElement<HTMLElement>("email-status");
const heroImage = requiredElement<HTMLImageElement>("hero-image");

let history = loadHistory();
let currentName = normalizeName(nameInput.value);
let currentResult = calculateFlex(1_250_000, "tokenmax", consecutiveDayStreak(history));

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element as T;
}

function selectedMode(): string {
  const selected = form.elements.namedItem("mode");
  if (!(selected instanceof RadioNodeList)) return "tokenmax";
  return selected.value;
}

function formatInput(): void {
  const parsed = parseTokenCount(tokenInput.value);
  if (parsed) tokenInput.value = formatFull(parsed);
}

function renderResult(result: FlexResult, _previous?: ScoreRecord): void {
  actualOutput.textContent = `${formatFull(result.actualTokens)} tokens`;
  emailFlexCount.textContent = formatFull(result.flexCount);

  resultPanel.classList.remove("is-flexing");
  window.requestAnimationFrame(() => resultPanel.classList.add("is-flexing"));
}

function renderScoreboard(board: LastPlaceBoard): void {
  boardHeadline.textContent = board.headline;
  boardNote.textContent = board.note ?? "";
  boardNote.hidden = board.note === null;
  boardStreak.textContent = board.streakNote;
  boardDisclosure.textContent = board.disclosure;
  boardPointersNote.textContent = board.pointersNote;

  boardPointers.replaceChildren();
  for (const pointer of board.pointers) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = pointer.url;
    link.textContent = pointer.label;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    item.append(link);
    boardPointers.append(item);
  }

  scoreList.replaceChildren();

  for (const row of board.rows) {
    const item = document.createElement("li");
    if (row.isYou) item.classList.add("is-you");

    const rank = document.createElement("span");
    rank.className = "score-rank";
    rank.textContent = String(row.position).padStart(2, "0");

    const person = document.createElement("span");
    person.className = "score-person";
    const personName = document.createElement("b");
    personName.textContent = row.name;
    const personStatus = document.createElement("small");
    if (row.isYou) personStatus.textContent = "Last";
    else if (row.ahead === 0) personStatus.textContent = `Tied — ${board.tiebreak}`;
    else personStatus.textContent = "Ahead of you";
    person.append(personName, personStatus);

    const margin = document.createElement("span");
    if (row.isYou) margin.textContent = "—";
    else if (row.ahead === 0) margin.textContent = "TIED";
    else margin.textContent = `+${formatCompact(row.ahead)}`;

    const tokens = document.createElement("strong");
    tokens.textContent = formatFull(row.tokens);

    const badge = document.createElement("span");
    badge.className = "score-badge";
    badge.textContent = row.isYou ? "YOU" : "AHEAD";

    item.append(rank, person, margin, tokens, badge);
    scoreList.append(item);
  }
}

const analysisSection = requiredElement<HTMLElement>("analysis");
const supportSection = requiredElement<HTMLElement>("support");
const protocolSection = requiredElement<HTMLElement>("protocol");
const scoreboardSection = requiredElement<HTMLElement>("scoreboard");
const statRow = requiredElement<HTMLElement>("stat-row");
const chartHaul = requiredElement<HTMLElement>("chart-haul");
const chartPosition = requiredElement<HTMLElement>("chart-position");
const evidenceGrid = requiredElement<HTMLElement>("evidence-grid");
const courseList = requiredElement<HTMLUListElement>("course-list");
const supportAnswer = requiredElement<HTMLElement>("support-answer");
const talkClaudeButton = requiredElement<HTMLButtonElement>("talk-claude");

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * A heap of tokens, drawn once. Rows are laid out bottom-up with a fixed
 * nudge pattern rather than random offsets, so the pile is identical on every
 * render and never jitters when the panel re-reveals.
 */
function renderCoinPile(): void {
  const rows = [7, 6, 4, 3, 1];
  const r = 30;
  const squash = 0.58;
  const xStep = r * 1.72;
  const yStep = r * 0.62;
  const nudge = [0, -7, 5, -4, 8, -6, 3];

  const width = 620;
  const height = rows.length * yStep + r * 2.4;
  const baseY = height - r * 1.1;

  const root = svg("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height: "auto" });

  const hex = (cx: number, cy: number, radius: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i);
      return `${cx + radius * Math.cos(a)},${cy + radius * squash * Math.sin(a)}`;
    }).join(" ");

  rows.forEach((count, rowIndex) => {
    const cy = baseY - rowIndex * yStep;
    const rowWidth = (count - 1) * xStep;
    const startX = (width - rowWidth) / 2;

    for (let i = 0; i < count; i += 1) {
      const cx = startX + i * xStep + (nudge[i % nudge.length] ?? 0);
      // Edge first, then face, so each token reads as having thickness.
      root.append(svg("polygon", { points: hex(cx, cy + 9, r), fill: "#7f9b1c" }));
      root.append(svg("polygon", { points: hex(cx, cy, r), fill: RIVAL_FILL, stroke: "#5f7514", "stroke-width": 1.5 }));
      root.append(svg("polygon", { points: hex(cx, cy, r * 0.52), fill: "none", stroke: "#7f9b1c", "stroke-width": 1.5 }));
    }
  });

  coinPile.replaceChildren(root);
}

/**
 * Rivals in lime, you in coral. Validated: deutan ΔE 24.1, so the one
 * distinction this page exists to make survives colour blindness. Names are
 * direct-labelled on every bar so identity is never carried by colour alone.
 */
const RIVAL_FILL = "#d7ff36";
const YOU_FILL = "#ff5c48";

function svg(tag: string, attrs: Record<string, string | number>): SVGElement {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function renderStats(board: LastPlaceBoard): void {
  const you = board.rows.find((row) => row.isYou);
  const total = board.rows.reduce((sum, row) => sum + row.tokens, 0);
  const share = you && total > 0 ? (you.tokens / total) * 100 : 0;

  const cells: Array<[string, string, string]> = [
    ["Finishing position", `${board.rows.length} of ${board.rows.length}`, "Unchanged"],
    ["Share of today's total", `${share.toFixed(1)}%`, "Of the group's combined haul"],
    ["Behind fifth place by", formatCompact(board.rows[board.rows.length - 2]?.ahead ?? 0), "Tokens"],
  ];

  statRow.replaceChildren();
  for (const [label, value, note] of cells) {
    const cell = document.createElement("div");
    cell.className = "stat-cell";
    const k = document.createElement("span");
    k.textContent = label;
    const v = document.createElement("strong");
    v.textContent = value;
    const n = document.createElement("small");
    n.textContent = note;
    cell.append(k, v, n);
    statRow.append(cell);
  }
}

function renderHaulChart(board: LastPlaceBoard): void {
  const rows = board.rows;
  const rowHeight = 34;
  const labelWidth = 92;
  const valueWidth = 108;
  const width = 620;
  const height = rows.length * rowHeight + 16;
  const plotWidth = width - labelWidth - valueWidth;
  const max = Math.max(...rows.map((row) => row.tokens), 1);

  const yours = rows.find((row) => row.isYou);
  const root = svg("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: "auto",
    role: "img",
    "aria-label": yours
      ? `Today's haul ranked. You are last of ${rows.length} with ${formatFull(yours.tokens)} tokens.`
      : `Today's haul ranked across ${rows.length} people.`,
  });

  rows.forEach((row, index) => {
    const y = index * rowHeight + 8;
    // A minimum width keeps a tiny haul visible rather than vanishing into the axis.
    const barWidth = Math.max((row.tokens / max) * plotWidth, 3);

    const name = svg("text", {
      x: 0,
      y: y + 15,
      fill: row.isYou ? YOU_FILL : "currentColor",
      "font-size": 12,
      "font-weight": row.isYou ? 700 : 500,
    });
    name.textContent = row.name;

    const bar = svg("rect", {
      x: labelWidth,
      y,
      width: barWidth,
      height: 20,
      rx: 4,
      fill: row.isYou ? YOU_FILL : RIVAL_FILL,
      opacity: row.isYou ? 1 : 0.72,
    });
    const title = svg("title", {});
    title.textContent = `${row.name}: ${formatFull(row.tokens)} tokens`;
    bar.append(title);

    const value = svg("text", {
      x: width,
      y: y + 15,
      fill: "currentColor",
      "font-size": 11,
      "text-anchor": "end",
      opacity: 0.75,
    });
    value.textContent = formatCompact(row.tokens);

    root.append(name, bar, value);
  });

  chartHaul.replaceChildren(root);
}

function renderPositionChart(board: LastPlaceBoard): void {
  const days = 14;
  const last = board.rows.length;
  const width = 620;
  const height = 150;
  const padTop = 16;
  const padBottom = 26;
  const padLeft = 26;
  const step = (width - padLeft - 12) / (days - 1);
  const yFor = (position: number) =>
    padTop + ((position - 1) / (last - 1)) * (height - padTop - padBottom);

  const root = svg("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: "auto",
    role: "img",
    "aria-label": `Finishing position for the last ${days} days. Position ${last} of ${last} on every day.`,
  });

  for (let position = 1; position <= last; position += last - 1) {
    const y = yFor(position);
    root.append(svg("line", { x1: padLeft, y1: y, x2: width - 12, y2: y, stroke: "currentColor", "stroke-opacity": 0.14, "stroke-width": 1 }));
    const tick = svg("text", { x: 0, y: y + 4, fill: "currentColor", "font-size": 10, opacity: 0.5 });
    tick.textContent = String(position);
    root.append(tick);
  }

  const y = yFor(last);
  const points = Array.from({ length: days }, (_, i) => `${padLeft + i * step},${y}`).join(" ");
  root.append(svg("polyline", { points, fill: "none", stroke: YOU_FILL, "stroke-width": 2, "stroke-linecap": "round" }));

  for (let i = 0; i < days; i += 1) {
    root.append(svg("circle", { cx: padLeft + i * step, cy: y, r: 4, fill: YOU_FILL }));
  }

  const caption = svg("text", { x: padLeft, y: height - 6, fill: "currentColor", "font-size": 10, opacity: 0.55 });
  caption.textContent = `14 days · position ${last} of ${last} · no variance recorded`;
  root.append(caption);

  chartPosition.replaceChildren(root);
}

function renderEvidence(board: LastPlaceBoard): void {
  // Credit the friends, never the entrant - the exhibits are of them, and the
  // entrant is the one being shown them. Takes the top three off the board.
  const friends = board.rows.filter((row) => !row.isYou).map((row) => row.name);

  const exhibits: Array<[string, string, string]> = [
    ["/assets/token-athlete.png", "Exhibit A", "You, allegedly, at peak performance."],
    ["/assets/token-pit-crew.png", "Exhibit B", "Support staff, reviewing the haul."],
    ["/assets/token-throne.png", "Exhibit C", "The seat you did not take."],
  ];

  evidenceGrid.replaceChildren();
  for (const [index, [src, label, caption]] of exhibits.entries()) {
    const credit = friends[index] ?? friends[friends.length - 1] ?? "";
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = src;
    image.alt = caption;
    image.loading = "lazy";
    image.width = 400;
    image.height = 225;
    const cap = document.createElement("figcaption");
    const strong = document.createElement("b");
    strong.textContent = label;
    const name = document.createElement("em");
    name.className = "exhibit-name";
    name.textContent = credit;
    const text = document.createElement("span");
    text.textContent = caption;
    cap.append(strong, name, text);
    figure.append(image, cap);
    evidenceGrid.append(figure);
  }
}

/**
 * Search URLs rather than video ids on purpose: a search page always resolves,
 * so the joke never lands on a deleted video or a 404.
 */
function renderCourses(): void {
  const courses: Array<[string, string, string]> = [
    [
      "Claude 101",
      "https://www.youtube.com/results?search_query=claude+ai+tutorial+for+beginners",
      "Start at the beginning. The beginning is where you are.",
    ],
    [
      "Alex and Mike's Weak App",
      "/weak-app.html",
      "A cautionary tale. Watch to the end.",
    ],
    [
      "Who is JSON?",
      "https://www.json.org/json-en.html",
      "Not a person. Never was a person. You have been saying it wrong.",
    ],
  ];

  courseList.replaceChildren();
  for (const [label, url, blurb] of courses) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    const note = document.createElement("small");
    note.textContent = blurb;
    item.append(link, note);
    courseList.append(item);
  }
}

function revealResults(): void {
  for (const section of [resultPanel, scoreboardSection, analysisSection, supportSection, protocolSection]) {
    section.hidden = false;
  }
}

function currentBoard(actualTokens: number, previousTokens: number | null): LastPlaceBoard {
  return buildBoard({
    name: currentName,
    actualTokens,
    streak: consecutiveDayStreak(history),
    previousTokens,
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  tokenError.textContent = "";
  tokenInput.removeAttribute("aria-invalid");

  const actualTokens = parseTokenCount(tokenInput.value);
  if (!actualTokens) {
    tokenInput.setAttribute("aria-invalid", "true");
    tokenError.textContent = "Enter a whole number from 1 to 999 trillion.";
    tokenInput.focus();
    return;
  }

  const mode = selectedMode();
  if (!isFlexMode(mode)) return;

  const previous = history[0];
  currentName = normalizeName(nameInput.value);
  currentResult = calculateFlex(actualTokens, mode, consecutiveDayStreak(history));
  const record = createScoreRecord(currentName, currentResult);
  history = saveScore(record);

  const board = currentBoard(actualTokens, previous?.actualTokens ?? null);

  formatInput();
  renderResult(currentResult, previous);
  renderScoreboard(board);
  renderStats(board);
  renderHaulChart(board);
  renderPositionChart(board);
  renderEvidence(board);
  renderCourses();
  renderCoinPile();
  revealResults();

  scoreboardSection.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
});


/**
 * Option B is a support queue that loses patience. Three clicks, then it gives
 * up on you. Clicks past the third keep the final message rather than cycling.
 */
const CLAUDE_QUEUE: Array<{ line: string; href: string; label: string }> = [
  {
    line: "Connecting you to Claude. Please hold.",
    href: "https://claude.ai",
    label: "Speak to Claude",
  },
  {
    line: "Still connecting. Claude is reviewing your placement and has some questions.",
    href: "https://claude.ai",
    label: "Speak to Claude",
  },
  {
    line: "Stop clicking motherfucker. Go back to ChatGPT.",
    href: "https://chatgpt.com",
    label: "Go back to ChatGPT",
  },
];

let claudeClicks = 0;

talkClaudeButton.addEventListener("click", () => {
  claudeClicks += 1;
  const step = CLAUDE_QUEUE[Math.min(claudeClicks, CLAUDE_QUEUE.length) - 1];
  if (!step) return;

  supportAnswer.replaceChildren();
  const line = document.createElement("p");
  line.textContent = step.line;
  const link = document.createElement("a");
  link.href = step.href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = step.label;
  supportAnswer.append(line, link);
});

tokenInput.addEventListener("blur", formatInput);

document.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    tokenInput.value = formatFull(Number(button.dataset.preset));
    tokenInput.focus();
  });
});

downloadButton.addEventListener("click", async () => {
  const original = downloadButton.textContent;
  downloadButton.disabled = true;
  downloadButton.textContent = "Rendering receipt…";
  try {
    await downloadMeme(canvas, currentName, currentResult);
    downloadButton.textContent = "Receipt downloaded";
  } catch (error) {
    downloadButton.textContent = error instanceof Error ? error.message : "Download failed";
  } finally {
    window.setTimeout(() => {
      downloadButton.disabled = false;
      downloadButton.textContent = original;
    }, 1800);
  }
});

openEmailButton.addEventListener("click", () => {
  emailFlexCount.textContent = formatFull(currentResult.flexCount);
  emailStatus.textContent = "Demo-safe: no email has been sent.";
  emailDialog.showModal();
});

sendEmailButton.addEventListener("click", async () => {
  const sendKey = sendKeyInput.value;
  if (!sendKey) {
    emailStatus.textContent = "Add the owner send key to request a live delivery.";
    sendKeyInput.focus();
    return;
  }

  sendEmailButton.disabled = true;
  emailStatus.textContent = "Checking the allowlist and preparing delivery…";

  try {
    const response = await fetch("/.netlify/functions/send-flex", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sendKey}`,
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        recipientAlias: recipientSelect.value,
        displayName: currentName,
        actualTokens: currentResult.actualTokens,
        mode: currentResult.mode,
      }),
    });

    const payload = (await response.json()) as { message?: string };
    emailStatus.textContent = payload.message ?? (response.ok ? "Approved email sent." : "Delivery was denied.");
  } catch {
    emailStatus.textContent = "Live delivery is unavailable. Your preview is still safe and local.";
  } finally {
    sendEmailButton.disabled = false;
  }
});

nameInput.addEventListener("change", () => {
  currentName = normalizeName(nameInput.value);
  renderScoreboard(currentBoard(currentResult.actualTokens, history[0]?.actualTokens ?? null));
  heroImage.src = selectDailyPackage(currentName.toLowerCase(), new Date()).image.path;
});

renderResult(currentResult, history[0]);
renderScoreboard(currentBoard(currentResult.actualTokens, history[0]?.actualTokens ?? null));

const dailyImage = selectDailyPackage(currentName.toLowerCase(), new Date()).image;
heroImage.src = dailyImage.path;
