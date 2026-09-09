# AI Merchant Operations Copilot

> **AI-powered intelligence for modern payment operations.**

A production-quality Next.js platform designed for merchant and payment operations teams. Unlike generic conversational chatbots, the **AI Merchant Operations Copilot** deeply integrates autonomous AI reasoning into mission-critical payment workflows: investigating failed transactions, analyzing revenue velocity, performing RAG lookups across internal operational policies, and proposing audited operational actions with mandatory human approval.

---

## 🏛 System Architecture

```text
Next.js UI (Dashboard, Copilot Workbench, Landing)
      ↓
Gemini AI Agent (Reasoning & Orchestration via @ai-sdk/google)
      ↓
Tool Calling Interface
 ┌────┼─────────────┐
 ↓    ↓             ↓
SQL  RAG         Actions
 ↓    ↓             ↓
Supabase          Audit Log
(pgvector)        (Human-in-the-loop)
 ↓
Payment Telemetry
```

- **Reasoning Core**: Google Gemini (`@ai-sdk/google`, `gemini-1.5-pro` / `gemini-2.0-flash`).
- **Data Layer**: PostgreSQL with `pgvector` hosted on Supabase for structured transaction logs and semantic knowledge chunks.
- **Human-in-the-Loop Safety**: Consequential actions (refund triggers, routing switches, customer notifications) require explicit operator approval before execution.

---

## 🚀 Current Phase: Foundation & UI Shell

This repository contains the **Phase 1 Project Foundation & UI Shell**:
- **Fintech Design Language**: Inspired by Apple and Razorpay—high information density, obsidian dark theme (`#090A0F`), subtle borders, status badges, and zero cartoon fluff.
- **Landing Page (`/`)**: Enterprise fintech product overview, value propositions, interactive architecture visual, and direct links to the console.
- **Merchant Dashboard (`/dashboard`)**:
  - Top navigation with real-time AI status: `● AI Online`
  - Sidebar navigation (Overview, Payments, Customers, Refunds, Disputes, Analytics, AI Copilot)
  - KPI metric cards (Total Revenue: ₹12.4L, Payment Success Rate: 94.2%, Failed Payments: 312, Revenue at Risk: ₹1.84L)
  - Revenue & Velocity Chart (Recharts area graph showing 24h settled vs. failed volume)
  - Payment Rail Health (UPI, Cards, Netbanking, Wallets with latency and status breakdown)
  - AI Insights (Realistic placeholder anomaly alerts with deep investigation triggers)
- **AI Copilot Workspace (`/copilot`)**:
  - Interactive chat interface with user/assistant threads, input box, loading animations, and empty state
  - Suggested operational questions (Revenue drop investigations, failed payment audits, refund policy lookups)
  - **AI Activity Panel**: Execution trace visualizer showing agent reasoning steps and `TOOLS USED`
  - **Agentic Action Card**: Interactive human-in-the-loop proposal card for customer recovery workflows
- **Architectural Placeholders**: Typed signatures for `lib/ai/`, `lib/db/`, `lib/rag/`, and `app/api/`.

---

## 📂 Project Structure

```text
ai-merchant-operations-copilot/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts         # Gemini streaming chat route (Phase 2)
│   │   ├── analytics/
│   │   │   └── route.ts         # Aggregated metric queries (Phase 2)
│   │   └── actions/
│   │       └── route.ts         # Action execution & audit logger (Phase 2)
│   ├── dashboard/
│   │   └── page.tsx             # Merchant Operations Dashboard
│   ├── copilot/
│   │   └── page.tsx             # Main AI Copilot Workbench
│   ├── layout.tsx               # Root dark layout & font configuration
│   ├── page.tsx                 # High-converting fintech Landing Page
│   └── globals.css              # Dark fintech styling & utility classes
│
├── components/
│   ├── dashboard/
│   │   ├── Header.tsx           # Top bar with ● AI Online status
│   │   ├── Sidebar.tsx          # Multi-rail operations sidebar
│   │   ├── KPISection.tsx       # 4 primary fintech KPI metric cards
│   │   ├── RevenueOverview.tsx  # Revenue velocity & timeframe toggles
│   │   ├── PaymentHealth.tsx    # UPI, Cards, Netbanking rail health
│   │   └── AIInsights.tsx       # Realistic anomaly & failure cards
│   ├── copilot/
│   │   ├── ChatInterface.tsx    # Message thread, input & loading states
│   │   ├── AIActivityPanel.tsx  # Execution trace & tools used panel
│   │   ├── AgenticActionCard.tsx# Human-in-the-loop action approval card
│   │   └── SuggestedQuestions.tsx# Quick-start operational prompts
│   ├── charts/
│   │   └── RevenueChart.tsx     # Recharts area graph
│   └── ui/
│       ├── Badge.tsx            # Status, rail & AI indicator badges
│       ├── Button.tsx           # Fintech button primitives
│       └── Card.tsx             # Obsidian card container
│
├── lib/
│   ├── ai/
│   │   ├── agent.ts             # Google Gemini model wrapper & types
│   │   ├── prompts.ts           # Merchant ops system prompts
│   │   └── tools.ts             # Tool schemas for Gemini function calling
│   ├── db/
│   │   ├── client.ts            # Supabase client factory
│   │   └── queries.ts           # Payment & metric query interfaces
│   └── rag/
│       ├── embeddings.ts        # Gemini vector embedding generator
│       ├── ingest.ts            # Markdown documentation chunker
│       └── search.ts            # pgvector semantic similarity search
│
├── data/
│   ├── payments.json            # Structured sample payment transactions
│   └── knowledge/
│       ├── payment-failures.md  # Gateway failure codes (U30, ZM, etc.)
│       ├── refund-policy.md     # Turnaround times & approval thresholds
│       ├── settlement-policy.md # T+1 / T+2 cycles & reserve guidelines
│       ├── disputes.md          # Chargeback lifecycle & defense rules
│       └── merchant-support.md  # Downtime escalation & recovery SOPs
│
├── .env.example
├── package.json
└── README.md
```

---

## 🛠 Getting Started

### 1. Prerequisites
- Node.js `v18+` or `v20+` (Tested on Node `v24.14.0`)
- npm `v10+`

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the required credentials:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
> Note: Only Google Gemini is supported. Never configure or use OpenAI keys.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page:
- Landing Page: `http://localhost:3000/`
- Operations Dashboard: `http://localhost:3000/dashboard`
- AI Copilot Workbench: `http://localhost:3000/copilot`

### 4. Production Build Verification
```bash
npm run build
```
Creates an optimized Turbopack production build with strict TypeScript type checking.

---

## 🔒 Security & Safety Controls
1. **Server-Side API Key Security**: `GEMINI_API_KEY` is strictly accessed in server environments (`lib/ai/` and `app/api/`) and is never exposed to client bundles.
2. **Human-in-the-Loop Approval**: Financial or operational mutations cannot execute autonomously. Proposed actions require manual review through `AgenticActionCard`.
3. **Audit Logging**: All approved or rejected actions record timestamps, operator IDs, and recovery metrics in the audit trail.
