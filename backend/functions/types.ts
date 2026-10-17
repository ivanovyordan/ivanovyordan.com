export interface Env {
  GEMINI_API_KEY: string;
  GEMINI_EMBEDDING_MODEL: string;
  GEMINI_MODEL: string;
  PINECONE_API_KEY: string;
  PINECONE_BASE_URL: string;
  PROFILE_NAME: string;
  PROFILE_ROLE: string;
  PROFILE_STYLE: string;
  /** The discovery-call booking page the twin points people to. */
  BOOKING_URL: string;
  /** Question logging, and the per-IP MCP rate limit count. */
  DB: D1Database;
}
