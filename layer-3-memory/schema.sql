-- Enterprise Agentic Memory Schema (PostgreSQL/Supabase)
-- Version: 1.0.0
-- Description: Relational state management for autonomous AI agents.

-- 1. Leads & Prospect Data
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    company_name TEXT,
    intent_score INTEGER DEFAULT 0,
    buying_signals JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agent Execution Tracking (The Control Plane)
CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL,
    action_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'running', 'success', 'failed', 'pivoted')),
    payload JSONB,
    result JSONB,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Semantic Memory (Vector Store)
-- Requires pgvector extension
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Optimized for OpenAI embeddings
    metadata JSONB,
    importance_score FLOAT DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Execution Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS execution_logs (
    id SERIAL PRIMARY KEY,
    task_id UUID REFERENCES agent_tasks(id),
    log_level TEXT DEFAULT 'INFO',
    message TEXT,
    correlation_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
