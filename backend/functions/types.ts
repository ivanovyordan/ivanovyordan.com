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
  DB?: D1Database; // D1 database for storing AI questions
}
