export type AiGatewayEnv = {
  url: string;
  apiKey: string;
};

export function getAiGatewayEnv():
  | { ok: true; env: AiGatewayEnv }
  | { ok: false; error: string } {
  const url = process.env.AION_AI_GATEWAY_URL?.trim();
  const apiKey = process.env.AION_AI_GATEWAY_API_KEY?.trim();

  if (!url || !apiKey) {
    return {
      ok: false,
      error:
        "AION AI Gateway is not configured. Set AION_AI_GATEWAY_URL and AION_AI_GATEWAY_API_KEY.",
    };
  }

  return { ok: true, env: { url, apiKey } };
}

export function requireAiGatewayEnv(): AiGatewayEnv {
  const result = getAiGatewayEnv();
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.env;
}
