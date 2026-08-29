#!/usr/bin/env node
/**
 * Secret scan for the definition of done: "no real email address, key, or
 * provider payload has entered git history."
 *
 * Scans tracked files only — untracked scratch work is the author's business,
 * committed work is everyone's. Self-contained on purpose: no third-party
 * action, no network, nothing to authorize in CI.
 *
 * Run: node scripts/secret-scan.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const SELF = "scripts/secret-scan.mjs";

/** Binary and vendored paths we never read. */
const SKIP_PATH =
  /^(node_modules|dist|coverage|\.netlify)\/|\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|mp4|webm|pdf|zip|lock)$/i;

/** Address domains that are documentation, not a person. */
const SAFE_EMAIL = /@(example\.(com|org|net)|test|localhost|invalid|noreply\.|users\.noreply\.github\.com)/i;

/** Provider key shapes. These have no legitimate reason to sit in a tracked file. */
const KEY_SHAPES = [
  { name: "Resend API key", re: /\bre_[A-Za-z0-9_-]{16,}/g },
  { name: "OpenAI-style key", re: /\bsk-[A-Za-z0-9_-]{20,}/g },
  { name: "SendGrid key", re: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/g },
  { name: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9]{20,}/g },
  { name: "Slack token", re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/g },
  { name: "Private key block", re: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g },
];

/**
 * A secret-looking name assigned a real value. Empty assignments are how
 * .env.example documents the contract, so they pass.
 */
const ASSIGNED_SECRET =
  /\b([A-Z0-9_]*(?:SEND_KEY|SIGNING_SECRET|API_KEY|SECRET|PASSWORD|PASSPHRASE|CREDENTIAL)[A-Z0-9_]*)\s*[:=]\s*["'`]?([^\s"'`,;)}\n#]{12,})/g;

/** References, not values. */
const IS_REFERENCE = (v) =>
  /^(process\.env|import\.meta|Deno\.env|\$\{|<|\.\.\.|null|undefined|true|false|\[\]|\{\})/.test(v) ||
  /^(your-|placeholder|changeme|example|redacted|xxx+|\*+|generate)/i.test(v);

function tracked() {
  return execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
}

const findings = [];
const files = tracked();

// 1. No environment file but the documented example may be tracked.
for (const f of files) {
  const base = f.split("/").pop();
  if (/^\.env/.test(base) && base !== ".env.example") {
    findings.push({ file: f, line: 0, what: "Tracked environment file", detail: base });
  }
}

// 2. Content scan.
for (const f of files) {
  if (f === SELF || SKIP_PATH.test(f)) continue;
  let text;
  try {
    if (statSync(f).size > 2_000_000) continue;
    text = readFileSync(f, "utf8");
  } catch {
    continue; // unreadable or binary — nothing to assert
  }
  if (text.includes("\0")) continue;

  const lines = text.split("\n");
  lines.forEach((line, i) => {
    for (const { name, re } of KEY_SHAPES) {
      re.lastIndex = 0;
      const m = re.exec(line);
      if (m) findings.push({ file: f, line: i + 1, what: name, detail: m[0].slice(0, 12) + "…" });
    }

    ASSIGNED_SECRET.lastIndex = 0;
    let m;
    while ((m = ASSIGNED_SECRET.exec(line))) {
      if (!IS_REFERENCE(m[2])) {
        findings.push({ file: f, line: i + 1, what: `Assigned value for ${m[1]}`, detail: m[2].slice(0, 8) + "…" });
      }
    }

    for (const addr of line.match(/[\w.+-]+@[\w-]+\.[\w.-]+\w/g) || []) {
      if (!SAFE_EMAIL.test(addr)) {
        findings.push({ file: f, line: i + 1, what: "Email address", detail: addr });
      }
    }
  });
}

if (findings.length === 0) {
  console.log(`secret-scan: clean — ${files.length} tracked files checked.`);
  process.exit(0);
}

console.error(`secret-scan: ${findings.length} finding(s).\n`);
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  ${f.what}  →  ${f.detail}`);
}
console.error(
  `\nIf one of these is documentation rather than a real value, use an example.com` +
    ` address or an empty assignment. Never commit the real thing — rotate it if it landed.`,
);
process.exit(1);
