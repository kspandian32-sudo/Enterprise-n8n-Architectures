// ─────────────────────────────────────────────────────────────────────────────
//  REPLACE the entire Contact() function in src/App.jsx with this.
//  Also remove any <script src="https://tally.so/widgets/embed.js"> from index.html.
//  The script is loaded here, after React has mounted, via useEffect.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'

// ── TALLY FORM ID ─────────────────────────────────────────────────────────────
// Replace this with your real Tally form ID from the form's share URL.
// Example: if your form URL is https://tally.so/r/wkBqzP → FORM_ID = 'wkBqzP'
const TALLY_FORM_ID = 'YOUR_FORM_ID'

// ── HOOK: loads Tally script once, after React renders ────────────────────────
// Place this hook call at the TOP of your App() component so it runs globally.
//
//   export default function App() {
//     useTally()          ← add this line
//     return ( ... )
//   }
//
export function useTally() {
  useEffect(() => {
    // Guard: don't double-load
    if (document.getElementById('tally-script')) {
      // Script already in DOM. If Tally object exists, tell it to rescan.
      if (window.Tally) window.Tally.loadEmbeds()
      return
    }

    const script = document.createElement('script')
    script.id   = 'tally-script'
    script.src  = 'https://tally.so/widgets/embed.js'
    script.async = true

    // After load: tell Tally to scan the now-rendered DOM
    script.onload = () => {
      if (window.Tally) window.Tally.loadEmbeds()
    }

    document.head.appendChild(script)

    // Cleanup: remove script if the app fully unmounts (SPA teardown)
    return () => {
      const s = document.getElementById('tally-script')
      if (s) s.remove()
    }
  }, []) // Empty deps → runs once on mount, never again
}

// ── CONTACT SECTION ───────────────────────────────────────────────────────────
export function Contact() {
  // The button uses window.Tally.openPopup() directly in onClick.
  // This is the SAFE pattern: it bypasses Tally's DOM scan entirely.
  // Even if Tally's loadEmbeds() missed the button, this always works
  // because it calls the API directly rather than relying on attribute parsing.
  const openTally = () => {
    if (window.Tally) {
      window.Tally.openPopup(TALLY_FORM_ID, {
        emoji: { text: '👋', animation: 'wave' },
        autoClose: 3000,
        onSubmit: (payload) => {
          // Optional: handle submission event client-side
          console.log('Tally form submitted', payload)
        },
      })
    } else {
      // Fallback if script hasn't loaded yet (very slow connections)
      window.open(`https://tally.so/r/${TALLY_FORM_ID}`, '_blank', 'noopener')
    }
  }

  return (
    <section id="contact" style={{ padding: '100px 24px', background: '#07070F' }}>
      <div
        style={{
          maxWidth: 700,
          margin: '0 auto',
          textAlign: 'center',
          borderRadius: 20,
          padding: '64px 48px',
          background: 'rgba(127, 119, 221, 0.04)',
          border: '1px solid rgba(127, 119, 221, 0.15)',
          backdropFilter: 'blur(12px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
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
            fontFamily: 'Syne',
            fontWeight: 800,
            fontSize: 'clamp(24px, 4vw, 38px)',
            color: '#E8E6FF',
            letterSpacing: '-0.02em',
            marginBottom: 16,
            position: 'relative',
          }}
        >
          Ready to build autonomous infrastructure?
        </h2>

        <p
          style={{
            fontFamily: 'Inter',
            fontSize: 15,
            color: 'rgba(232,230,255,0.45)',
            lineHeight: 1.65,
            marginBottom: 36,
            position: 'relative',
          }}
        >
          Every engagement starts with the Perception Layer — a structured intake that routes
          directly into the n8n pipeline. No back-and-forth. Just signal and execution.
        </p>

        {/*
          onClick calls window.Tally.openPopup() directly.
          NO data-tally-open attribute needed. This is intentional.
          data-tally-open relies on Tally's DOM scan, which is unreliable
          in a React SPA where components mount after script load.
        */}
        <button
          onClick={openTally}
          style={{
            display: 'inline-block',
            fontFamily: 'Space Mono',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#07070F',
            background: 'linear-gradient(135deg, #7F77DD, #1D9E75)',
            padding: '14px 32px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            marginBottom: 28,
            transition: 'opacity 0.2s, transform 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          START A PROJECT →
        </button>

        <p style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'rgba(232,230,255,0.3)', letterSpacing: '0.08em' }}>
          OR REACH OUT DIRECTLY:{' '}
          <a
            href="mailto:hello@pandian-ai.com"
            style={{ color: '#1D9E75', textDecoration: 'none' }}
          >
            hello@pandian-ai.com
          </a>
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  HOW TO APPLY THIS TO App.jsx
//
//  1. Delete the <script src="...tally.so/widgets/embed.js"> from index.html <head>.
//
//  2. In App.jsx, replace the Contact function with the one above.
//
//  3. Import useTally at the top of App.jsx:
//       import { useTally } from './Contact_TallyFixed'
//     or move the hook directly into App.jsx and call it inside App():
//       export default function App() {
//         useTally()
//         return ( <> <Navbar/> ... </> )
//       }
//
//  4. Set TALLY_FORM_ID to your real Tally form ID.
//     Find it in your Tally dashboard → Share → the ID in the URL.
//
//  WHY THIS WORKS
//  - useEffect fires AFTER React commits the DOM. Tally script is loaded at that
//    point, guaranteed. The DOM it scans is the live, fully-rendered React tree.
//  - window.Tally.openPopup() in onClick is a direct API call. It does not depend
//    on Tally having previously scanned and found a [data-tally-open] element.
//    This means the button works even if loadEmbeds() hasn't run yet.
//  - The fallback window.open() covers the rare edge case where embed.js fails
//    to load (network timeout, ad-blocker) so no lead is ever stranded.
// ─────────────────────────────────────────────────────────────────────────────
