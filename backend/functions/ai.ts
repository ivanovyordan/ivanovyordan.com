import type { Env } from "./types";
import { getClientIP, getCountryCode } from "./http";
import {
  AIStageError,
  runAIPipeline,
  saveQuestionToDatabase,
} from "./pipeline";

/**
 * HTTP shell for the website widget. All retrieval and generation lives in
 * ./pipeline so the MCP tool can reuse it without going through HTTP.
 */

/**
 * Extract query and honeypot from request body
 */
async function extractRequestData(request: Request): Promise<{ query: string; honeypot?: string }> {
  const { query, website } = (await request.json()) as { query: string; website?: string };
  return { query, honeypot: website };
}

/**
 * Check if submission is from a bot (honeypot filled)
 */
function isBot(honeypot: string | undefined): boolean {
  return Boolean(honeypot && honeypot.trim().length > 0);
}

/**
 * Handle AI-specific errors
 */
function handleAIError(
  error: any,
  corsHeaders: Record<string, string>
): Response {
  console.error("Error generating response:", error);

  // Handle Gemini API quota errors. The SDK surfaces these as an ApiError with
  // a numeric status and no structured details, so 429 is the whole signal -
  // it covers both rate limiting and depleted billing credits.
  if (error?.status === 429) {
    return new Response(
      JSON.stringify({
        error: "API quota exceeded",
        message:
          "The AI service has reached its limit. Please try again later or contact support.",
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Generic error. The stage is safe to expose - it names which step failed
  // without echoing provider messages, which can contain request details.
  return new Response(
    JSON.stringify({
      error: "Failed to generate response",
      message:
        "An error occurred while processing your request. Please try again later.",
      stage: error instanceof AIStageError ? error.stage : "unknown",
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * Handle AI assistant requests using Gemini
 */
export async function handleAIRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  ctx: ExecutionContext
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { query, honeypot } = await extractRequestData(request);

    // Reject bot submissions (honeypot filled) - return fake success
    if (isBot(honeypot)) {
      return new Response(
        JSON.stringify({ text: "Thank you for your question. I'll get back to you shortly." }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { responseText, knowledgeFound, articleInfo } = await runAIPipeline(
      query,
      env
    );

    // Save question to database (background, non-blocking)
    ctx.waitUntil(
      saveQuestionToDatabase(env.DB, {
        query,
        knowledgeFound,
        articleUrl: articleInfo.url,
        articleSection: articleInfo.section,
        responseText,
        clientIp: getClientIP(request),
        countryCode: getCountryCode(request),
        source: "web",
      }).catch((err) => {
        console.error("Database save failed:", err);
      })
    );

    return new Response(
      JSON.stringify({
        text: responseText,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in handleAIRequest:", error);
    return handleAIError(error, corsHeaders);
  }
}
