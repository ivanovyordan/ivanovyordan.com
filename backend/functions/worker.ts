import type { Env } from "./types";
import { handleAIRequest } from "./ai";
import { MCP_ROUTE, handleMcpRequest } from "./mcp";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // The MCP handler sets its own CORS headers, including the MCP-specific
    // ones, so it is routed before the website's simpler policy applies.
    if (url.pathname === MCP_ROUTE) {
      return handleMcpRequest(request, env, ctx);
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "POST" && url.pathname === "/ai") {
      return handleAIRequest(request, env, corsHeaders, ctx);
    }

    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders,
    });
  },
};
