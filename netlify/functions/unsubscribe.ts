import { deliveryStore, verifyUnsubscribeToken } from "./_lib/delivery";

function page(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>${title}</title><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#090a09;color:#fbfbf6;font-family:Arial,sans-serif"><main style="max-width:620px;padding:40px"><p style="color:#ff5c48;font-weight:800;letter-spacing:2px">THE TOKEN FLEXER</p><h1 style="color:#d7ff36;font-size:48px;line-height:.95">${title}</h1><p style="font-size:18px;line-height:1.6">${body}</p><a href="/" style="color:#d7ff36">Return to the Flex Lab</a></main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export default async (request: Request) => {
  if (request.method !== "GET") return page("Nope.", "That action is not available.", 405);
  const token = new URL(request.url).searchParams.get("token") ?? "";
  let alias: string | null = null;
  try {
    alias = verifyUnsubscribeToken(token);
  } catch {
    return page("Link unavailable.", "This retirement link is invalid or expired.", 400);
  }
  if (!alias) return page("Link unavailable.", "This retirement link is invalid or expired.", 400);

  await deliveryStore().setJSON(`suppression/${alias}`, { suppressedAt: new Date().toISOString(), reason: "recipient-unsubscribe" });
  return page("You have left the arena.", "Daily token smoke is now permanently suppressed for this recipient. No account required, no guilt trip attached.");
};
