import { useEffect, useRef, useState } from 'react'

// ── DATA ─────────────────────────────────────────────────────────────────────

const WEBHOOK_URL = 'https://n8n.pureremedysolutions.com/webhook/layer-1-perception'

const LAYERS = [
  {
    id: 'L1',
    name: 'Perception Layer',
    color: '#1D9E75',
    colorMuted: 'rgba(29, 158, 117, 0.08)',
    borderMuted: 'rgba(29, 158, 117, 0.25)',
    tag: 'INTAKE',
    desc: 'Native intake form with 10-field normalization. Every inbound signal is parsed, typed, and dispatched to the n8n webhook as a structured JSON payload.',
    tech: ['Native Form', 'n8n Webhook', 'Input Normalization', 'Schema Validation'],
    animClass: 'animate-fade-up-d1',
  },
  {
    id: 'L2',
    name: 'Core Layer',
    color: '#7F77DD',
    colorMuted: 'rgba(127, 119, 221, 0.08)',
    borderMuted: 'rgba(127, 119, 221, 0.25)',
    tag: 'REASONING',
    desc: 'Cascaded GPT-4o-mini logic for strategy and planning. Multi-step reasoning with branching conditionals and human-in-the-loop gates.',
    tech: ['GPT-4o-mini', 'Cascaded Logic', 'Planning Phase', 'HiL Gates'],
    animClass: 'animate-fade-up-d2',
  },
  {
    id: 'L3',
    name: 'Memory Layer',
    color: '#378ADD',
    colorMuted: 'rgba(55, 138, 221, 0.08)',
    borderMuted: 'rgba(55, 138, 221, 0.25)',
    tag: 'PERSISTENCE',
    desc: 'Migrated from Google Sheets to PostgreSQL (Supabase). Full ACID compliance, relational queries, and a self-optimizing confidence threshold loop.',
    tech: ['Supabase', 'PostgreSQL', 'ACID Transactions', 'Feedback Loop'],
    animClass: 'animate-fade-up-d3',
  },
  {
    id: 'L4',
    name: 'Execution Layer',
    color: '#BA7517',
    colorMuted: 'rgba(186, 117, 23, 0.08)',
    borderMuted: 'rgba(186, 117, 23, 0.25)',
    tag: 'ADAPTIVE',
    desc: 'Ideogram API for image generation, Instagram Graph API for publishing, SMTP for outreach. Protected by the global SAFE_MODE harness.',
    tech: ['Ideogram API', 'Instagram API', 'SMTP', 'SAFE_MODE'],
    animClass: 'animate-fade-up-d4',
  },
  {
    id: 'L5',
    name: 'Extensions Layer',
    color: '#D85A30',
    colorMuted: 'rgba(216, 90, 48, 0.08)',
    borderMuted: 'rgba(216, 90, 48, 0.25)',
    tag: 'PLATFORM DEV',
    desc: 'Published the n8n-nodes-gemini-pdf-analyzer community node to npm. Custom Node.js MCP server. OpenTelemetry bridge roadmapped.',
    tech: ['npm Community Node', 'MCP Server', 'OpenTelemetry (WIP)', 'TypeScript'],
    animClass: 'animate-fade-up-d5',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS — Final Unified Audit (17 Builds)
// ─────────────────────────────────────────────────────────────────────────────

const PROJECTS = [
  // ── L1 PERCEPTION ──────────────────────────────────────────────────────────
  {
    id: 'signal-hub',
    title: 'Signal Intelligence Hub',
    layer: 'L1 Perception',
    useBlueprint: true,
    bullets: [
      'High-Signal Scanner: Analyzes intent, tech stack, and growth signals across job boards.',
      'Dynamic Thresholds: Self-adjusting confidence scoring based on lead quality feedback.',
      'Automated Deduplication: Prevents redundant processing of multi-platform listings.'
    ],
    roi: '30x Scan Speed',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-1-perception/Signal-Pipeline'
  },
  {
    id: 'lead-gen',
    title: 'Enterprise AI Lead Gen',
    layer: 'L1 Perception',
    useBlueprint: true,
    bullets: [
      'v7.6 Resilient Upgrade: Targeted prospect identification with GPT-4o intent classification.',
      'Autonomous Reply Handler: Detects replies and bounces with dynamic CRM updates.',
      'Breakup Sequence: Automated follow-up logic with blacklist suppression safety.'
    ],
    roi: '40x Throughput',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-1-perception/AI-Lead-Gen-Machine'
  },
  {
    id: 'native-intake',
    title: 'Native Intake System',
    layer: 'L1 Perception',
    useBlueprint: true,
    bullets: [
      '10-Field Normalization: Native React form data parsed and typed for n8n consumption.',
      'Zero-CORS Architecture: Secure webhook routing directly to Supabase and Telegram.',
      'Lead Prioritization: Automatic scoring based on company size and revenue signals.'
    ],
    roi: 'Zero-Friction Ingestion',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-1-perception/'
  },

  // ── L2 CORE ────────────────────────────────────────────────────────────────
  {
    id: 'mcp-sheets',
    title: 'Claude MCP Orchestrator',
    layer: 'L2 Core',
    videoUrl: 'https://www.instagram.com/reel/DWS6dUyEcgA/',
    bullets: [
      '14-tool Node.js MCP server: Real-time Google Sheets read/write.',
      'Autonomous Task Management: Adds tasks and updates statuses via natural language.',
      'Zod Hardening: Implements Claude-recommended validation patterns for reliability.'
    ],
    roi: 'Agentic Reasoning Bridge',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-2-core/Claude-MCP-Task-Orchestrator'
  },

  // ── L3 MEMORY ──────────────────────────────────────────────────────────────
  {
    id: 'memory',
    title: 'Infinite Memory Vault',
    layer: 'L3 Memory',
    videoUrl: 'https://www.instagram.com/reel/DXKkyT8EdD8/',
    bullets: [
      'Supabase Vector DB: Permanent memory vault for brand pricing & suppliers.',
      'Full ACID Compliance: Relational state management migrated from Google Sheets.',
      'Proactive Retrieval: Context pre-fetching via Flowise Tool Agent.'
    ],
    roi: 'Zero Cognitive Overhead',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-3-memory/Infinite-Memory-Vault'
  },
  {
    id: 'log-drain',
    title: 'Production Log-Drain',
    layer: 'L3 Memory',
    useBlueprint: true,
    bullets: [
      'v4.4 Unified Observability: Centralized n8n pipeline capturing logs across the stack.',
      'Zero-Hardcoding Security: All credentials moved to secure environment variables.',
      'Intelligent Filtering: Ensures production-critical events trigger real-time Telegram alerts.'
    ],
    roi: 'Unified Observability',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/blob/main/layer-3-memory/log-drain-production.json'
  },

  // ── L4 EXECUTION ───────────────────────────────────────────────────────────
  {
    id: 'auditor',
    title: 'Invoice Vision Auditor',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DWoX58BkSXh/',
    bullets: [
      'Gemini 2.5 Flash: 8-second duplicate detection and signature validation.',
      'Closed-loop Audit: Instant red-alert emails and Google Drive filing.',
      '₹15,000/mo Savings: Replaces manual accountant first-pass review.'
    ],
    roi: '16x Speed (8s detection)',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/Invoice-Vision-Auditor'
  },
  {
    id: 'proposal',
    title: 'AI Proposal Autopilot',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DW05GrBkf7-/',
    bullets: [
      'Full Sales Lifecycle: Auto-generates branded PDF proposals and GST invoices.',
      '30-Second Delivery: Form submit to client inbox (Slides + Gmail + CRM).',
      '₹29,500 Savings: Replaces PandaDoc, HubSpot, and Zapier fees.'
    ],
    roi: '30s Sales Delivery',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/AI-Proposal-Invoice-Autopilot'
  },
  {
    id: 'outreach',
    title: 'Enterprise AI Sales Rep',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DXY7-u2kUEo/',
    bullets: [
      'Human-in-the-Loop: Slack-integrated approval gates for AI outreach.',
      '5-Bucket Intent: GPT classifies replies into Hot Lead vs Unsubscribe.',
      'Safe Mode: Config-level toggle for Simulation vs Live production.'
    ],
    roi: 'Human-Gated AI Outreach',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/Enterprise-AI-Sales-Rep'
  },
  {
    id: 'researcher',
    title: 'Autonomous Research Engine',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DXfOYEOkd34/',
    bullets: [
      'Deep Web RAG: YouTube transcripts and live scrapes via Apify.',
      'Quality Kill-Switch: Auto-refuses work scoring below 35/50 quality.',
      'Telegram Logs: Instant failure alerts with exact reasoning.'
    ],
    roi: '2,500-Word Cited Docs',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/Autonomous-Research-Engine'
  },
  {
    id: 'alchemist',
    title: 'The Content Alchemist',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DXATR87kebf/',
    bullets: [
      'Voice-to-Viral: Transforms voice notes to LinkedIn/Twitter threads.',
      '2-Stage Pipeline: GPT-4o visual briefs → DALL-E 3 branded renders.',
      'Self-Hosted Whisper: Zero-cost transcription via Colab T4 GPU.'
    ],
    roi: '40x Faster Production',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/Content-Alchemist'
  },
  {
    id: 'factory',
    title: 'AI Influencer Factory',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DXt9_2HEX7B/',
    bullets: [
      'v3 Enterprise: Persona Gen → Ideogram API → Instagram Graph API.',
      'Safe Mode Guardrails: Prevents accidental production spends during tests.',
      'Manual Overwrites: Detects custom image URLs to skip AI generation.'
    ],
    roi: '₹1,00,000/mo Savings',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/AI-Influencer-Factory'
  },
  {
    id: 'seo-suite',
    title: 'Auto-Blogger SEO Suite',
    layer: 'L4 Execution',
    useBlueprint: true,
    bullets: [
      'WordPress Integration: Automated SEO content pipeline with direct publishing.',
      'Dual Audit Logging: Captures article generation and publishing events separately.',
      'Dynamic Optimization: AI-powered metadata and alt-text generation.'
    ],
    roi: '90x Production Speed',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/Auto-Blogger-SEO-Suite'
  },
  {
    id: 'whatsapp-bot',
    title: 'WhatsApp AI Bot Series',
    layer: 'L4 Execution',
    useBlueprint: true,
    bullets: [
      'Industry Specialized: Production-ready bots for Hotels and Restaurants.',
      'Webhook Boilerplates: Reusable infrastructure for rapid bot deployment.',
      'Conversational Memory: Stateful interactions using Layer 3 persistence.'
    ],
    roi: 'Instant Client Response',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/WhatsApp-AI-Bot-Series'
  },
  {
    id: 'ugc-system',
    title: 'UGC Content System',
    layer: 'L4 Execution',
    useBlueprint: true,
    bullets: [
      'Multi-Lane Architecture: Video production with Nano, Veo, and Sora lanes.',
      'Dynamic Switching: AI autonomously selects the best model for the scene.',
      'Automated Stitching: Post-production logic for unified video output.'
    ],
    roi: 'Zero-Manual Editing',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/UGC-Content-System'
  },
  {
    id: 'local-legal',
    title: 'Local Legal AI',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DXFHiaRkS6B/',
    bullets: [
      '100% Air-Gapped: Zero data leaves your network — local Ollama/Llama3 runtime.',
      'Legal Document Analysis: Contract review and risk identification via local inference.',
      'Zero API Cost: Eliminates cloud LLM fees for sensitive client documents.'
    ],
    roi: 'Zero Cloud Exposure',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/Local-Legal-AI'
  },

  {
    id: 'onboarding-machine',
    title: 'v7.6 "Gold Standard" Onboarding Machine',
    layer: 'L4 Execution',
    useBlueprint: true,
    bullets: [
      'Compound AI Architecture: 7-engine modular suite (v7.6 Gold) with Planner -> Evaluator loop for zero-hallucination sanity checks.',
      'Infrastructure Portability: 100% zero-hardcoding — dynamic brand persona and ID resolution via centralized global config.',
      'Automated ROI Value Tracking: Centralized Log-Drain registry records precise human-labor ROI directly into Supabase analytics.'
    ],
    roi: '90x Speed (6hrs -> 30s)',
    stats: '7 Modular Engines | Gemini 2.5 Flash',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/Enterprise-n8n-Architectures'
  },

  // ── L5 EXTENSIONS ──────────────────────────────────────────────────────────
  {
    id: 'npm-node',
    title: 'n8n Gemini PDF Analyzer',
    layer: 'L5 Extensions',
    isPackage: true,
    url: 'https://www.npmjs.com/package/n8n-nodes-gemini-pdf-analyzer',
    bullets: [
      'Community Node: Published to npm for global n8n ecosystem use.',
      'Gemini 1.5 Pro: Direct PDF auditing and vision-to-json extraction.',
      'Enterprise Schema: Built-in validation for industrial parsing.'
    ],
    roi: 'Official npm Package',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-5-extensions/n8n-nodes-gemini-pdf-analyzer'
  }
]

const METRICS = [
  { value: '18', label: 'Production Builds', color: '#7F77DD' },
  { value: 'L4', label: 'Autonomy Level', color: '#1D9E75' },
  { value: '1 pkg', label: 'Published to npm', color: '#D85A30' },
  { value: '9/10', label: 'Enterprise Audit Score', color: '#BA7517' },
]

// ── PARTICLE CANVAS ───────────────────────────────────────────────────────────

function ParticleCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    const particles = []
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.3,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        alpha: Math.random() * 0.4 + 0.1,
        color: ['#7F77DD', '#1D9E75', '#378ADD', '#D85A30'][Math.floor(Math.random() * 4)],
      })
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      })
      ctx.globalAlpha = 1
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 90) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = particles[i].color
            ctx.globalAlpha = (1 - dist / 90) * 0.08
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      id="particle-canvas"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}

// ── SHARED HOOK ───────────────────────────────────────────────────────────────

function useMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile
}

// ── NAVBAR ────────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const isMobile = useMobile()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(7, 7, 15, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: '#E8E6FF' }}>
          pandian<span style={{ color: '#7F77DD' }}>-ai</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 28 }}>
          {!isMobile && ['Architecture', 'Projects', 'Contact'].map(item => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(232, 230, 255, 0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#E8E6FF'}
              onMouseLeave={e => e.target.style.color = 'rgba(232, 230, 255, 0.55)'}
            >
              {item}
            </a>
          ))}
          <a
            href="https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', color: '#E8E6FF', textDecoration: 'none' }}
          >
            <svg height="24" viewBox="0 0 16 16" width="24" style={{ fill: 'currentColor', opacity: 0.8 }}>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          <a
            href="#contact"
            style={{
              fontFamily: 'Space Mono',
              fontSize: isMobile ? 10 : 11,
              fontWeight: 700,
              color: '#1D9E75',
              textDecoration: 'none',
              border: '1px solid rgba(29, 158, 117, 0.4)',
              padding: isMobile ? '4px 10px' : '6px 14px',
              borderRadius: 6,
              transition: 'all 0.2s',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(29,158,117,0.12)'; e.target.style.borderColor = '#1D9E75' }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'rgba(29,158,117,0.4)' }}
          >
            HIRE ME
          </a>
        </div>
      </div>
    </nav>
  )
}

// ── HERO ──────────────────────────────────────────────────────────────────────

function Hero() {
  const isMobile = useMobile()
  return (
    <section
      id="home"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#07070F',
      }}
    >
      <div className="orb orb-purple" style={{ width: 500, height: 500, background: 'rgba(127, 119, 221, 0.12)', top: '-100px', left: '-120px' }} />
      <div className="orb orb-teal" style={{ width: 400, height: 400, background: 'rgba(29, 158, 117, 0.1)', bottom: '60px', right: '-80px' }} />
      <div className="orb orb-amber" style={{ width: 300, height: 300, background: 'rgba(186, 117, 23, 0.08)', bottom: '200px', left: '20%' }} />

      <ParticleCanvas />
      <div className="scan-line" />

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: isMobile ? '60px 20px 0' : '0 24px', maxWidth: 800 }}>
        <div className="animate-fade-up" style={{ marginBottom: 16 }}>
          <span
            style={{
              fontFamily: 'Space Mono',
              fontSize: 'clamp(9px, 2.5vw, 11px)',
              letterSpacing: '0.15em',
              color: '#1D9E75',
              border: '1px solid rgba(29, 158, 117, 0.3)',
              padding: '4px 12px',
              borderRadius: 4,
              background: 'rgba(29, 158, 117, 0.06)',
              display: 'inline-block',
            }}
          >
            ◈ L4 ADAPTIVE AUTONOMOUS ENGINE · VERIFIED
          </span>
        </div>

        <h1
          className="animate-fade-up-d1"
          style={{
            fontFamily: 'Outfit',
            fontWeight: 800,
            fontSize: 'clamp(40px, 8vw, 80px)',
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            color: '#E8E6FF',
            marginBottom: 16,
          }}
        >
          AI-First
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #7F77DD 0%, #1D9E75 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Architect
          </span>
        </h1>

        <p
          className="animate-fade-up-d2"
          style={{
            fontFamily: 'Inter',
            fontWeight: 300,
            fontSize: 'clamp(14px, 4vw, 18px)',
            color: 'rgba(232, 230, 255, 0.55)',
            marginBottom: 40,
            lineHeight: 1.6,
            maxWidth: 560,
            margin: '0 auto 40px',
            padding: '0 20px',
          }}
        >
          Enterprise n8n automation · Supabase-backed pipelines · Published community nodes.
          Building autonomous infrastructure that thinks, adapts, and self-corrects.
        </p>

        <div className="animate-fade-up-d3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="#architecture"
            style={{
              fontFamily: 'Space Mono',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#07070F',
              background: 'linear-gradient(135deg, #7F77DD, #1D9E75)',
              padding: '14px 28px',
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'opacity 0.2s, transform 0.2s',
            }}
            onMouseEnter={e => { e.target.style.opacity = '0.85'; e.target.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)' }}
          >
            VIEW ARCHITECTURE ↓
          </a>
          <a
            href="#contact"
            style={{
              fontFamily: 'Space Mono',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#E8E6FF',
              background: 'transparent',
              padding: '14px 28px',
              borderRadius: 8,
              border: '1px solid rgba(232, 230, 255, 0.15)',
              textDecoration: 'none',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'rgba(232,230,255,0.35)'; e.target.style.background = 'rgba(232,230,255,0.04)' }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(232,230,255,0.15)'; e.target.style.background = 'transparent' }}
          >
            START A PROJECT →
          </a>
        </div>

        <div
          className="animate-fade-up-d4"
          style={{ marginTop: 80, fontFamily: 'Space Mono', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(232,230,255,0.25)' }}
        >
          hello@pandian-ai.com
        </div>
      </div>
    </section>
  )
}

// ── ARCHITECTURE SECTION ──────────────────────────────────────────────────────

function LayerCard({ layer, index, activeFilter, setActiveFilter }) {
  const [hovered, setHovered] = useState(false)

  const handleClick = () => {
    setActiveFilter(layer.id)
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      onClick={handleClick}
      className={layer.animClass}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        position: 'relative',
        padding: '24px 28px',
        borderRadius: 12,
        background: hovered ? layer.colorMuted : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? layer.borderMuted : 'rgba(255,255,255,0.06)'}`,
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateX(6px)' : 'translateX(0)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 16,
          bottom: 16,
          width: hovered ? 3 : 1,
          borderRadius: 2,
          background: layer.color,
          transition: 'width 0.3s ease',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: 'Space Mono',
              fontSize: 13,
              fontWeight: 700,
              color: layer.color,
              border: `1px solid ${layer.color}`,
              padding: '4px 8px',
              borderRadius: 4,
              background: `${layer.color}12`,
            }}
          >
            {layer.id}
          </span>
          <span style={{ fontFamily: 'Space Mono', fontSize: 9, letterSpacing: '0.1em', color: layer.color, opacity: 0.7 }}>
            {layer.tag}
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: '#E8E6FF', marginBottom: 8, letterSpacing: '-0.01em' }}>
            {layer.name}
          </h3>
          <p style={{ fontFamily: 'Inter', fontSize: 14, color: 'rgba(232, 230, 255, 0.5)', lineHeight: 1.65, marginBottom: 14 }}>
            {layer.desc}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {layer.tech.map(t => (
              <span
                key={t}
                style={{
                  fontFamily: 'Space Mono',
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  color: layer.color,
                  background: `${layer.color}10`,
                  border: `1px solid ${layer.color}30`,
                  padding: '3px 9px',
                  borderRadius: 4,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Architecture({ setActiveFilter }) {
  return (
    <section id="architecture" style={{ padding: '100px 24px', background: '#07070F' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ fontFamily: 'Space Mono', fontSize: 10, letterSpacing: '0.2em', color: '#7F77DD', display: 'block', marginBottom: 12 }}>
            SYSTEM TOPOLOGY
          </span>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 44px)', color: '#E8E6FF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            5-Layer Enterprise{' '}
            <span style={{ color: '#7F77DD' }}>n8n Standard</span>
          </h2>
          <p style={{ fontFamily: 'Inter', fontSize: 15, color: 'rgba(232,230,255,0.45)', marginTop: 12 }}>
            Every system is audited and built against this rubric. L4 Adaptive Autonomy confirmed.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LAYERS.map((layer, i) => (
            <LayerCard key={layer.id} layer={layer} index={i} setActiveFilter={setActiveFilter} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── METRICS STRIP ─────────────────────────────────────────────────────────────

function Metrics() {
  const isMobile = useMobile()
  return (
    <section
      style={{
        padding: '60px 24px',
        background: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {METRICS.map(m => (
            <div
              key={m.label}
              style={{ textAlign: 'center', padding: isMobile ? '32px 20px' : '24px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: isMobile ? 44 : 36, color: m.color, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8 }}>
                {m.value}
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(232,230,255,0.4)', letterSpacing: '0.02em' }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── PROJECT SHOWCASE ──────────────────────────────────────────────────────────

function ReelPendingBadge() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(7,7,15,0.8)',
      backdropFilter: 'blur(4px)',
      zIndex: 5,
      padding: 20,
      textAlign: 'center'
    }}>
      <div style={{
        fontFamily: 'Space Mono',
        fontSize: 10,
        color: '#7F77DD',
        border: '1px solid #7F77DD',
        padding: '6px 12px',
        borderRadius: 4,
        marginBottom: 12,
        letterSpacing: '0.1em'
      }}>
        REEL PENDING
      </div>
      <p style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(232,230,255,0.5)', maxWidth: 200 }}>
        New demonstration for this project is currently being recorded.
      </p>
    </div>
  )
}

function ProjectCard({ project }) {
  const isMobile = useMobile()
  const videoId = project.videoUrl?.split('/reel/')[1]?.split('/')[0]

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(127,119,221,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ position: 'relative', paddingTop: '125%', background: '#000' }}>
        {project.reelPending ? (
          <ReelPendingBadge />
        ) : project.useBlueprint ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#1D9E75', marginBottom: 12, letterSpacing: '0.1em' }}>SYSTEM SCHEMATIC</div>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
        ) : videoId ? (
          <iframe
            src={`https://www.instagram.com/reel/${videoId}/embed/captioned/`}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            scrolling="no"
            allowTransparency="true"
          />
        ) : null}
      </div>

      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'stretch', textAlign: isMobile ? 'center' : 'left' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-start', marginBottom: 16, gap: isMobile ? 12 : 0 }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 20, color: '#E8E6FF', marginBottom: 4 }}>{project.title}</h3>
            <span style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#7F77DD', letterSpacing: '0.05em' }}>{project.layer.toUpperCase()}</span>
          </div>
          <div style={{ background: 'rgba(29, 158, 117, 0.1)', border: '1px solid rgba(29, 158, 117, 0.2)', padding: '4px 10px', borderRadius: 6 }}>
            <span style={{ fontFamily: 'Space Mono', fontSize: 10, fontWeight: 700, color: '#1D9E75' }}>{project.roi}</span>
          </div>
        </div>

        <ul style={{ margin: 0, padding: 0, listStyle: 'none', flex: 1 }}>
          {project.bullets.map((b, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontFamily: 'Inter', fontSize: 13, color: 'rgba(232, 230, 255, 0.5)', lineHeight: 1.5 }}>
              <span style={{ color: '#7F77DD', marginTop: 2 }}>▹</span>
              {b}
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: 'Space Mono',
              fontSize: 11,
              fontWeight: 700,
              color: '#E8E6FF',
              textDecoration: 'none',
              background: 'rgba(255,255,255,0.05)',
              padding: '10px',
              borderRadius: 8,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
          >
            SOURCE
          </a>
          {project.isPackage && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'Space Mono',
                fontSize: 11,
                fontWeight: 700,
                color: '#07070F',
                textDecoration: 'none',
                background: '#D85A30',
                padding: '10px',
                borderRadius: 8,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.target.style.opacity = '0.8'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              NPM
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectShowcase({ activeFilter, setActiveFilter }) {
  const isMobile = useMobile()
  const filtered = activeFilter === 'ALL'
    ? PROJECTS
    : PROJECTS.filter(p => p.layer.startsWith(activeFilter))

  return (
    <section id="projects" style={{ padding: '100px 24px', background: '#07070F' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', marginBottom: 48, gap: 24 }}>
          <div style={{ textAlign: isMobile ? 'center' : 'left', width: isMobile ? '100%' : 'auto' }}>
            <span style={{ fontFamily: 'Space Mono', fontSize: 10, letterSpacing: '0.2em', color: '#1D9E75', display: 'block', marginBottom: 12 }}>BUILD REGISTRY</span>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 44px)', color: '#E8E6FF', letterSpacing: '-0.02em' }}>Production Instances</h2>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
            {['ALL', 'L1', 'L2', 'L3', 'L4', 'L5'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  fontFamily: 'Space Mono',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeFilter === f ? '#7F77DD' : 'transparent',
                  color: activeFilter === f ? '#07070F' : 'rgba(232, 230, 255, 0.45)',
                  transition: 'all 0.2s'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 1 : 3}, 1fr)`, gap: 32 }}>
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CONTACT SECTION ───────────────────────────────────────────────────────────

function Contact() {
  const isMobile = useMobile()
  const [formState, setFormState] = useState('idle')
  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    company: '', 
    industry: '',
    projectType: '', 
    budget: '',
    timeline: '',
    phone: '',
    goal: '',
    techStack: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormState('submitting')
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        setFormState('success')
        setFormData({ 
          fullName: '', email: '', company: '', industry: '',
          projectType: '', budget: '', timeline: '', phone: '', 
          goal: '', techStack: '' 
        })
      } else {
        const errorText = await response.text()
        console.error('Submission failed:', errorText)
        setFormState('error')
      }
    } catch (err) {
      console.error('Submission error:', err)
      setFormState('error')
    }
  }

  return (
    <section id="contact" style={{ padding: '100px 24px', background: '#0A0A14' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ fontFamily: 'Space Mono', fontSize: isMobile ? 12 : 10, letterSpacing: '0.2em', color: '#D85A30', display: 'block', marginBottom: 12 }}>INTAKE PORTAL</span>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 'clamp(28px, 5vw, 36px)', color: '#E8E6FF', marginBottom: 40, letterSpacing: '-0.02em' }}>Start Your Build</h2>

        {formState === 'success' ? (
          <div style={{ padding: '60px 40px', borderRadius: 16, background: 'rgba(29, 158, 117, 0.05)', border: '1px solid rgba(29, 158, 117, 0.2)' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🚀</div>
            <h3 style={{ fontFamily: 'Outfit', color: '#1D9E75', fontSize: 24, marginBottom: 12 }}>Lead Ingested</h3>
            <p style={{ fontFamily: 'Inter', color: 'rgba(232, 230, 255, 0.6)', lineHeight: 1.6 }}>
              Signal received and normalized across 10 datapoints. Our L2 Core Layer is now prioritizing your request.
              Expect an outreach within 24 hours.
            </p>
            <button
              onClick={() => setFormState('idle')}
              style={{ marginTop: 32, fontFamily: 'Space Mono', color: '#E8E6FF', background: 'transparent', border: '1px solid rgba(232, 230, 255, 0.2)', padding: '10px 24px', borderRadius: 8, cursor: 'pointer' }}
            >
              SEND ANOTHER SIGNAL
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'grid', gap: 20 }}>
            {/* ROW 1: Identity */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'rgba(232,230,255,0.4)', letterSpacing: '0.1em' }}>FULL NAME</label>
                <input
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#E8E6FF', fontFamily: 'Inter' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'rgba(232,230,255,0.4)', letterSpacing: '0.1em' }}>EMAIL</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#E8E6FF', fontFamily: 'Inter' }}
                />
              </div>
            </div>

            {/* ROW 2: Organization */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'rgba(232,230,255,0.4)', letterSpacing: '0.1em' }}>COMPANY / DOMAIN</label>
                <input
                  required
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#E8E6FF', fontFamily: 'Inter' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'rgba(232,230,255,0.4)', letterSpacing: '0.1em' }}>INDUSTRY</label>
                <input
                  value={formData.industry}
                  onChange={e => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g. Real Estate, Tech, Legal"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#E8E6FF', fontFamily: 'Inter' }}
                />
              </div>
            </div>

            {/* ROW 3: Project Specifics */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'rgba(232,230,255,0.4)', letterSpacing: '0.1em' }}>PROJECT CATEGORY</label>
                <select
                  required
                  value={formData.projectType}
                  onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#E8E6FF', fontFamily: 'Inter', appearance: 'none' }}
                >
                  <option value="" disabled style={{ background: '#0A0A14' }}>Select a category...</option>
                  <option value="Enterprise n8n Implementation" style={{ background: '#0A0A14' }}>Enterprise n8n Implementation</option>
                  <option value="AI Outreach System" style={{ background: '#0A0A14' }}>AI Outreach System</option>
                  <option value="Custom Community Node" style={{ background: '#0A0A14' }}>Custom Community Node</option>
                  <option value="Memory Layer Migration" style={{ background: '#0A0A14' }}>Memory Layer Migration</option>
                  <option value="Other / Stealth Build" style={{ background: '#0A0A14' }}>Other / Stealth Build</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'rgba(232,230,255,0.4)', letterSpacing: '0.1em' }}>BUDGET RANGE (USD)</label>
                <select
                  value={formData.budget}
                  onChange={e => setFormData({ ...formData, budget: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#E8E6FF', fontFamily: 'Inter', appearance: 'none' }}
                >
                  <option value="" style={{ background: '#0A0A14' }}>Select range...</option>
                  <option value="< $2k" style={{ background: '#0A0A14' }}>{`< $2k`}</option>
                  <option value="$2k - $5k" style={{ background: '#0A0A14' }}>$2k - $5k</option>
                  <option value="$5k - $15k" style={{ background: '#0A0A14' }}>$5k - $15k</option>
                  <option value="$15k+" style={{ background: '#0A0A14' }}>$15k+</option>
                </select>
              </div>
            </div>

            {/* ROW 4: Logistics */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'rgba(232,230,255,0.4)', letterSpacing: '0.1em' }}>TIMELINE</label>
                <select
                  value={formData.timeline}
                  onChange={e => setFormData({ ...formData, timeline: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#E8E6FF', fontFamily: 'Inter', appearance: 'none' }}
                >
                  <option value="" style={{ background: '#0A0A14' }}>Select timeline...</option>
                  <option value="Urgent (1-2 weeks)" style={{ background: '#0A0A14' }}>Urgent (1-2 weeks)</option>
                  <option value="Standard (1 month)" style={{ background: '#0A0A14' }}>Standard (1 month)</option>
                  <option value="Strategic (3+ months)" style={{ background: '#0A0A14' }}>Strategic (3+ months)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'rgba(232,230,255,0.4)', letterSpacing: '0.1em' }}>PHONE / TELEGRAM</label>
                <input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#E8E6FF', fontFamily: 'Inter' }}
                />
              </div>
            </div>

            {/* ROW 5: Depth */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'rgba(232,230,255,0.4)', letterSpacing: '0.1em' }}>CURRENT TECH STACK</label>
              <input
                value={formData.techStack}
                onChange={e => setFormData({ ...formData, techStack: e.target.value })}
                placeholder="e.g. Python, n8n, Supabase, React"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#E8E6FF', fontFamily: 'Inter' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'rgba(232,230,255,0.4)', letterSpacing: '0.1em' }}>PRIMARY GOAL / OBJECTIVE</label>
              <textarea
                required
                rows={3}
                value={formData.goal}
                onChange={e => setFormData({ ...formData, goal: e.target.value })}
                placeholder="What specific objective should this system achieve?"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#E8E6FF', fontFamily: 'Inter', resize: 'none' }}
              />
            </div>

            <button
              disabled={formState === 'submitting'}
              style={{
                marginTop: 10,
                fontFamily: 'Space Mono',
                fontSize: isMobile ? 15 : 12,
                fontWeight: 800,
                color: '#07070F',
                background: formState === 'error' ? '#D85A30' : 'linear-gradient(135deg, #7F77DD, #1D9E75)',
                padding: isMobile ? '22px' : '16px',
                width: '100%',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                boxShadow: isMobile ? '0 10px 30px -10px rgba(127, 119, 221, 0.5)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: formState === 'submitting' ? 0.7 : 1,
                transform: formState === 'submitting' ? 'scale(0.98)' : 'scale(1)',
                letterSpacing: '0.05em'
              }}
            >
              {formState === 'submitting' ? 'INITIALIZING UPLINK...' : formState === 'error' ? 'UPLINK FAILED — RETRY?' : 'DISPATCH SIGNAL'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

// ── FOOTER ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ padding: '60px 24px', background: '#07070F', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 16, color: '#E8E6FF', marginBottom: 12 }}>
        pandian<span style={{ color: '#7F77DD' }}>-ai</span>
      </div>
      <div style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'rgba(232,230,255,0.2)', letterSpacing: '0.1em' }}>
        © 2026 · ARCHITECTED BY PANDIAN · L4 AUTONOMY VERIFIED
      </div>
    </footer>
  )
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activeFilter, setActiveFilter] = useState('ALL')

  return (
    <div style={{ background: '#07070F', minHeight: '100vh', color: '#E8E6FF' }}>
      <Navbar />
      <Hero />
      <Architecture setActiveFilter={setActiveFilter} />
      <Metrics />
      <ProjectShowcase activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      <Contact />
      <Footer />
    </div>
  )
}
