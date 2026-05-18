-- Create standup_log table for Option A
CREATE TABLE standup_log (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  done_summary TEXT,
  in_progress_summary TEXT,
  blocked_summary TEXT,
  overdue_count INTEGER DEFAULT 0,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
