import { getAiGatewayEnv } from "@/lib/ai/env";

export type AiGatewayRequest = {
  model?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
};

export type AiGatewayResponse = {
  content: string;
};

export type CompleteOptions = {
  gatewayUrl?: string;
  apiKey?: string;
  fetch?: typeof fetch;
};

type GatewayPayload = {
  model?: string;
  messages: AiGatewayRequest["messages"];
};

type GatewayBody = {
  content?: string;
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
  message?: string;
};

function resolveGatewayConfig(options?: CompleteOptions): { url: string; apiKey: string } {
  const configured = getAiGatewayEnv();
  const url = options?.gatewayUrl?.trim() ?? (configured.ok ? configured.env.url : undefined);
  const apiKey = options?.apiKey?.trim() ?? (configured.ok ? configured.env.apiKey : undefined);

  if (!url || !apiKey) {
    throw new Error(
      "AION AI Gateway is not configured. Set AION_AI_GATEWAY_URL and AION_AI_GATEWAY_API_KEY.",
    );
  }

  return { url, apiKey };
}

function buildCompletionsUrl(gatewayUrl: string): string {
  const base = gatewayUrl.replace(/\/$/, "");
  if (base.endsWith("/v1/completions") || base.endsWith("/completions")) {
    return base;
  }
  if (base.endsWith("/v1")) {
    return `${base}/completions`;
  }
  return `${base}/v1/completions`;
}

function parseGatewayBody(body: GatewayBody): string {
  if (typeof body.content === "string" && body.content.length > 0) {
    return body.content;
  }

  const openAiContent = body.choices?.[0]?.message?.content;
  if (typeof openAiContent === "string" && openAiContent.length > 0) {
    return openAiContent;
  }

  throw new Error("AION AI Gateway returned an empty completion.");
}

function gatewayErrorMessage(status: number, body: GatewayBody): string {
  const detail = body.error?.message ?? body.message;
  if (detail) {
    return `AION AI Gateway request failed (${status}): ${detail}`;
  }
  return `AION AI Gateway request failed (${status}).`;
}

/**
 * Client for AION AI Gateway completions.
 */
export async function complete(
  request: AiGatewayRequest,
  options?: CompleteOptions,
): Promise<AiGatewayResponse> {
  const { url, apiKey } = resolveGatewayConfig(options);
  const fetchFn = options?.fetch ?? fetch;

  const payload: GatewayPayload = { messages: request.messages };
  if (request.model) {
    payload.model = request.model;
  }

  const response = await fetchFn(buildCompletionsUrl(url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as GatewayBody;

  if (!response.ok) {
    throw new Error(gatewayErrorMessage(response.status, body));
  }

  return { content: parseGatewayBody(body) };
}
