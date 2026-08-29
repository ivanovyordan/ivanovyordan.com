-- Allowlist for the MCP server. Emails are managed by hand: insert to grant
-- access, set active = 0 to revoke. Store every address trimmed and lowercased,
-- because lookups compare exactly.
CREATE TABLE IF NOT EXISTS mcp_allowed_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mcp_allowed_users_email ON mcp_allowed_users(email);
