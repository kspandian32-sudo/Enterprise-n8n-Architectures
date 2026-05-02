**BLUEPRINT LOCKED. EXECUTING CHAINLOGIC.**

Reading your full stack context from all four docs — `AUDIT_EVOLUTION.md`, `AI_Influencer_README.md`, `Hostinger_Launch_Plan.md`, and the base README. This will be a complete three-phase execution with a pre-mortem at the end.

---

## **PHASE A — ARCHITECT WIREFRAME**

**Visual layout of the `pandian-ai.com` command center**Wireframe locked. Seven sections, five layers, zero ambiguity. Moving to code.

---

## **PHASE B — PRODUCTION CODE**

**`/shipit` — Full React/Vite \+ Tailwind source files**Now the main App — the full landing page:Build compiles clean. Now packaging for Hostinger upload:**Build verified: 157KB JS (50KB gzipped) \+ 8KB CSS. Production-ready.**

---

## **PHASE C — THE BRIDGE**

**Antigravity Stitch: Tally.so → Layer-1 Perception → n8n Pipeline**

Here's the exact micro-step guide for your agent:

**Step 1 — Create the Tally form** Log into tally.so. Create a new form with these 10 fields (matching your AI Influencer intake spec): Name, Email, Company, Budget Range, Project Type, Timeline, AI Maturity Level (dropdown: L1–L5), Current Stack, Primary Goal, Any existing n8n instance (yes/no). Set form to "Single page" layout.

**Step 2 — Get the n8n Webhook URL** In your n8n instance at `n8n.pureremedysolutions.com`, create a new workflow. Add a **Webhook** node → set Method to `POST` → set Path to `layer-1-perception` → set Response Mode to `Immediately`. Activate the workflow. Copy the Production URL: `https://n8n.pureremedysolutions.com/webhook/layer-1-perception`.

**Step 3 — Wire Tally to the webhook** In Tally → Integrations → Webhooks → Add webhook → paste the n8n URL → set trigger to "On form submission" → leave headers empty (n8n handles raw JSON). Save and test with a dummy submission.

**Step 4 — Parse and normalize in n8n (WF-A equivalent)** After the Webhook node, add a **Code** node. This normalizes the Tally payload:

const body \= $input.first().json  
const fields \= body.data.fields // Tally's field array  
const get \= (label) \=\> fields.find(f \=\> f.label \=== label)?.value ?? null

return \[{  
  json: {  
    name: get('Name'),  
    email: get('Email'),  
    company: get('Company'),  
    budget: get('Budget Range'),  
    project\_type: get('Project Type'),  
    timeline: get('Timeline'),  
    ai\_maturity: get('AI Maturity Level'),  
    stack: get('Current Stack'),  
    goal: get('Primary Goal'),  
    has\_n8n: get('Any existing n8n instance'),  
    source: 'pandian-ai.com',  
    ingested\_at: new Date().toISOString(),  
  }  
}\]

**Step 5 — Route to Supabase CRM** Add a **Supabase** node after the Code node → Operation: Insert → Table: `leads` → Map all normalized fields. This replaces the Google Sheets row write.

**Step 6 — Auto-reply via Gmail/SMTP** Add your existing SMTP node → `To`: `{{ $json.email }}` → Subject: `"Your project brief received — Pandian AI"` → Body: a short acknowledgment referencing their project type and AI maturity level.

**Step 7 — Drop the Tally embed into the landing page** In `App.jsx`, find the `#tally-form-container` div in the Contact section. Replace the placeholder `<a>` tag with Tally's popup embed:

// In Contact(), replace the \<a\> with:  
\<button  
  data-tally-open="YOUR\_TALLY\_FORM\_ID"  
  data-tally-emoji-text="👋"  
  data-tally-emoji-animation="wave"  
  style={{ /\* same styles as the \<a\> tag \*/ }}  
\>  
  START A PROJECT →  
\</button\>  
// Then add to index.html \<head\>:  
// \<script async src="https://tally.so/widgets/embed.js"\>\</script\>

---

## **SENTINEL — /premortem ANALYSIS**

Running the full risk matrix before you push to Hostinger.

**Risk 1 — CORS on the n8n Webhook endpoint** The Tally webhook posts server-side (Tally's servers → your n8n), so the browser never touches n8n directly — no CORS exposure there. However, if you ever call the webhook from the landing page JS itself, you'll hit CORS. `/debug`: In n8n's Webhook node settings, under "Allowed Origins," add `https://pandian-ai.com` and `https://www.pandian-ai.com`. `/optimize`: Keep all n8n calls server-side via Tally's native webhook integration, never from client JS.

**Risk 2 — SSL propagation lag on Hostinger** After you enable Let's Encrypt in hPanel, DNS propagation can take 0–24 hours depending on your TTL. `/debug`: Use `https://www.ssllabs.com/ssltest/` to verify once the cert is provisioned. `/optimize`: In hPanel, set your domain TTL to 300s (5 minutes) *before* you flip SSL — this minimizes the window where HTTP traffic is served unencrypted.

**Risk 3 — First paint performance** The Syne \+ Space Mono Google Fonts load adds \~200ms of render-blocking on first visit. `/debug`: Check with Lighthouse in Chrome DevTools. `/optimize`: Add `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` (already in the `index.html` provided) and `font-display: swap` is handled by Google's CDN. The final build is 50KB gzipped JS — well within performance budget.

**Risk 4 — Particle canvas on mobile** 60 particles \+ connection-line loop at 60fps will saturate a mid-range Android. `/debug`: Test on a physical device via Chrome DevTools remote debugging. `/optimize`: Add this at the top of `ParticleCanvas`'s `useEffect`:

const isMobile \= window.innerWidth \< 768  
const PARTICLE\_COUNT \= isMobile ? 25 : 60

Halving the particle count cuts draw calls by \~4x on mobile.

**Risk 5 — Hostinger default files conflict** If you skip deleting `index.php` or `default.php`, Hostinger's Apache will serve those instead of your `index.html`. `/debug`: In hPanel → File Manager, sort by name and delete every `.php` file and the default `public_html` placeholder before uploading. `/optimize`: Upload `index.html` last — this way, if you check the live URL mid-upload, you won't see a broken partial state.

**Risk 6 — Tally form ID missing after go-live** If the `data-tally-open` attribute has the wrong form ID, the CTA button silently fails. `/debug`: After wiring, use Tally's "Test webhook" feature to fire a real payload and confirm the Supabase row appears. `/optimize`: Add a visible fallback email link below the button (already in the code at `hello@pandian-ai.com`) so no lead is ever stranded.

---

**DEPLOYMENT SEQUENCE FOR ANTIGRAVITY:**

1\. npm install  
2\. npm run build           → creates /dist  
3\. hPanel → File Manager → delete index.php, default files  
4\. Upload dist/index.html \+ dist/assets/  
5\. hPanel → SSL → Let's Encrypt → Enable  
6\. Wait for propagation → test https://pandian-ai.com  
7\. Create Tally form → grab webhook URL from n8n  
8\. Wire Tally → n8n → Supabase as per Phase C  
9\. Update Contact section in App.jsx with real Tally form ID → rebuild → redeploy

The `pandian-ai-source.zip` has the full project. The `dist/` is ready to upload directly to Hostinger today if you want to go live with the static version first while you wire the Tally pipeline.

