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
const rankOutput = requiredElement<HTMLElement>("rank-output");
const flexOutput = requiredElement<HTMLElement>("flex-output");
const actualOutput = requiredElement<HTMLElement>("actual-output");
const modeOutput = requiredElement<HTMLElement>("mode-output");
const deltaOutput = requiredElement<HTMLElement>("delta-output");
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

function renderResult(result: FlexResult, previous?: ScoreRecord): void {
  rankOutput.textContent = result.rank.toUpperCase();
  flexOutput.textContent = formatFull(result.flexCount);
  actualOutput.textContent = `${formatFull(result.actualTokens)} tokens`;
  modeOutput.textContent = `${result.multiplier}× ${result.modeLabel.toUpperCase()}`;
  emailFlexCount.textContent = formatFull(result.flexCount);

  if (!previous) {
    deltaOutput.textContent = "FIRST RECORDED FLEX";
  } else {
    const delta = result.flexCount - previous.flexCount;
    const direction = delta >= 0 ? "+" : "−";
    deltaOutput.textContent = `${direction}${formatCompact(Math.abs(delta))} VS LAST FLEX`;
  }

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

  formatInput();
  renderResult(currentResult, previous);
  renderScoreboard(currentBoard(actualTokens, previous?.actualTokens ?? null));
  resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
