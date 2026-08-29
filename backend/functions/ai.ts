import { GoogleGenAI } from "@google/genai";
import PROMPT_TEMPLATE from "../data/prompt.md";
import type { Env } from "./types";

/**
 * Minimum Pinecone similarity score for a match to count as knowledge.
 *
 * Measured against the live index: questions covered by the corpus score
 * 0.73-0.80, unrelated ones (sourdough, football, car maintenance) score
 * 0.54-0.60. 0.66 sits in the gap. Without a floor, topK always returns
 * three neighbours and the "no relevant knowledge" path never fires.
 */
const MIN_MATCH_SCORE = 0.66;

/** Which step of the pipeline failed, so a 500 says more than "something broke". */
type AIStage = "embedding" | "vector_store" | "generation";

class AIStageError extends Error {
  constructor(readonly stage: AIStage, message: string) {
    super(message);
    this.name = "AIStageError";
  }
}

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
  ai: GoogleGenAI,
  query: string,
  embeddingModel: string
): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: embeddingModel,
    contents: query,
  });

  // Default output dimensionality (3072) matches the Pinecone index and is
  // already normalised, so outputDimensionality is deliberately not set.
  const embedding = response.embeddings?.[0]?.values ?? [];

  if (embedding.length === 0) {
    console.error("Embedding response contained no vector:", embeddingModel);
    throw new AIStageError(
      "embedding",
      `Embedding model "${embeddingModel}" returned no vector`
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
 * Keep only matches similar enough to actually answer the question.
 *
 * topK always returns its quota of nearest neighbours, however far away they
 * are, so relevance has to be decided here rather than by Pinecone.
 */
function getRelevantMatches(
  queryData: PineconeQueryData | null
): PineconeMatch[] {
  return (queryData?.matches ?? []).filter(
    (match) => (match.score ?? 0) >= MIN_MATCH_SCORE
  );
}

/**
 * Extract article information from Pinecone match metadata
 */
function extractArticleInfo(match: PineconeMatch): ArticleInfo {
  const metadata = match.metadata || {};
  return {
    url: metadata.url as string | undefined,
    // The ingestion pipeline writes title/subtitle; there is no "section" key.
    section: (metadata.title ?? metadata.subtitle) as string | undefined,
  };
}

/**
 * Extract article information from the most relevant Pinecone match
 */
function extractArticleInfoFromMatches(matches: PineconeMatch[]): ArticleInfo {
  if (matches.length === 0) {
    return {};
  }

  // Get the first (most relevant) match
  return extractArticleInfo(matches[0]);
}

/**
 * Extract knowledge content from Pinecone matches
 */
function extractKnowledgeFromMatches(matches: PineconeMatch[]): string {
  return matches
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
  ai: GoogleGenAI,
  query: string,
  systemPrompt: string,
  modelName: string
): Promise<string> {
  // Gemini returns 503 "high demand" for transient capacity shortfalls. Without
  // a retry a single spike surfaces to the visitor as a generic failure.
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: query,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.5,
        },
      });

      const text = response.text;
      if (text) {
        return text;
      }
      lastError = new Error("Model returned an empty response");
    } catch (error: any) {
      lastError = error;
      const status = error?.status ?? error?.code;
      // Quota (429) is not transient within a request - fail fast so the
      // caller can surface the dedicated quota message.
      if (status === 429 || (status && status !== 503 && status < 500)) {
        throw error;
      }
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  throw new AIStageError(
    "generation",
    `Model "${modelName}" failed after ${maxAttempts} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
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

    const profile = getProfile(env);
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    const embedding = await generateEmbedding(
      ai,
      query,
      env.GEMINI_EMBEDDING_MODEL
    );

    let relevantMatches: PineconeMatch[] = [];
    try {
      const queryData = await queryPinecone(
        embedding,
        env.PINECONE_BASE_URL,
        env.PINECONE_API_KEY
      );
      relevantMatches = getRelevantMatches(queryData);
    } catch (err) {
      console.error("Error querying Pinecone:", err);
    }

    const knowledgeContent = getKnowledgeContent(
      extractKnowledgeFromMatches(relevantMatches)
    );

    const basePrompt = prepareBasePrompt(profile);
    const systemPrompt = prepareSystemPrompt(basePrompt, knowledgeContent);

    const responseText = await generateAIResponse(
      ai,
      query,
      systemPrompt,
      env.GEMINI_MODEL
    );

    // Save question to database (background, non-blocking)
    const articleInfo = extractArticleInfoFromMatches(relevantMatches);
    const knowledgeFound = relevantMatches.length > 0;

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
