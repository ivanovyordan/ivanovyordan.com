-- Supports the per-IP daily cap on the public MCP endpoint, which runs on
-- every tool call. Replaces the per-email index from 0004, since the endpoint
-- no longer has an identity to meter against.
CREATE INDEX IF NOT EXISTS idx_questions_ip_created
  ON questions(client_ip, created_at);

DROP INDEX IF EXISTS idx_questions_user_created;

-- mcp_allowed_users is no longer consulted; the endpoint is public.
DROP TABLE IF EXISTS mcp_allowed_users;
