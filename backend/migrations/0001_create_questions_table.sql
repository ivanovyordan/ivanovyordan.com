CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  knowledge_found INTEGER DEFAULT 0,
  article_url TEXT,
  article_section TEXT,
  response_text TEXT,
  client_ip TEXT,
  country_code TEXT
);

CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_knowledge_found ON questions(knowledge_found);
CREATE INDEX IF NOT EXISTS idx_questions_article_url ON questions(article_url);
