import { NextRequest } from "next/server";
import {
  getServerConfig,
  parseAuthorization,
  verifyAccessCode,
} from "@/lib/config";

export type AuthResult =
  | { ok: true; authorization: string }
  | { ok: false; status: number; message: string };

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? req.ip ?? "unknown";
}

export function authenticate(req: NextRequest): AuthResult {
  const config = getServerConfig();
  const authHeader = req.headers.get("Authorization") ?? "";
  const { apiKey, accessCode } = parseAuthorization(authHeader);

  console.log("[Auth] IP:", getClientIp(req));
  console.log("[Auth] Time:", new Date().toISOString());

  if (config.requireAccessCode && accessCode) {
    if (!verifyAccessCode(accessCode)) {
      return {
        ok: false,
        status: 401,
        message: "Invalid access code",
      };
    }
  } else if (config.requireAccessCode && !apiKey) {
    return {
      ok: false,
      status: 401,
      message: "Access code required. Use Authorization: Bearer ak-<code>",
    };
  }

  const finalKey = apiKey || config.apiKey;
  if (!finalKey) {
    return {
      ok: false,
      status: 401,
      message: "No API key configured. Set OPENAI_API_KEY or pass Authorization header.",
    };
  }

  if (apiKey) {
    console.log("[Auth] Using client API key");
  } else {
    console.log("[Auth] Using server API key");
  }

  return {
    ok: true,
    authorization: `Bearer ${finalKey}`,
  };
}
