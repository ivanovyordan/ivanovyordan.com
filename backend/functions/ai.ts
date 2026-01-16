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
 * Extract query from request body
 */
async function extractQuery(request: Request): Promise<string> {
  const { query } = (await request.json()) as { query: string };
  return query;
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
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Validate request method
  const methodCheck = validateRequest(request);
  if (methodCheck instanceof Response) {
    return new Response(methodCheck.body, {
      status: methodCheck.status,
      headers: corsHeaders,
    });
  }

  try {
    // Extract and validate query
    const query = await extractQuery(request);
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get profile information
    const profile = getProfile(env);

    // Generate embedding
    const embedding = await generateEmbedding(
      query,
      env.GEMINI_EMBEDDING_MODEL,
      env.GEMINI_API_KEY
    );

    // Query Pinecone for knowledge (non-blocking)
    let knowledgeContent = "";
    try {
      const queryData = await queryPinecone(
        embedding,
        env.PINECONE_BASE_URL,
        env.PINECONE_API_KEY
      );
      const extractedKnowledge = extractKnowledgeFromMatches(queryData);
      knowledgeContent = getKnowledgeContent(extractedKnowledge);
    } catch (err) {
      console.error("Error querying Pinecone:", err);
      // Continue without knowledge content - don't block the response
      knowledgeContent = getKnowledgeContent("");
    }

    // Prepare prompts
    const basePrompt = prepareBasePrompt(profile);
    const systemPrompt = prepareSystemPrompt(basePrompt, knowledgeContent);

    // Generate AI response
    const responseText = await generateAIResponse(
      query,
      systemPrompt,
      env.GEMINI_MODEL,
      env.GEMINI_API_KEY
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
    return handleAIError(error, corsHeaders);
  }
}
