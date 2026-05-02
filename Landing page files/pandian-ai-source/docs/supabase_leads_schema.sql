-- ============================================================
--  pandian-ai.com  ·  Layer-3 Memory  ·  Leads CRM Table
--  Run in Supabase SQL Editor (Database > SQL Editor > New Query)
-- ============================================================

-- ── TABLE ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leads (

  -- Primary key
  id              UUID          DEFAULT gen_random_uuid()  PRIMARY KEY,

  -- ── Core fields (mapped 1:1 from n8n Code node payload) ──
  name            TEXT,
  email           TEXT          NOT NULL,
  company         TEXT,
  budget          TEXT,                         -- free text: "₹50k-1L", "Enterprise", etc.
  project_type    TEXT,                         -- "Automation", "AI Pipeline", "Consulting"
  timeline        TEXT,                         -- "ASAP", "1-2 months", "Q1 2026"
  ai_maturity     TEXT,                         -- dropdown value: "L1" … "L5"
  stack           TEXT,                         -- freeform: "Make.com, Airtable, OpenAI"
  goal            TEXT,                         -- freeform primary goal
  has_n8n         BOOLEAN       DEFAULT FALSE,  -- "Any existing n8n instance?" yes/no

  -- ── System / pipeline fields ─────────────────────────────
  source          TEXT          DEFAULT 'pandian-ai.com',
  status          TEXT          DEFAULT 'new'
                  CHECK (status IN ('new','contacted','qualified','proposal_sent','closed_won','closed_lost')),

  -- For the Layer-3 self-optimizing confidence loop (AUDIT_EVOLUTION.md §3)
  confidence_score  NUMERIC(5,2),              -- 0.00 – 100.00
  human_feedback    TEXT,                      -- "good_lead" | "poor_fit" | "spam"

  notes           TEXT,                         -- manual override / sales notes

  -- ── Timestamps ───────────────────────────────────────────
  ingested_at     TIMESTAMPTZ   NOT NULL  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL  DEFAULT NOW(),

  -- ── Constraints ──────────────────────────────────────────
  CONSTRAINT leads_email_valid
    CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'),

  CONSTRAINT leads_confidence_range
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100))
);

COMMENT ON TABLE public.leads IS
  'Layer-3 Memory CRM. Ingested via Tally → n8n Webhook → Layer-1 Perception pipeline.';

COMMENT ON COLUMN public.leads.confidence_score IS
  'Set by the L4 Adaptive feedback loop. Adjusts outreach threshold automatically.';

COMMENT ON COLUMN public.leads.human_feedback IS
  'Human signal logged by n8n after manual review. Drives confidence_score optimizer.';


-- ── INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_leads_email
  ON public.leads (email);

CREATE INDEX IF NOT EXISTS idx_leads_status
  ON public.leads (status);

CREATE INDEX IF NOT EXISTS idx_leads_ingested_at
  ON public.leads (ingested_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_ai_maturity
  ON public.leads (ai_maturity);

CREATE INDEX IF NOT EXISTS idx_leads_source
  ON public.leads (source);

-- Partial index — fast "new lead" queue queries in n8n polling
CREATE INDEX IF NOT EXISTS idx_leads_new_queue
  ON public.leads (ingested_at DESC)
  WHERE status = 'new';


-- ── AUTO-UPDATED_AT TRIGGER ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_updated_at();


-- ── ROW LEVEL SECURITY ────────────────────────────────────────
--  n8n uses the service_role key (bypasses RLS automatically).
--  Enable RLS so anon/public cannot read raw lead data.

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Service role: full CRUD (n8n inserts, updates confidence scores)
CREATE POLICY "service_role_full_access"
  ON public.leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users (future dashboard): read-only
CREATE POLICY "authenticated_read_only"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (true);


-- ── VERIFICATION QUERY ────────────────────────────────────────
--  Run after migration to confirm table + indexes exist.

SELECT
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'leads'
ORDER BY ordinal_position;
