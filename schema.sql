CREATE TABLE IF NOT EXISTS predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport TEXT NOT NULL,
  title TEXT NOT NULL,
  pick TEXT NOT NULL,
  odds TEXT,
  confidence TEXT,
  is_free INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vip_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payer_name TEXT NOT NULL,
  plan TEXT NOT NULL,
  reference TEXT,
  screenshot_path TEXT,
  status TEXT DEFAULT 'pending',
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);