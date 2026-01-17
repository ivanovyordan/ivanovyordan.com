import type { Env } from "./types";
import { handleSubscriptionRequest } from "./email_list";
import { handleAIRequest } from "./ai";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "POST" && url.pathname === "/email-list") {
      return handleSubscriptionRequest(request, env, corsHeaders);
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
