import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import PROMPT_TEMPLATE from "../data/prompt.md";
import type { Env } from "./types";

/**
 * Retrieval and generation, with no HTTP types anywhere.
 *
 * Both entry points share this: the website's POST /ai and the MCP
 * `ask_yordan` tool. Keeping it transport-free is what lets a second
 * caller reuse it without duplicating the pipeline.
 */

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
export type AIStage = "embedding" | "vector_store" | "generation";

export class AIStageError extends Error {
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

export interface ArticleInfo {
  url?: string;
  section?: string;
}

/** Where the question came from, so web and MCP traffic stay distinguishable. */
export type QuestionSource = "web" | "mcp";

export interface QuestionData {
  query: string;
  knowledgeFound: boolean;
  articleUrl?: string;
  articleSection?: string;
  responseText: string;
  clientIp?: string;
  countryCode?: string;
  source: QuestionSource;
  userEmail?: string;
}

/**
 * Length guidance, substituted into the prompt per caller.
 *
 * The website widget is a small card, so answers have to be short. An MCP
 * client is a full chat window where the same 60-80 words read as evasive.
 */
export const RESPONSE_LENGTH = {
  web: "Keep all responses within a 60-80 word limit for maximum impact.",
  mcp:
    "Keep responses under 200 words. Lead with your position in the first " +
    "sentence, then the reasoning behind it. Stay concise - do not pad to " +
    "reach the limit.",
} as const;

export interface PipelineResult {
  responseText: string;
  knowledgeFound: boolean;
  articleInfo: ArticleInfo;
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
function prepareBasePrompt(profile: Profile, lengthGuidance: string): string {
  return PROMPT_TEMPLATE.replace(/\{\{PROFILE_NAME\}\}/g, profile.name)
    .replace(/\{\{PROFILE_ROLE\}\}/g, profile.role)
    .replace(/\{\{PROFILE_STYLE\}\}/g, profile.style)
    .replace(/\{\{LENGTH\}\}/g, lengthGuidance)
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
          // Gemini 3.7 deprecates the sampling params (temperature/top_p/top_k)
          // in favour of thinking level. Answers are grounded in retrieved
          // text, so the cheapest, fastest level is enough.
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
 * Save question to D1 database (non-blocking)
 */
export async function saveQuestionToDatabase(
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
        country_code,
        source,
        user_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      data.query,
      data.knowledgeFound ? 1 : 0,
      data.articleUrl || null,
      data.articleSection || null,
      data.responseText,
      data.clientIp || null,
      data.countryCode || null,
      data.source,
      data.userEmail || null
    )
    .run();
}

/**
 * Embed the query, retrieve grounding knowledge, and generate the answer.
 *
 * Pinecone failures degrade rather than throw: an empty match set routes the
 * prompt down the "no relevant knowledge" path instead of failing the request.
 */
export async function runAIPipeline(
  query: string,
  env: Env,
  lengthGuidance: string = RESPONSE_LENGTH.web
): Promise<PipelineResult> {
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

  const basePrompt = prepareBasePrompt(profile, lengthGuidance);
  const systemPrompt = prepareSystemPrompt(basePrompt, knowledgeContent);

  const responseText = await generateAIResponse(
    ai,
    query,
    systemPrompt,
    env.GEMINI_MODEL
  );

  return {
    responseText,
    knowledgeFound: relevantMatches.length > 0,
    articleInfo: extractArticleInfoFromMatches(relevantMatches),
  };
}
