# AI Merchant Operations Copilot

> An agentic fintech operations platform that detects payment and revenue-risk signals, investigates root causes using merchant telemetry and RAG, and prepares controlled operational workflows with human approval and an auditable action lifecycle.

**Live Demo:** https://ai-merchant-operations-copilot-razo.vercel.app

**Repository:** https://github.com/chintakuntaharshavardhanreddy/ai-merchant-operations-copilot-razorpayaiagent

---

## Overview

AI Merchant Operations Copilot is a production-deployed AI system designed to help merchant operations teams investigate payment issues, understand revenue risk, retrieve relevant operational policies, and prepare controlled actions.

Unlike a traditional dashboard that only displays metrics, or a generic chatbot that only generates text, the system connects:

**Telemetry → Analysis → Retrieval → Agent Reasoning → Action Preparation → Human Approval → Execution → Audit**

The project demonstrates how agentic AI can be integrated into financial operations while keeping actions bounded, explainable, and auditable.

---

## Problem

Merchant operations teams need to continuously investigate questions such as:

- Why did payment success decline?
- Which payment rail is experiencing problems?
- Which customers are repeatedly failing payments?
- How much revenue is potentially at risk?
- What is the likely root cause?
- What operational policy applies?
- What intervention should be considered?
- Which actions require human approval?

A dashboard can surface the problem, while a chatbot can explain it. The challenge is connecting the two into a reliable operational workflow.

This project combines merchant payment telemetry, operational knowledge, and an AI agent into a single system.

---

## Core Workflow

```text
                 MERCHANT OPERATIONS
                         │
                         ▼
                 ┌───────────────┐
                 │    Detect     │
                 │ Revenue Risk  │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │  Investigate  │
                 │   Telemetry   │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │   Retrieve    │
                 │    Policy     │
                 │     (RAG)     │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ Gemini Agent  │
                 │ Tool Calling  │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │  Recommend /  │
                 │ Prepare Action│
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │     Human     │
                 │    Approval   │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    Execute    │
                 │   + Audit     │
                 └───────────────┘
```

---

# Features

## 1. Merchant Operations Dashboard

The dashboard provides an operational overview of merchant payment health.

It surfaces:

- Gross payment volume
- Settled revenue
- Revenue change
- Payment failure volume
- Revenue at risk
- Payment-rail health
- Recent failed transactions
- Customer friction
- Refund activity
- AI-generated operational signals
- Recent agent actions

The dashboard is organized around the operational relationship:

**Incident → Evidence → Analysis → Action**

---

## 2. Payment Health Analysis

The system analyzes payment telemetry across multiple payment rails, including:

- UPI
- Cards
- Netbanking
- Wallets

It can identify:

- Success-rate degradation
- Failure concentration
- Failure reasons
- Volume concentration
- High-value failed transactions
- Payment-rail risk

The AI can use these analytics as evidence when investigating an operational issue.

---

## 3. Revenue Risk Detection

The system identifies potential revenue at risk by analyzing failed payments and repeated customer failures.

For the included synthetic merchant dataset, the system can surface signals such as:

- Failed payment volume
- Repeat-failure customers
- High-value payment failures
- Revenue potentially recoverable from repeated failures

Example synthetic telemetry signal:

```text
Settled revenue:       -69.1%
Attempted volume:       +6.4%
Recent UPI drops:          43
Failed volume:       ₹2,68,057
Repeat-failure customers: 33
Revenue at risk:     ₹7,98,749
```

These values come from synthetic project telemetry and do not represent real merchant activity.

---

# AI Copilot

The Copilot provides an agentic interface for merchant operations.

Instead of answering from language-model knowledge alone, the agent can gather evidence from application tools and retrieve relevant operational knowledge before producing an answer.

Example:

```text
Merchant:
"Why is revenue dropping?"

        ↓

Gemini Agent
        ↓
Get revenue trend
        ↓
Check payment health
        ↓
Analyze failed payments
        ↓
Identify affected customers
        ↓
Retrieve relevant operational policy
        ↓
Synthesize evidence
        ↓
Explain root cause
        ↓
Recommend intervention
```

---

# Agent Tools

The Gemini agent uses purpose-built tools rather than unrestricted database access.

### Read-only analytical tools

```text
get_dashboard_metrics
get_revenue_trend
get_payment_health
search_payments
analyze_failed_payments
find_repeated_failure_customers
get_refund_analytics
search_merchant_knowledge
```

These tools allow the agent to retrieve structured evidence from the application.

### Controlled action tools

```text
prepare_recovery_plan
prepare_support_case
prepare_refund
```

The action tools prepare bounded workflows rather than giving the model unrestricted access to financial systems.

---

# Retrieval-Augmented Generation

The system includes a RAG pipeline for merchant operational knowledge.

Knowledge sources cover:

- Payment failures
- Refund policies
- Settlement policies
- Disputes
- Merchant support

## RAG Pipeline

```text
Operational Documents
        │
        ▼
Document Chunking
        │
        ▼
Gemini Embeddings
        │
        ▼
Supabase pgvector
        │
        ▼
Similarity Search
        │
        ▼
Relevant Knowledge
        │
        ▼
Gemini Agent
        │
        ▼
Grounded Response
```

The embedding model used is:

```text
gemini-embedding-001
```

The vector store is implemented using PostgreSQL + `pgvector` through Supabase.

---

# Human-in-the-Loop Actions

Financial operations require stronger safeguards than ordinary conversational AI.

The agent therefore cannot silently execute an operational action.

Actions follow a controlled lifecycle:

```text
PENDING_APPROVAL
        │
        ├──────────────► REJECTED
        │
        ▼
    APPROVED
        │
        ▼
    EXECUTED
```

Supported action workflows include:

### Recovery Plan

The agent can prepare a recovery plan for customers experiencing repeated payment failures.

### Support Case

The agent can prepare a support case based on an identified payment issue.

### Refund

The agent can prepare a refund proposal containing:

- Payment ID
- Amount
- Reason
- Policy basis

The workflow requires explicit approval before execution.

---

# Security Architecture

The project treats agentic financial actions as privileged operations.

## No arbitrary SQL

The AI agent cannot generate and execute arbitrary SQL queries.

All data access occurs through predefined application tools.

## Human authorization

The agent can recommend and prepare an action, but approval is required before execution.

## Server-side privileged access

Supabase service-role access is restricted to server-side operations.

## Row-Level Security

Supabase RLS policies restrict unauthorized direct mutations.

## Atomic approval

Approval and execution use controlled PostgreSQL RPC workflows.

## Audit trail

Agent actions are persisted in the `agent_actions` table with their lifecycle state.

## API protection

Production APIs include:

- Rate limiting
- Sanitized error responses
- Server-side authorization
- Controlled action endpoints

---

# Data Model

The application uses PostgreSQL through Supabase.

```text
merchants
customers
payments
refunds
support_cases
agent_actions
documents
```

### Synthetic Dataset

The included dataset contains:

| Entity | Records |
|---|---:|
| Merchants | 1 |
| Customers | 120 |
| Payments | 550 |
| Refunds | 55 |
| RAG document chunks | 20 |

The synthetic payment data contains intentionally created operational patterns including:

- UPI authentication failures
- Timeout failures
- Network errors
- Repeat customer failures
- High-value failed payments
- Revenue degradation
- Refund activity

No real customer or payment data is used.

---

# Architecture

```text
                         ┌─────────────────────┐
                         │   Merchant Operator │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     Next.js UI      │
                         │                     │
                         │ Dashboard           │
                         │ Payments            │
                         │ Refunds             │
                         │ Customers           │
                         │ Copilot             │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Gemini Agent     │
                         │                     │
                         │ Tool Calling        │
                         │ Reasoning           │
                         │ Orchestration       │
                         └──────┬───────┬──────┘
                                │       │
                    ┌───────────┘       └───────────┐
                    ▼                               ▼
          ┌───────────────────┐           ┌───────────────────┐
          │ Analytics Tools   │           │ RAG Knowledge     │
          │                   │           │ Base              │
          │ Payments          │           │                   │
          │ Revenue           │           │ Payment Policies  │
          │ Failures          │           │ Refund Policies   │
          │ Customers         │           │ Settlement Policy │
          │ Refunds           │           │ Disputes          │
          └─────────┬─────────┘           └─────────┬─────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ Supabase PostgreSQL │
                         │                     │
                         │ Operational Data    │
                         │ pgvector            │
                         │ RLS                 │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Controlled Actions  │
                         │                     │
                         │ Approval            │
                         │ Execution           │
                         │ Audit Trail         │
                         └─────────────────────┘
```

---

# Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React

## AI

- Google Gemini
- Gemini tool calling
- Gemini embeddings
- Retrieval-Augmented Generation

## Backend

- Next.js API routes
- Supabase
- PostgreSQL
- pgvector
- PostgreSQL RPCs
- Row-Level Security

## Deployment

- Vercel

---

# Project Structure

```text
ai-merchant-operations-copilot/
│
├── app/
│   ├── dashboard/
│   ├── copilot/
│   └── api/
│       └── chat/
│
├── components/
│   ├── dashboard/
│   ├── copilot/
│   └── ui/
│
├── lib/
│   ├── ai/
│   │   ├── agent.ts
│   │   ├── prompts.ts
│   │   └── tools.ts
│   │
│   ├── db/
│   │   └── queries.ts
│   │
│   └── rag/
│       ├── embeddings.ts
│       ├── ingest.ts
│       └── search.ts
│
├── data/
│   └── knowledge/
│
├── supabase/
│   ├── base_tables.sql
│   ├── rag.sql
│   └── ...
│
└── scripts/
    └── ...
```

---

# Getting Started

## Prerequisites

- Node.js 20+
- npm
- Supabase project
- Google Gemini API key

---

## 1. Clone the repository

```bash
git clone https://github.com/chintakuntaharshavardhanreddy/ai-merchant-operations-copilot-razorpayaiagent.git

cd ai-merchant-operations-copilot
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create:

```text
.env.local
```

Add:

```env
GEMINI_API_KEY=your_gemini_api_key

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Never expose the Supabase service-role key or Gemini API key in client-side code.

---

## 4. Configure Supabase

Run the SQL migrations in the `supabase/` directory against your Supabase project.

This creates:

- Operational tables
- Indexes
- RLS policies
- Vector search infrastructure
- Agent action workflows
- Approval RPCs

---

## 5. Seed the database

Load the synthetic merchant dataset into Supabase.

The seed data creates the merchant, customers, payments, refunds, and operational patterns used by the dashboard and agent.

---

## 6. Ingest RAG knowledge

```bash
npm run rag:ingest
```

The ingestion pipeline:

1. Reads the operational knowledge documents.
2. Splits them into chunks.
3. Generates Gemini embeddings.
4. Stores vectors in Supabase.
5. Makes the knowledge available to the Copilot.

---

## 7. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Production Demo

### Dashboard

https://ai-merchant-operations-copilot-razo.vercel.app/dashboard

### Payments

https://ai-merchant-operations-copilot-razo.vercel.app/dashboard/payments

### Refunds

https://ai-merchant-operations-copilot-razo.vercel.app/dashboard/refunds

### Customers

https://ai-merchant-operations-copilot-razo.vercel.app/dashboard/customers

### AI Copilot

https://ai-merchant-operations-copilot-razo.vercel.app/copilot

---

# Example Copilot Queries

Try asking:

```text
Why is revenue dropping?
```

```text
What are today's failed payments?
```

```text
Which customers are repeatedly failing?
```

```text
Which payment rail is performing worst?
```

```text
How much revenue is at risk?
```

```text
What does the refund policy say?
```

```text
Find high-value failed payments above ₹10,000.
```

```text
What should we do about the repeated payment failures?
```

The agent selects the appropriate tools and retrieves supporting operational knowledge where required.

---

# Design Principles

The system is designed around several principles:

### Evidence before action

The agent gathers operational evidence before recommending an intervention.

### Bounded agency

Agents operate through explicitly defined tools rather than unrestricted system access.

### Human control

Financially meaningful actions require explicit approval.

### Explainability

Recommendations are grounded in telemetry and operational knowledge.

### Auditability

Actions and state transitions are persisted.

### Graceful failure

The system avoids silently executing actions when required information or authorization is unavailable.

---

# Testing & Verification

The project includes verification scripts for:

- Database integrity
- RAG retrieval
- Agent tool execution
- Action persistence
- Approval workflows
- Rejection workflows
- Security policies
- Unauthorized mutation attempts
- API behavior

The production application has also been tested for:

- Responsive layouts
- Copilot rendering
- Agent execution traces
- Historical telemetry windows
- RAG retrieval
- Action lifecycle behavior

---

# Why This Project

The project explores a practical question:

> **How can AI agents participate in financial operations without becoming unrestricted autonomous actors?**

The focus is therefore not only on generating an answer.

The system connects the complete operational loop:

```text
Evidence
   ↓
Reasoning
   ↓
Recommendation
   ↓
Authorization
   ↓
Execution
   ↓
Audit
```

This architecture provides a foundation for building AI systems that can assist with high-impact operational workflows while maintaining clear boundaries and human oversight.

---

# Disclaimer

This project uses **synthetic merchant and payment telemetry** for demonstration purposes.

It does not use real customer payment information.

Financial actions demonstrated by the application are controlled/simulated workflows intended to demonstrate agent orchestration, authorization, execution state, and auditing.

---

# Author

**Chintakunta Harsha Vardhan Reddy**

AI/ML Engineering Student

GitHub:  
https://github.com/chintakuntaharshavardhanreddy
