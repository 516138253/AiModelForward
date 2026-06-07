import { NextResponse } from "next/server";
import { getServerConfig } from "@/lib/config";
import { GPT55_MODELS } from "@/lib/constants";

export async function GET() {
  const config = getServerConfig();

  return NextResponse.json({
    name: "gpt55-proxy",
    version: "1.0.0",
    status: "ok",
    defaultModel: config.defaultModel,
    supportedModels: GPT55_MODELS,
    allowedModels:
      config.allowedModels.length > 0 ? config.allowedModels : GPT55_MODELS,
    endpoints: {
      chatCompletions: "/v1/chat/completions",
      responses: "/v1/responses",
      models: "/v1/models",
      legacy: "/api/openai/v1/*",
    },
    docs: "https://developers.openai.com/api/docs/models/gpt-5.5",
  });
}
