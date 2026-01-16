import type { Env } from "./types";
import { handleNewsletterRequest } from "./email_list";
import { handleAIRequest } from "./ai";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight requests (browsers send OPTIONS before cross-origin requests)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Handle newsletter subscription proxy
    if (url.pathname === "/email-list") {
      return handleNewsletterRequest(request, env, corsHeaders);
    }

    // Handle AI assistant requests
    if (request.method === "POST" && url.pathname === "/ai") {
      return handleAIRequest(request, env, corsHeaders);
    }

    // Return 404 for unknown routes
    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders,
    });
  },
};
