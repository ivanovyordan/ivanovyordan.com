import { GoogleGenerativeAI } from "@google/generative-ai";
import PROMPT_TEMPLATE from "../data/prompt.md";
import type { Env } from "./types";

interface Profile {
  name: string;
  role: string;
  style: string;
}

interface PineconeMatch {
  id: string;
  score?: number;
  metadata?: {
    text?: string;
    content?: string;
    [key: string]: unknown;
  };
}

interface PineconeQueryData {
  matches?: PineconeMatch[];
}

interface ArticleInfo {
  url?: string;
  section?: string;
}

interface QuestionData {
  query: string;
  knowledgeFound: boolean;
  articleUrl?: string;
  articleSection?: string;
  responseText: string;
  clientIp?: string;
  countryCode?: string;
}

/**
 * Validate the request method and extract the query
 */
function validateRequest(request: Request): { query: string } | Response {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  return { query: "" }; // Placeholder, will be filled by caller
}

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
 * Get profile information from environment variables
 */
function getProfile(env: Env): Profile {
  return {
    name: env.PROFILE_NAME,
    role: env.PROFILE_ROLE,
    style: env.PROFILE_STYLE,
  };
}

/**
 * Generate embedding vector for the query using Gemini
 */
async function generateEmbedding(
  query: string,
  embeddingModel: string,
  apiKey: string
): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${embeddingModel}:embedContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        content: {
          parts: [{ text: query }],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Embedding API error: ${response.statusText} - ${errorText}`
    );
  }

  const data = (await response.json()) as {
    embedding?: { values?: number[] };
  };

  const embedding = data.embedding?.values || [];

  if (!embedding || embedding.length === 0) {
    const errorDetails = JSON.stringify(data, null, 2);
    console.error("Embedding response structure:", errorDetails);
    throw new Error(
      `Failed to generate embedding vector. Response: ${errorDetails}`
    );
  }

  return embedding;
}

/**
 * Query Pinecone for relevant knowledge with timeout
 */
async function queryPinecone(
  embedding: number[],
  baseUrl: string,
  apiKey: string
): Promise<PineconeQueryData | null> {
  const pineconePromise = Promise.race([
    fetch(`${baseUrl}/query`, {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
        "X-Pinecone-Api-Version": "2025-10",
      },
      body: JSON.stringify({
        vector: embedding,
        topK: 3,
        includeMetadata: true,
      }),
    }),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Pinecone timeout")), 2000)
    ),
  ]).catch(() => null);

  const response = await pineconePromise;
  if (!response || !response.ok) {
    return null;
  }

  return (await response.json()) as PineconeQueryData;
}

/**
 * Extract article information from Pinecone match metadata
 */
function extractArticleInfo(match: PineconeMatch): ArticleInfo {
  const metadata = match.metadata || {};
  return {
    url: metadata.url as string | undefined,
    section: metadata.section as string | undefined,
  };
}

/**
 * Extract article information from the first Pinecone match
 */
function extractArticleInfoFromMatches(
  queryData: PineconeQueryData | null
): ArticleInfo {
  if (!queryData?.matches || queryData.matches.length === 0) {
    return {};
  }

  // Get the first (most relevant) match
  return extractArticleInfo(queryData.matches[0]);
}

/**
 * Extract knowledge content from Pinecone matches
 */
function extractKnowledgeFromMatches(
  queryData: PineconeQueryData | null
): string {
  if (!queryData?.matches || queryData.matches.length === 0) {
    return "";
  }

  return queryData.matches
    .map((match) => {
      return match.metadata?.text || match.metadata?.content || match.id;
    })
    .filter((text: string | undefined): text is string => Boolean(text))
    .join("\n\n");
}

/**
 * Prepare base prompt with profile information
 */
function prepareBasePrompt(profile: Profile): string {
  return PROMPT_TEMPLATE.replace(/\{\{PROFILE_NAME\}\}/g, profile.name)
    .replace(/\{\{PROFILE_ROLE\}\}/g, profile.role)
    .replace(/\{\{PROFILE_STYLE\}\}/g, profile.style)
    .replace(/\{\{DATE\}\}/g, new Date().toLocaleDateString());
}

/**
 * Get knowledge content, with fallback if none found
 */
function getKnowledgeContent(knowledge: string): string {
  if (!knowledge || knowledge.trim() === "") {
    return "IMPORTANT: No relevant knowledge found in the knowledge base. You must inform the user that you don't have this information and direct them to book a strategic session. Do NOT use any general knowledge or training data to answer.";
  }
  return knowledge;
}

/**
 * Prepare system prompt with knowledge content
 */
function prepareSystemPrompt(
  basePrompt: string,
  knowledgeContent: string
): string {
  return basePrompt.replace(/\{\{KNOWLEDGE\}\}/g, knowledgeContent);
}

/**
 * Generate AI response using Gemini
 */
async function generateAIResponse(
  query: string,
  systemPrompt: string,
  modelName: string,
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.5,
    },
  });

  const result = await model.generateContent(query);
  return result.response.text();
}

/**
 * Get client IP address from request headers
 */
function getClientIP(request: Request): string | undefined {
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

  return undefined;
}

/**
 * Get country code from Cloudflare request headers
 */
function getCountryCode(request: Request): string | undefined {
  // Cloudflare provides country code in CF-IPCountry header
  return request.headers.get("CF-IPCountry") || undefined;
}

/**
 * Save question to D1 database (non-blocking)
 */
async function saveQuestionToDatabase(
  db: D1Database | undefined,
  data: QuestionData
): Promise<void> {
  if (!db) {
    return;
  }

  await db
    .prepare(
      `INSERT INTO questions (
        query,
        knowledge_found,
        article_url,
        article_section,
        response_text,
        client_ip,
        country_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      data.query,
      data.knowledgeFound ? 1 : 0,
      data.articleUrl || null,
      data.articleSection || null,
      data.responseText,
      data.clientIp || null,
      data.countryCode || null
    )
    .run();
}

/**
 * Handle AI-specific errors
 */
function handleAIError(
  error: any,
  corsHeaders: Record<string, string>
): Response {
  console.error("Error generating response:", error);

  // Handle Gemini API quota errors
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

/**
 * Handle AI assistant requests using Gemini
 */
export async function handleAIRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  ctx: ExecutionContext
): Promise<Response> {
  const methodCheck = validateRequest(request);
  if (methodCheck instanceof Response) {
    return new Response(methodCheck.body, {
      status: methodCheck.status,
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

    const profile = getProfile(env);

    const embedding = await generateEmbedding(
      query,
      env.GEMINI_EMBEDDING_MODEL,
      env.GEMINI_API_KEY
    );

    let knowledgeContent = "";
    let queryData: PineconeQueryData | null = null;
    try {
      queryData = await queryPinecone(
        embedding,
        env.PINECONE_BASE_URL,
        env.PINECONE_API_KEY
      );
      const extractedKnowledge = extractKnowledgeFromMatches(queryData);
      knowledgeContent = getKnowledgeContent(extractedKnowledge);
    } catch (err) {
      console.error("Error querying Pinecone:", err);
      knowledgeContent = getKnowledgeContent("");
    }

    const basePrompt = prepareBasePrompt(profile);
    const systemPrompt = prepareSystemPrompt(basePrompt, knowledgeContent);

    const responseText = await generateAIResponse(
      query,
      systemPrompt,
      env.GEMINI_MODEL,
      env.GEMINI_API_KEY
    );

    // Save question to database (background, non-blocking)
    const articleInfo = extractArticleInfoFromMatches(queryData);
    const knowledgeFound = Boolean(
      queryData?.matches && queryData.matches.length > 0
    );

    ctx.waitUntil(
      saveQuestionToDatabase(env.DB, {
        query,
        knowledgeFound,
        articleUrl: articleInfo.url,
        articleSection: articleInfo.section,
        responseText,
        clientIp: getClientIP(request),
        countryCode: getCountryCode(request),
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
