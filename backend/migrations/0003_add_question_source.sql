-- Distinguish website traffic from MCP traffic. Existing rows predate the MCP
-- server, so defaulting them to 'web' is accurate rather than a guess.
ALTER TABLE questions ADD COLUMN source TEXT NOT NULL DEFAULT 'web';
ALTER TABLE questions ADD COLUMN user_email TEXT;

CREATE INDEX IF NOT EXISTS idx_questions_source ON questions(source);
