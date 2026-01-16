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
  LISTMONK_USERNAME?: string; // Listmonk username for API authentication
  LISTMONK_API_KEY?: string; // Listmonk API key for transactional emails
}
