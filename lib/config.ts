import md5 from "spark-md5";
import { ACCESS_CODE_PREFIX } from "./constants";

function hashAccessCode(code: string): string {
  return md5.hash(code.trim());
}

function getAccessCodes(): Set<string> {
  const raw = process.env.ACCESS_CODE ?? process.env.CODE ?? "";
  if (!raw.trim()) return new Set();

  return new Set(
    raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map(hashAccessCode),
  );
}

export function getServerConfig() {
  const allowedRaw = process.env.ALLOWED_MODELS ?? "";
  const allowedModels = allowedRaw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  return {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    accessCodes: getAccessCodes(),
    requireAccessCode: getAccessCodes().size > 0,
    baseUrl: process.env.BASE_URL ?? "api.openai.com",
    protocol: process.env.PROTOCOL ?? "https",
    orgId: process.env.OPENAI_ORG_ID ?? "",
    defaultModel: process.env.DEFAULT_MODEL ?? "gpt-5.5",
    allowedModels,
  };
}

export function parseAuthorization(header: string | null) {
  const token = (header ?? "").trim().replace(/^Bearer\s+/i, "").trim();

  if (token.startsWith(ACCESS_CODE_PREFIX)) {
    return {
      apiKey: "",
      accessCode: token.slice(ACCESS_CODE_PREFIX.length),
    };
  }

  return { apiKey: token, accessCode: "" };
}

export function verifyAccessCode(accessCode: string): boolean {
  const codes = getAccessCodes();
  if (codes.size === 0) return true;
  return codes.has(hashAccessCode(accessCode));
}
