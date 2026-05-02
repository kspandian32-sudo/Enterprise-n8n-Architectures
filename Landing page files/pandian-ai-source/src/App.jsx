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

const PROJECTS = [
  {
    id: 'signal-hub',
    title: 'Signal Intelligence Hub',
    layer: 'L1 Perception',
    videoUrl: 'https://www.instagram.com/reel/DXfOYEOkd34/',
    bullets: [
      'High-Signal Scanner: Analyzes intent, tech stack, and growth signals across job boards.',
      'Dynamic Thresholds: Self-adjusting confidence scoring based on lead quality feedback.',
      'Automated Deduplication: Prevents redundant processing of multi-platform listings.'
    ],
    roi: '40x Lead Throughput',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-1-perception/Signal-Pipeline'
  },
  {
    id: 'mcp-sheets',
    title: 'Claude MCP Orchestrator',
    layer: 'L2 Core',
    videoUrl: 'https://www.instagram.com/reel/DWS6dUyEcgA/',
    bullets: [
      '14-tool Node.js MCP server: Real-time Google Sheets read/write.',
      'Autonomous Task Management: Adds tasks and updates statuses via natural language.',
      'Automated Standup Reports: Generates daily summaries with zero manual input.'
    ],
    roi: 'Replaces Manual Data Entry',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-2-core/Claude-MCP-Task-Orchestrator'
  },
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
    title: 'Proposal Autopilot',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DW05GrBkf7-/',
    bullets: [
      'Full Stack CRM: Auto-generates branded PDF proposals and GST invoices.',
      '30-Second Delivery: Form submit to client inbox (Slides + Gmail + CRM).',
      '₹29,500 Savings: Replaces PandaDoc, HubSpot, and Zapier fees.'
    ],
    roi: '₹1.50 per Proposal',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/Proposal-Autopilot'
  },
  {
    id: 'alchemist',
    title: 'The Content Alchemist',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DXATR87kebf/',
    bullets: [
      'Voice-to-Viral: 37-node suite transforms voice notes to LinkedIn/Twitter threads.',
      '2-Stage Pipeline: GPT-4o visual briefs → DALL-E 3 branded renders.',
      'Self-Hosted whisper: Zero-cost transcription via Colab T4 GPU + ngrok.'
    ],
    roi: '0 Minutes Spent Writing',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/Content-Alchemist'
  },
  {
    id: 'legal',
    title: 'Local Legal Intelligence',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DXFHiaRkS6B/',
    bullets: [
      '100% Offline: 6 specialized Ollama agents (NDAs, Employment, IP).',
      'Deepseek-r1:8b: Chain-of-thought reasoning for defensible legal verdicts.',
      'Zero Data Leaks: Local PDF processing with AnythingLLM workspaces.'
    ],
    roi: '₹20k–₹1L Savings/Run',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/Local-Legal-AI'
  },
  {
    id: 'memory',
    title: 'Permanent AI Brain',
    layer: 'L3 Memory',
    videoUrl: 'https://www.instagram.com/reel/DXKkyT8EdD8/',
    bullets: [
      'Supabase Vector DB: Permanent memory vault for brand pricing & suppliers.',
      'Importance Scoring: Only 6+/10 memories stored to prevent noise.',
      'Proactive Retrieval: Context pre-fetching via Flowise Tool Agent.'
    ],
    roi: 'Zero Cognitive Overhead',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-3-memory'
  },
  {
    id: 'outreach',
    title: '3-Workflow Outreach',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DXY7-u2kUEo/',
    bullets: [
      'Apollo Lead Scoring: Automated contact auditing and blacklist checking.',
      '5-Bucket Intent: GPT classifies replies into Hot Lead vs Unsubscribe.',
      'Safe Mode: Config-level toggle for Simulation vs Live production.'
    ],
    roi: '40x Lead Throughput',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/Outreach-Engine'
  },
  {
    id: 'researcher',
    title: 'Autonomous Researcher',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DXfOYEOkd34/',
    bullets: [
      '23-Node Engine: Pulls YouTube transcripts and live web scrapes via Apify.',
      'Quality Kill-Switch: Auto-refuses work scoring below 35/50 on quality criteria.',
      'Telegram Logs: Instant failure alerts with exact reasoning for human review.'
    ],
    roi: '2,500-Word Cited Docs',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/Research-Engine'
  },
  {
    id: 'factory',
    title: 'Virtual Influencer Factory',
    layer: 'L4 Execution',
    videoUrl: 'https://www.instagram.com/reel/DXt9_2HEX7B/',
    bullets: [
      'End-to-End Autonomy: Persona Gen → Ideogram API → Instagram Graph API.',
      'Defensive Parsing: Custom regex strips markdown to ensure 100% JSON uptime.',
      'Hybrid Overrides: Detects manual image URLs to skip AI generation selectively.'
    ],
    roi: '₹1,00,000/mo Agency Savings',
    github: 'https://github.com/kspandian32-sudo/Enterprise-n8n-Architectures/tree/main/layer-4-execution/AI-Influencer-Factory'
  },
  {
    id: 'npm-node',
    title: 'n8n-nodes-gemini-pdf-analyzer',
    layer: 'L5 Extensions',
    isPackage: true,
    url: 'https://www.npmjs.com/package/n8n-nodes-gemini-pdf-analyzer',
    bullets: [
      'Community Node: Published to npm for global n8n ecosystem use.',
      'Gemini 1.5 Pro: Direct PDF auditing and vision-to-json extraction.',
      'Enterprise Schema: Built-in validation for industrial invoice/legal parsing.'
    ],
    roi: 'Official npm Package',
    github: 'https://github.com/kspandian32-sudo/n8n-nodes-gemini-pdf-analyzer'
  }
]

const METRICS = [
  { value: '9/10', label: 'Enterprise Audit Score', color: '#7F77DD' },
  { value: 'L4', label: 'Autonomy Level', color: '#1D9E75' },
  { value: '1 pkg', label: 'Published to npm', color: '#D85A30' },
  { value: '5+', label: 'Live Workflows', color: '#BA7517' },
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
      // Draw faint connection lines
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

// ── NAVBAR ────────────────────────────────────────────────────────────────────

function useMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile
}

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
      id="hero"
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
      {/* Gradient orbs */}
      <div
        className="orb orb-purple"
        style={{ width: 500, height: 500, background: 'rgba(127, 119, 221, 0.12)', top: '-100px', left: '-120px' }}
      />
      <div
        className="orb orb-teal"
        style={{ width: 400, height: 400, background: 'rgba(29, 158, 117, 0.1)', bottom: '60px', right: '-80px' }}
      />
      <div
        className="orb orb-amber"
        style={{ width: 300, height: 300, background: 'rgba(186, 117, 23, 0.08)', bottom: '200px', left: '20%' }}
      />

      <ParticleCanvas />
      <div className="scan-line" />

      {/* Hero content */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: isMobile ? '60px 20px 0' : '0 24px', maxWidth: 800 }}>
        {/* System tag */}
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

        {/* Headline */}
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

        {/* Sub-headline */}
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

        {/* CTAs */}
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

        {/* Scroll hint */}
        <div
          className="animate-fade-up-d4"
          style={{
            marginTop: 80,
            fontFamily: 'Space Mono',
            fontSize: 10,
            letterSpacing: '0.15em',
            color: 'rgba(232,230,255,0.25)',
          }}
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
  const isMobile = useMobile()
  
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
      {/* Left accent bar */}
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
        {/* Layer ID badge */}
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
          <span
            style={{
              fontFamily: 'Space Mono',
              fontSize: 9,
              letterSpacing: '0.1em',
              color: layer.color,
              opacity: 0.7,
            }}
          >
            {layer.tag}
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontFamily: 'Outfit',
              fontWeight: 700,
              fontSize: 18,
              color: '#E8E6FF',
              marginBottom: 8,
              letterSpacing: '-0.01em',
            }}
          >
            {layer.name}
          </h3>
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: 14,
              color: 'rgba(232, 230, 255, 0.5)',
              lineHeight: 1.65,
              marginBottom: 14,
            }}
          >
            {layer.desc}
          </p>
          {/* Tech pills */}
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
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span
            style={{
              fontFamily: 'Space Mono',
              fontSize: 10,
              letterSpacing: '0.2em',
              color: '#7F77DD',
              display: 'block',
              marginBottom: 12,
            }}
          >
            SYSTEM TOPOLOGY
          </span>
          <h2
            style={{
              fontFamily: 'Outfit',
              fontWeight: 800,
              fontSize: 'clamp(28px, 4vw, 44px)',
              color: '#E8E6FF',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            5-Layer Enterprise{' '}
            <span style={{ color: '#7F77DD' }}>n8n Standard</span>
          </h2>
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: 15,
              color: 'rgba(232,230,255,0.45)',
              marginTop: 12,
            }}
          >
            Every system is audited and built against this rubric. L4 Adaptive Autonomy confirmed.
          </p>
        </div>

        {/* Layer cards */}
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}
        >
          {METRICS.map(m => (
            <div
              key={m.label}
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Outfit',
                  fontWeight: 800,
                  fontSize: 36,
                  color: m.color,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {m.value}
              </div>
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: 12,
                  color: 'rgba(232,230,255,0.4)',
                  letterSpacing: '0.02em',
                }}
              >
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

function ProjectShowcase({ activeFilter, setActiveFilter }) {
  const isMobile = useMobile()
  const filteredProjects = activeFilter === 'All' 
    ? PROJECTS 
    : PROJECTS.filter(p => p.layer.startsWith(activeFilter))

  const filters = ['All', 'L1', 'L2', 'L3', 'L4', 'L5']

  return (
    <section id="projects" style={{ padding: '100px 24px', background: '#07070F', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ fontFamily: 'Space Mono', fontSize: 10, letterSpacing: '0.2em', color: '#1D9E75', display: 'block', marginBottom: 12 }}>
            INTELLIGENCE SHOWCASE
          </span>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', color: '#E8E6FF', letterSpacing: '-0.02em', marginBottom: 32 }}>
            Production <span style={{ color: '#1D9E75' }}>Automations</span>
          </h2>
          
          {/* Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  fontFamily: 'Space Mono',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '8px 20px',
                  borderRadius: 30,
                  border: '1px solid',
                  borderColor: activeFilter === f ? '#1D9E75' : 'rgba(255,255,255,0.1)',
                  background: activeFilter === f ? 'rgba(29, 158, 117, 0.1)' : 'transparent',
                  color: activeFilter === f ? '#1D9E75' : 'rgba(232,230,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.1em'
                }}
              >
                {f === 'All' ? 'ALL PROJECTS' : `${f} LAYER`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', 
          gap: 32 
        }}>
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="glass-card animate-fade-up"
              style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.06)', 
                borderRadius: 20, 
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* ROI Badge */}
              <div style={{ 
                position: 'absolute', 
                top: 24, 
                right: 24, 
                zIndex: 2,
                background: 'rgba(29, 158, 117, 0.15)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(29, 158, 117, 0.3)',
                padding: '4px 12px',
                borderRadius: 20,
                fontFamily: 'Space Mono',
                fontSize: 9,
                fontWeight: 700,
                color: '#1D9E75'
              }}>
                {project.roi}
              </div>

              {/* Media Container (Video or Package Badge) */}
              <div 
                style={{ 
                  width: '100%', 
                  aspectRatio: '9/16', 
                  background: 'rgba(0,0,0,0.5)', 
                  borderRadius: 12, 
                  marginBottom: 24,
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {project.isPackage ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ width: 64, height: 64, background: 'rgba(216, 90, 48, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(216, 90, 48, 0.3)' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D85A30" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                    </div>
                    <div style={{ fontFamily: 'Space Mono', fontSize: 12, fontWeight: 700, color: '#D85A30', marginBottom: 8 }}>NPM PACKAGE</div>
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(232,230,255,0.4)', textDecoration: 'underline' }}
                    >
                      VIEW ON REGISTRY ↗
                    </a>
                  </div>
                ) : (
                  <iframe
                    src={`${project.videoUrl}embed/`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    allowTransparency="true"
                    allow="encrypted-media"
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%',
                      pointerEvents: 'auto'
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#1D9E75', marginBottom: 4, letterSpacing: '0.1em' }}>{project.layer}</div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 20, color: '#E8E6FF', marginBottom: 16 }}>{project.title}</h3>
                
                <ul style={{ padding: 0, listStyle: 'none', marginBottom: 24 }}>
                  {project.bullets.map((b, i) => (
                    <li key={i} style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(232,230,255,0.5)', marginBottom: 10, display: 'flex', gap: 8, lineHeight: 1.5 }}>
                      <span style={{ color: '#1D9E75' }}>▹</span> {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a 
                  href={project.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    fontFamily: 'Space Mono', 
                    fontSize: 10, 
                    color: 'rgba(232,230,255,0.4)', 
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onMouseEnter={e => e.target.style.color = '#1D9E75'}
                  onMouseLeave={e => e.target.style.color = 'rgba(232,230,255,0.4)'}
                >
                  SOURCE CODE <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CONTACT / NATIVE INTAKE FORM ──────────────────────────────────────────────

const FORM_FIELDS = [
  { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'e.g., Pandian K S', required: true },
  { name: 'email', label: 'Professional Email', type: 'email', placeholder: 'e.g., you@company.com', required: true },
  { name: 'company', label: 'Company / Agency Name', type: 'text', placeholder: 'e.g., Acme Corp', required: false },
  { name: 'budget', label: 'Budget Range', type: 'text', placeholder: 'e.g., ₹50k – ₹1L, Enterprise', required: false },
  { name: 'projectType', label: 'Project Type', type: 'select', required: true,
    options: ['Select one…', 'Automation', 'AI Pipeline', 'Consulting', 'Custom n8n Node', 'Other'] },
  { name: 'timeline', label: 'Estimated Timeline', type: 'select', required: false,
    options: ['Select one…', 'ASAP', '1-2 Months', '3-6 Months', 'Just Exploring'] },
  { name: 'maturity', label: 'AI Maturity Level', type: 'select', required: true,
    options: ['Select your current level…', 'L1 — No automation yet', 'L2 — Basic scripts / Zapier', 'L3 — Structured workflows (n8n / Make)', 'L4 — Adaptive autonomous systems', 'L5 — Full self-optimizing infrastructure'] },
  { name: 'techStack', label: 'Current Tech Stack', type: 'textarea', placeholder: 'e.g., n8n, Supabase, OpenAI, Make.com', required: false },
  { name: 'goal', label: 'Primary Goal of the Project', type: 'textarea', placeholder: 'Describe what you want to achieve in 1-2 sentences', required: true },
  { name: 'hasN8n', label: 'Do you have an existing n8n instance?', type: 'select', required: true,
    options: ['Select…', 'Yes', 'No'] },
]

const labelStyle = {
  display: 'block',
  fontFamily: 'Space Mono',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'rgba(232,230,255,0.6)',
  marginBottom: 6,
  textAlign: 'left',
}

const inputStyle = {
  width: '100%',
  fontFamily: 'Inter',
  fontSize: 14,
  color: '#E8E6FF',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(127, 119, 221, 0.2)',
  borderRadius: 8,
  padding: '12px 14px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
}

const inputFocusHandler = e => {
  e.target.style.borderColor = '#1D9E75'
  e.target.style.boxShadow = '0 0 0 2px rgba(29,158,117,0.15)'
}
const inputBlurHandler = e => {
  e.target.style.borderColor = 'rgba(127, 119, 221, 0.2)'
  e.target.style.boxShadow = 'none'
}

function Contact() {
  const [formData, setFormData] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('sending')
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'pandian-ai.com',
          submittedAt: new Date().toISOString(),
        }),
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" style={{ padding: '100px 24px', background: '#07070F' }}>
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          borderRadius: 20,
          padding: 'clamp(32px, 6vw, 56px) clamp(20px, 5vw, 40px)',
          background: 'rgba(127, 119, 221, 0.04)',
          border: '1px solid rgba(127, 119, 221, 0.15)',
          backdropFilter: 'blur(12px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative orb */}
        <div
          style={{
            position: 'absolute',
            width: 300, height: 300,
            borderRadius: '50%',
            background: 'rgba(127, 119, 221, 0.06)',
            filter: 'blur(60px)',
            top: -80, right: -60,
            pointerEvents: 'none',
          }}
        />

        <div style={{ textAlign: 'center', marginBottom: 36, position: 'relative' }}>
          <span
            style={{
              fontFamily: 'Space Mono',
              fontSize: 10,
              letterSpacing: '0.2em',
              color: '#1D9E75',
              display: 'block',
              marginBottom: 16,
            }}
          >
            ◈ LAYER 1 INTAKE — OPEN
          </span>
          <h2
            style={{
              fontFamily: 'Outfit',
              fontWeight: 800,
              fontSize: 'clamp(24px, 4vw, 34px)',
              color: '#E8E6FF',
              letterSpacing: '-0.02em',
              marginBottom: 12,
            }}
          >
            Start a Project
          </h2>
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: 14,
              color: 'rgba(232,230,255,0.4)',
              lineHeight: 1.6,
            }}
          >
            Every engagement starts with the Perception Layer — structured intake that routes
            directly into the n8n pipeline.
          </p>
        </div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '48px 0', position: 'relative' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 24, color: '#1D9E75', marginBottom: 8 }}>
              Signal Received
            </h3>
            <p style={{ fontFamily: 'Inter', fontSize: 14, color: 'rgba(232,230,255,0.5)', lineHeight: 1.6 }}>
              Your project intake is now being processed by the Perception Layer.<br />
              We will reach out within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
            <div style={{ display: 'grid', gap: 20 }}>
              {FORM_FIELDS.map(field => (
                <div key={field.name}>
                  <label style={labelStyle}>
                    {field.label}
                    {field.required && <span style={{ color: '#1D9E75', marginLeft: 4 }}>*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={e => handleChange(field.name, e.target.value)}
                      onFocus={inputFocusHandler}
                      onBlur={inputBlurHandler}
                      style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                    >
                      {field.options.map(opt => (
                        <option key={opt} value={opt.startsWith('Select') ? '' : opt} disabled={opt.startsWith('Select')}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      required={field.required}
                      placeholder={field.placeholder}
                      rows={3}
                      value={formData[field.name] || ''}
                      onChange={e => handleChange(field.name, e.target.value)}
                      onFocus={inputFocusHandler}
                      onBlur={inputBlurHandler}
                      style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                    />
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={e => handleChange(field.name, e.target.value)}
                      onFocus={inputFocusHandler}
                      onBlur={inputBlurHandler}
                      style={inputStyle}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              style={{
                width: '100%',
                marginTop: 32,
                fontFamily: 'Space Mono',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#07070F',
                background: status === 'sending'
                  ? 'rgba(127, 119, 221, 0.3)'
                  : 'linear-gradient(135deg, #7F77DD, #1D9E75)',
                padding: '16px 32px',
                borderRadius: 8,
                border: 'none',
                cursor: status === 'sending' ? 'wait' : 'pointer',
                transition: 'opacity 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { if (status !== 'sending') { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {status === 'sending' ? 'TRANSMITTING…' : 'SUBMIT PROJECT INTAKE →'}
            </button>

            {status === 'error' && (
              <p style={{ fontFamily: 'Inter', fontSize: 13, color: '#E85A5A', textAlign: 'center', marginTop: 12 }}>
                Transmission failed. Please email us directly.
              </p>
            )}

            <p style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'rgba(232,230,255,0.25)', letterSpacing: '0.08em', textAlign: 'center', marginTop: 20 }}>
              OR REACH OUT DIRECTLY:{' '}
              <a href="mailto:hello@pandian-ai.com" style={{ color: '#1D9E75', textDecoration: 'none' }}>
                hello@pandian-ai.com
              </a>
            </p>
          </form>
        )}
      </div>
    </section>
  )
}

// ── FOOTER ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 24px',
        background: '#07070F',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 14, color: 'rgba(232,230,255,0.4)', letterSpacing: '-0.01em' }}>
          pandian-ai.com
        </span>
        <span style={{ fontFamily: 'Space Mono', fontSize: 10, color: 'rgba(232,230,255,0.2)', letterSpacing: '0.1em' }}>
          BUILT ON ENTERPRISE N8N ARCHITECTURE · KSPANDIAN32
        </span>
        <a
          href="https://www.npmjs.com/package/n8n-nodes-gemini-pdf-analyzer"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#D85A30', textDecoration: 'none', letterSpacing: '0.08em' }}
        >
          NPM ↗
        </a>
      </div>
    </footer>
  )
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activeFilter, setActiveFilter] = useState('All')

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Architecture setActiveFilter={setActiveFilter} />
        <Metrics />
        <ProjectShowcase activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
