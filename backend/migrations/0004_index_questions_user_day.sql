-- Supports the per-user daily usage count, which runs on every MCP tool call.
CREATE INDEX IF NOT EXISTS idx_questions_user_created
  ON questions(user_email, created_at);
