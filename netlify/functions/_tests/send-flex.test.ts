import { beforeEach, describe, expect, it, vi } from "vitest";

const blobs = new Map<string, unknown>();
const store = {
  get: vi.fn(async (key: string) => blobs.get(key) ?? null),
  setJSON: vi.fn(async (key: string, value: unknown) => {
    blobs.set(key, value);
  }),
};

vi.mock("@netlify/blobs", () => ({
  getStore: () => store,
}));

import sendFlex from "../send-flex";

const validPayload = {
  recipientAlias: "friendly-rival",
  displayName: "Bretton",
  actualTokens: 1_250_000,
  mode: "tokenmax",
};

function request(payload: Record<string, unknown>, options: { key?: string; idempotency?: string } = {}) {
  return new Request("http://localhost:8888/.netlify/functions/send-flex", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:8888",
      Authorization: `Bearer ${options.key ?? "a".repeat(32)}`,
      "Idempotency-Key": options.idempotency ?? "test-key-123",
    },
    body: JSON.stringify(payload),
  });
}

beforeEach(() => {
  blobs.clear();
  store.get.mockClear();
  store.setJSON.mockClear();
  vi.restoreAllMocks();
  process.env.TOKEN_FLEXER_SEND_KEY = "a".repeat(32);
  process.env.TOKEN_FLEXER_SIGNING_SECRET = "s".repeat(48);
  process.env.TOKEN_FLEXER_RECIPIENTS = JSON.stringify([
    {
      alias: "friendly-rival",
      email: "friend@example.com",
      displayName: "Friendly Rival",
      consent: true,
      sendWindowUtc: [14, 18],
    },
  ]);
  process.env.APP_ORIGIN = "http://localhost:8888";
  process.env.TOKEN_FLEXER_DEMO = "true";
  process.env.EMAIL_API_KEY = "test-provider-key";
  process.env.EMAIL_FROM = "Token Flexer <flex@example.com>";
});

describe("send-flex denial paths", () => {
  it("rejects a missing owner key before any provider call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await sendFlex(request(validPayload, { key: "wrong-key" }));
    expect(response.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects arbitrary recipient fields", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await sendFlex(request({ ...validPayload, email: "target@example.com" }));
    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects an unknown alias and a suppressed alias", async () => {
    const unknown = await sendFlex(request({ ...validPayload, recipientAlias: "stranger" }));
    expect(unknown.status).toBe(403);

    blobs.set("suppression/friendly-rival", { suppressedAt: new Date().toISOString() });
    const suppressed = await sendFlex(request(validPayload));
    expect(suppressed.status).toBe(403);
  });

  it("stays honest in demo mode and never calls the provider", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await sendFlex(request(validPayload));
    const payload = (await response.json()) as { sent: boolean; demo: boolean };
    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ sent: false, demo: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("approved live delivery", () => {
  it("sends only to the server-resolved address with provider idempotency", async () => {
    process.env.TOKEN_FLEXER_DEMO = "false";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ id: "provider-123" }, { status: 200 }),
    );

    const response = await sendFlex(request(validPayload, { idempotency: "owner-request-123" }));
    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledOnce();

    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = init?.headers as Record<string, string>;
    const providerPayload = JSON.parse(String(init?.body)) as { to: string[] };
    expect(headers["Idempotency-Key"]).toBe("manual/friendly-rival/owner-request-123");
    expect(providerPayload.to).toEqual(["friend@example.com"]);
    expect(store.setJSON).toHaveBeenCalled();
  });
});
