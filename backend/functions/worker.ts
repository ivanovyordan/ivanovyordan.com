import { GoogleGenerativeAI } from "@google/generative-ai";
import PROMPT_TEMPLATE from "../data/prompt.md";

// In-memory rate limit store for local development
// In production, use KV namespace for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface Env {
  GEMINI_API_KEY: string;
  GEMINI_EMBEDDING_MODEL: string;
  GEMINI_MODEL: string;
  PINECONE_API_KEY: string;
  PINECONE_INDEX_NAME: string;
  PINECONE_BASE_URL: string;
  PROFILE_NAME: string;
  PROFILE_ROLE: string;
  PROFILE_STYLE: string;
  MAX_QUESTIONS_PER_IP?: string; // Max questions per IP address (default: 10)
  RATE_LIMIT_WINDOW_HOURS?: string; // Rate limit window in hours (default: 24)
  RATE_LIMIT_KV?: KVNamespace; // Optional KV namespace for rate limiting (production)
}

/**
 * Get client IP address from request headers
 */
function getClientIP(request: Request): string {
  // Try CF-Connecting-IP first (Cloudflare)
  const cfIP = request.headers.get("CF-Connecting-IP");
  if (cfIP) return cfIP;

  // Try X-Forwarded-For
  const xForwardedFor = request.headers.get("X-Forwarded-For");
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return xForwardedFor.split(",")[0].trim();
  }

  // Fallback to X-Real-IP
  const xRealIP = request.headers.get("X-Real-IP");
  if (xRealIP) return xRealIP;

  // Last resort: use a default identifier (not ideal, but better than nothing)
  return "unknown";
}

/**
 * Check rate limit for an IP address
 */
async function checkRateLimit(ip: string, env: Env): Promise<RateLimitResult> {
  const maxQuestions = parseInt(env.MAX_QUESTIONS_PER_IP || "10", 10);
  const windowHours = parseInt(env.RATE_LIMIT_WINDOW_HOURS || "24", 10);
  const resetAt = Date.now() + windowHours * 60 * 60 * 1000;

  // Use KV if available (production), otherwise use in-memory store (local dev)
  if (env.RATE_LIMIT_KV) {
    const key = `rate_limit:${ip}`;
    const stored = (await env.RATE_LIMIT_KV.get(key, "json")) as {
      count: number;
      resetAt: number;
    } | null;

    // If expired or doesn't exist, create new entry
    if (!stored || stored.resetAt < Date.now()) {
      await env.RATE_LIMIT_KV.put(key, JSON.stringify({ count: 1, resetAt }), {
        expirationTtl: windowHours * 3600,
      });
      return { allowed: true, remaining: maxQuestions - 1, resetAt };
    }

    // Check if limit exceeded
    if (stored.count >= maxQuestions) {
      return { allowed: false, remaining: 0, resetAt: stored.resetAt };
    }

    // Increment count
    const newCount = stored.count + 1;
    await env.RATE_LIMIT_KV.put(
      key,
      JSON.stringify({ count: newCount, resetAt: stored.resetAt }),
      { expirationTtl: Math.ceil((stored.resetAt - Date.now()) / 1000) }
    );

    return {
      allowed: true,
      remaining: maxQuestions - newCount,
      resetAt: stored.resetAt,
    };
  } else {
    // In-memory store for local development
    const stored = rateLimitStore.get(ip);

    // Clean up expired entries periodically
    if (stored && stored.resetAt < Date.now()) {
      rateLimitStore.delete(ip);
    }

    // If expired or doesn't exist, create new entry
    if (!stored || stored.resetAt < Date.now()) {
      rateLimitStore.set(ip, { count: 1, resetAt });
      return { allowed: true, remaining: maxQuestions - 1, resetAt };
    }

    // Check if limit exceeded
    if (stored.count >= maxQuestions) {
      return { allowed: false, remaining: 0, resetAt: stored.resetAt };
    }

    // Increment count
    stored.count++;
    return {
      allowed: true,
      remaining: maxQuestions - stored.count,
      resetAt: stored.resetAt,
    };
  }
}

/**
 * Handle newsletter subscription requests by proxying to Listmonk
 */
async function handleNewsletterRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);

  // Get Listmonk base URL from request or use default
  // The frontend will pass the Listmonk URL in the request body
  if (request.method === "GET" && url.pathname === "/api/newsletter/nonce") {
    // Fetch nonce from Listmonk
    const listmonkUrl = url.searchParams.get("baseUrl");
    if (!listmonkUrl) {
      return new Response(
        JSON.stringify({ error: "baseUrl parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      const response = await fetch(`${listmonkUrl}/subscription/form`, {
        method: "GET",
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch nonce from Listmonk" }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const html = await response.text();
      // Extract nonce from the HTML form
      const nonceMatch =
        html.match(/name="nonce"\s+value="([^"]+)"/) ||
        html.match(/<input[^>]*name="nonce"[^>]*value="([^"]+)"/i);

      if (nonceMatch && nonceMatch[1]) {
        return new Response(JSON.stringify({ nonce: nonceMatch[1] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ error: "Nonce not found in Listmonk response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error fetching nonce from Listmonk:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch nonce" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/newsletter/subscribe"
  ) {
    try {
      const formData = await request.formData();
      const listmonkUrl = url.searchParams.get("baseUrl");

      if (!listmonkUrl) {
        return new Response(
          JSON.stringify({ error: "baseUrl parameter is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Forward the form data to Listmonk
      const listmonkResponse = await fetch(`${listmonkUrl}/subscription/form`, {
        method: "POST",
        body: formData,
      });

      const responseText = await listmonkResponse.text();

      // Check if subscription was successful
      const isSuccess =
        listmonkResponse.ok &&
        (responseText.includes("success") ||
          responseText.includes("subscribed") ||
          listmonkResponse.status === 200);

      return new Response(
        JSON.stringify({
          success: isSuccess,
          message: isSuccess
            ? "Successfully subscribed! Please check your email to confirm."
            : "Subscription failed. Please try again.",
        }),
        {
          status: isSuccess ? 200 : listmonkResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error proxying newsletter subscription:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "An error occurred. Please try again later.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Handle newsletter subscription proxy
    if (
      url.pathname === "/api/newsletter/subscribe" ||
      url.pathname === "/api/newsletter/nonce"
    ) {
      return handleNewsletterRequest(request, env, corsHeaders);
    }

    // Handle AI assistant requests (existing functionality)
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      // Check rate limit before processing
      const clientIP = getClientIP(request);
      const rateLimit = await checkRateLimit(clientIP, env);

      if (!rateLimit.allowed) {
        const resetDate = new Date(rateLimit.resetAt).toISOString();
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            message: `You have reached the maximum number of questions. Please try again after ${resetDate}.`,
            resetAt: resetDate,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { query } = (await request.json()) as { query: string };

      if (!query) {
        return new Response(JSON.stringify({ error: "Query is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const profile = {
        name: env.PROFILE_NAME,
        role: env.PROFILE_ROLE,
        style: env.PROFILE_STYLE,
      };

      const embeddingResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_EMBEDDING_MODEL}:embedContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            content: {
              parts: [{ text: query }],
            },
          }),
        }
      );

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text();
        throw new Error(
          `Embedding API error: ${embeddingResponse.statusText} - ${errorText}`
        );
      }

      const embeddingData = (await embeddingResponse.json()) as {
        embedding?: { values?: number[] };
      };

      const queryEmbedding = embeddingData.embedding?.values || [];

      if (!queryEmbedding || queryEmbedding.length === 0) {
        const errorDetails = JSON.stringify(embeddingData, null, 2);
        console.error("Embedding response structure:", errorDetails);
        throw new Error(
          `Failed to generate embedding vector. Response: ${errorDetails}`
        );
      }

      // Start Pinecone query with timeout to prevent blocking
      // Reduced topK from 5 to 3 for faster queries
      const pineconePromise = Promise.race([
        fetch(`${env.PINECONE_BASE_URL}/query`, {
          method: "POST",
          headers: {
            "Api-Key": env.PINECONE_API_KEY,
            "Content-Type": "application/json",
            "X-Pinecone-Api-Version": "2025-10",
          },
          body: JSON.stringify({
            vector: queryEmbedding,
            topK: 3,
            includeMetadata: true,
          }),
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("Pinecone timeout")), 2000)
        ),
      ]).catch(() => null);

      // Prepare base prompt while Pinecone query runs (parallelization)
      const basePrompt = PROMPT_TEMPLATE.replace(
        /\{\{PROFILE_NAME\}\}/g,
        profile.name
      )
        .replace(/\{\{PROFILE_ROLE\}\}/g, profile.role)
        .replace(/\{\{PROFILE_STYLE\}\}/g, profile.style)
        .replace(/\{\{DATE\}\}/g, new Date().toLocaleDateString());

      // Wait for Pinecone with timeout, but don't block if it fails
      let knowledgeContent = "";
      try {
        const queryResponse = await pineconePromise;
        if (queryResponse && queryResponse.ok) {
          const queryData = (await queryResponse.json()) as {
            matches?: Array<{
              id: string;
              score?: number;
              metadata?: {
                text?: string;
                content?: string;
                [key: string]: unknown;
              };
            }>;
          };

          if (queryData.matches && queryData.matches.length > 0) {
            knowledgeContent = queryData.matches
              .map((match) => {
                const text =
                  match.metadata?.text || match.metadata?.content || match.id;
                return text;
              })
              .filter((text: string | undefined): text is string =>
                Boolean(text)
              )
              .join("\n\n");
          }
        }
      } catch (err) {
        console.error("Error querying Pinecone:", err);
        // Continue without knowledge content - don't block the response
      }

      // If no knowledge found, provide explicit instruction to not use general knowledge
      if (!knowledgeContent || knowledgeContent.trim() === "") {
        knowledgeContent =
          "IMPORTANT: No relevant knowledge found in the knowledge base. You must inform the user that you don't have this information and direct them to book a strategic session. Do NOT use any general knowledge or training data to answer.";
      }

      const SYSTEM_PROMPT = basePrompt.replace(
        /\{\{KNOWLEDGE\}\}/g,
        knowledgeContent
      );

      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.5,
        },
      });

      // Generate response (non-streaming for reliability)
      const result = await model.generateContent(query);
      const responseText = result.response.text();

      return new Response(
        JSON.stringify({
          text: responseText,
          remaining: rateLimit.remaining,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      console.error("Error generating response:", error);

      // Handle Gemini API quota/rate limit errors
      if (error?.status === 429) {
        const isQuotaError = error?.errorDetails?.some(
          (detail: any) =>
            detail["@type"] === "type.googleapis.com/google.rpc.QuotaFailure"
        );

        if (isQuotaError) {
          return new Response(
            JSON.stringify({
              error: "API quota exceeded",
              message:
                "The AI service has reached its daily limit. Please try again tomorrow or contact support.",
            }),
            {
              status: 503,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Regular rate limit (not quota)
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            message: "Too many requests. Please wait a moment and try again.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Generic error
      return new Response(
        JSON.stringify({
          error: "Failed to generate response",
          message:
            "An error occurred while processing your request. Please try again later.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  },
};
