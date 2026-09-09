# Merchant Support Standard Operating Procedures (SOP)

## 1. Gateway Downtime Escalation Matrix

When an automated alert flags a drop in payment success rate:

1. **Success Rate < 90% for 15 minutes**:
   - Copilot flags operational alert: `GATEWAY_LATENCY_SPIKE`.
   - Operations Lead reviews routing health and inspects downstream bank status feeds.
2. **Success Rate < 80% for 10 minutes**:
   - Trigger automated failover proposal to backup routing rail.
   - Requires 1-click human authorization on the Copilot Action Panel.
3. **Total Gateway Outage**:
   - Post merchant dashboard service banner and dynamically hide degraded payment methods from checkout page.

## 2. Customer Recovery Workflow

- Identify customers with 2+ failed attempts within the past 60 minutes.
- Filter out fraudulent attempts (velocity checks, high-risk BINs).
- For legitimate abandoned checkouts, propose dispatch of personalized recovery link via WhatsApp / SMS with 15-minute validity window.
- Log dispatch approval to `action_audit_log` with operator ID.
