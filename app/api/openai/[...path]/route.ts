import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import {
  ModelNotAllowedError,
  proxyToOpenAI,
  resolveUpstreamPath,
} from "@/lib/proxy";

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const auth = authenticate(req);
  if (!auth.ok) {
    return NextResponse.json(
      {
        error: {
          message: auth.message,
          type: "invalid_request_error",
          code: "authentication_error",
        },
      },
      { status: auth.status },
    );
  }

  try {
    const upstreamPath = resolveUpstreamPath(params.path);
    return await proxyToOpenAI(req, upstreamPath, auth.authorization);
  } catch (e) {
    if (e instanceof ModelNotAllowedError) {
      return NextResponse.json(
        {
          error: {
            message: e.message,
            type: "invalid_request_error",
            code: "model_not_allowed",
          },
        },
        { status: 400 },
      );
    }

    console.error("[Proxy Error]", e);
    return NextResponse.json(
      {
        error: {
          message: "Internal proxy error",
          type: "server_error",
        },
      },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
