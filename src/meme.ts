import { selectDailyPackage } from "./email-rotation";
import { formatFull, type FlexResult } from "./flex-engine";

const backgrounds = new Map<string, Promise<HTMLImageElement>>();

function loadBackground(path: string): Promise<HTMLImageElement> {
  const existing = backgrounds.get(path);
  if (existing) return existing;

  const backgroundPromise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The meme background could not be loaded."));
    image.src = path;
  });

  backgrounds.set(path, backgroundPromise);
  return backgroundPromise;
}

function fitCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function fillTextTracked(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
): void {
  let cursor = x;
  for (const character of text) {
    context.fillText(character, cursor, y);
    cursor += context.measureText(character).width + tracking;
  }
}

export async function renderMeme(
  canvas: HTMLCanvasElement,
  displayName: string,
  result: FlexResult,
): Promise<Blob> {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is not supported in this browser.");

  const daily = selectDailyPackage(displayName.toLowerCase(), new Date());
  const image = await loadBackground(daily.image.path);
  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  fitCover(context, image, width, height);

  const shade = context.createLinearGradient(width * 0.35, 0, width, 0);
  shade.addColorStop(0, "rgba(7, 8, 7, 0.06)");
  shade.addColorStop(0.42, "rgba(7, 8, 7, 0.78)");
  shade.addColorStop(1, "rgba(7, 8, 7, 0.98)");
  context.fillStyle = shade;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#d7ff36";
  context.fillRect(930, 88, 540, 8);
  context.font = "700 25px Arial, sans-serif";
  fillTextTracked(context, "THE TOKEN FLEXER // OFFICIAL RECEIPT", 930, 140, 2.2);

  context.fillStyle = "#f8f8f4";
  context.font = "900 106px Impact, Arial Black, sans-serif";
  context.fillText("DO YOU EVEN", 925, 275);
  context.fillStyle = "#d7ff36";
  context.fillText("TOKENMAX,", 925, 390);
  context.fillText("BRO?", 925, 505);

  context.fillStyle = "#f8f8f4";
  context.font = "900 72px Arial Black, Arial, sans-serif";
  context.fillText(formatFull(result.flexCount), 925, 625);

  context.fillStyle = "#ff5c48";
  context.font = "700 24px Arial, sans-serif";
  fillTextTracked(context, `SATIRICAL FLEX COUNT // ${result.multiplier}X ${result.modeLabel.toUpperCase()}`, 930, 680, 1);

  context.fillStyle = "rgba(248, 248, 244, 0.78)";
  context.font = "600 23px Arial, sans-serif";
  context.fillText(`${displayName.toUpperCase()} // ${result.rank.toUpperCase()}`, 930, 746);
  context.fillText(`ACTUAL, SELF-REPORTED: ${formatFull(result.actualTokens)} TOKENS`, 930, 786);

  context.fillStyle = "rgba(248, 248, 244, 0.5)";
  context.font = "500 18px Arial, sans-serif";
  context.fillText("PARODY. THE MULTIPLIER IS THE POINT.", 930, 844);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The meme image could not be exported."));
    }, "image/png");
  });
}

export async function downloadMeme(
  canvas: HTMLCanvasElement,
  displayName: string,
  result: FlexResult,
): Promise<void> {
  const blob = await renderMeme(canvas, displayName, result);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `token-flex-${displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "maxxer"}.png`;
  anchor.click();
  URL.revokeObjectURL(url);
}
