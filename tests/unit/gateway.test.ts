import { afterEach, describe, expect, it, vi } from "vitest";
import { getAiGatewayEnv, requireAiGatewayEnv } from "@/lib/ai/env";
import { complete } from "@/lib/ai/gateway";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("AI gateway env", () => {
  it("returns configured env when vars are set", () => {
    process.env.AION_AI_GATEWAY_URL = "https://gateway.example.com";
    process.env.AION_AI_GATEWAY_API_KEY = "test-key";

    expect(getAiGatewayEnv()).toEqual({
      ok: true,
      env: {
        url: "https://gateway.example.com",
        apiKey: "test-key",
      },
    });
  });

  it("returns an error when gateway env is missing", () => {
    delete process.env.AION_AI_GATEWAY_URL;
    delete process.env.AION_AI_GATEWAY_API_KEY;

    const result = getAiGatewayEnv();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("AION AI Gateway is not configured");
    }
  });

  it("throws from requireAiGatewayEnv when not configured", () => {
    delete process.env.AION_AI_GATEWAY_URL;
    delete process.env.AION_AI_GATEWAY_API_KEY;

    expect(() => requireAiGatewayEnv()).toThrow(/AION AI Gateway is not configured/);
  });
});

describe("AI gateway client", () => {
  it("posts messages to the gateway and returns content", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: "Suggested opening question." }),
    });

    const result = await complete(
      {
        model: "aion-default",
        messages: [{ role: "user", content: "Draft a pre-call question." }],
      },
      {
        gatewayUrl: "https://gateway.example.com",
        apiKey: "test-key",
        fetch: fetchMock as typeof fetch,
      },
    );

    expect(result.content).toBe("Suggested opening question.");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://gateway.example.com/v1/completions");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer test-key",
    });
    expect(JSON.parse(String(init.body))).toEqual({
      model: "aion-default",
      messages: [{ role: "user", content: "Draft a pre-call question." }],
    });
  });

  it("supports OpenAI-compatible gateway responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "Objection reframe suggestion." } }],
      }),
    });

    const result = await complete(
      { messages: [{ role: "user", content: "Handle price objection." }] },
      {
        gatewayUrl: "https://gateway.example.com/v1",
        apiKey: "test-key",
        fetch: fetchMock as typeof fetch,
      },
    );

    expect(result.content).toBe("Objection reframe suggestion.");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://gateway.example.com/v1/completions",
      expect.any(Object),
    );
  });

  it("throws when gateway env is not configured", async () => {
    delete process.env.AION_AI_GATEWAY_URL;
    delete process.env.AION_AI_GATEWAY_API_KEY;

    await expect(
      complete({ messages: [{ role: "user", content: "Hello" }] }),
    ).rejects.toThrow(/AION AI Gateway is not configured/);
  });

  it("throws when the gateway returns an error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: "Invalid API key" } }),
    });

    await expect(
      complete(
        { messages: [{ role: "user", content: "Hello" }] },
        {
          gatewayUrl: "https://gateway.example.com",
          apiKey: "bad-key",
          fetch: fetchMock as typeof fetch,
        },
      ),
    ).rejects.toThrow(/Invalid API key/);
  });
});
