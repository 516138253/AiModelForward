import { NextRequest } from "next/server";
import { getServerConfig } from "@/lib/config";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function buildUpstreamUrl(path: string, search: string): string {
  const config = getServerConfig();
  let base = config.baseUrl.trim();
  if (!base.startsWith("http")) {
    base = `${config.protocol}://${base}`;
  }
  base = base.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}${search}`;
}

function filterRequestHeaders(
  req: NextRequest,
  authorization: string,
): Headers {
  const config = getServerConfig();
  const headers = new Headers();

  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === "authorization") return;
    headers.set(key, value);
  });

  headers.set("Authorization", authorization);

  if (config.orgId) {
    headers.set("OpenAI-Organization", config.orgId);
  }

  if (!headers.has("Content-Type") && req.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

function filterResponseHeaders(upstream: Headers): Headers {
  const headers = new Headers();
  upstream.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    headers.set(key, value);
  });
  headers.set("Cache-Control", "no-cache");
  return headers;
}

async function maybePatchBody(
  req: NextRequest,
  contentType: string | null,
): Promise<BodyInit | null | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;

  const config = getServerConfig();
  const isJson =
    contentType?.includes("application/json") ||
    contentType?.includes("text/json");

  if (!isJson) {
    return req.body;
  }

  const text = await req.text();
  if (!text) return text;

  try {
    const body = JSON.parse(text) as Record<string, unknown>;

    if (!body.model && config.defaultModel) {
      body.model = config.defaultModel;
    }

    if (
      config.allowedModels.length > 0 &&
      typeof body.model === "string" &&
      !config.allowedModels.includes(body.model)
    ) {
      throw new ModelNotAllowedError(body.model, config.allowedModels);
    }

    return JSON.stringify(body);
  } catch (e) {
    if (e instanceof ModelNotAllowedError) throw e;
    return text;
  }
}

export class ModelNotAllowedError extends Error {
  constructor(
    public model: string,
    public allowed: string[],
  ) {
    super(`Model "${model}" is not allowed. Allowed: ${allowed.join(", ")}`);
    this.name = "ModelNotAllowedError";
  }
}

export async function proxyToOpenAI(
  req: NextRequest,
  upstreamPath: string,
  authorization: string,
): Promise<Response> {
  const url = buildUpstreamUrl(upstreamPath, req.nextUrl.search);
  const contentType = req.headers.get("Content-Type");
  const body = await maybePatchBody(req, contentType);

  console.log("[Proxy]", req.method, url);

  const upstream = await fetch(url, {
    method: req.method,
    headers: filterRequestHeaders(req, authorization),
    body,
    // @ts-expect-error duplex required for streaming body in Node 18+
    duplex: body ? "half" : undefined,
    cache: "no-store",
  });

  const responseHeaders = filterResponseHeaders(upstream.headers);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export function resolveUpstreamPath(pathSegments: string[]): string {
  return `/v1/${pathSegments.join("/")}`;
}
