# Hostinger Landing Page Launch Plan: pandian-ai.com

## Phase 1: Design & Assets
- **Style:** Modern, dark-themed, glassmorphism.
- **Tools:** Vite, Tailwind CSS.
- **Objective:** Create a visual "Command Center" for the Enterprise n8n Architecture.

## Phase 2: Local Development
- Initialize a Vite project.
- Implement the 5-layer architecture visualization.
- Optimize for performance and SEO.

## Phase 3: Preparation for Deployment
- Bundle the project using `npm run build`.
- Verify the `dist` folder contents.

## Phase 4: Domain & Hosting Setup (Hostinger)
- Target Domain: `pandian-ai.com`
- Access hPanel -> File Manager.

## Phase 5: Live Launch
- Delete any default files (`default.php`, `index.php`, placeholder pages).
- Upload the `index.html` and `assets/` folder.
- Enable SSL (Let's Encrypt) via hPanel.

## Phase 6: Post-Launch Automation
- **Contact Email:** `hello@pandian-ai.com`
- **Lead Capture:** Integrate a Tally.so form.
- **Workflow:** Tally -> n8n Webhook -> Google Sheets -> Gmail Auto-reply (from `hello@pandian-ai.com`).
- **Result:** Fully automated lead pipeline on custom infrastructure.
