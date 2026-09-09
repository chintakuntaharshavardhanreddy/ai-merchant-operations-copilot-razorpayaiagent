# Merchant Refund Policy & SLA Guidelines

## 1. Refund Turnaround Time (TAT) by Payment Rail

| Payment Rail | Standard Refund TAT | Instant Refund Eligibility |
| :--- | :--- | :--- |
| **UPI** | 2–4 Hours | Yes (Real-time via IMPS/UPI API) |
| **Credit / Debit Cards** | 5–7 Working Days | Yes (Subject to gateway tokenization support) |
| **Netbanking** | 2–5 Working Days | No (Direct bank NEFT reconciliation) |
| **Wallets** | Instant (< 15 mins) | Yes |

## 2. Refund Processing Rules

1. **Full vs. Partial Refunds**:
   - Merchants can issue multiple partial refunds against a single captured transaction until the total settled amount is exhausted.
   - Gateway processing fees are non-refundable once the transaction is captured.

2. **Automated Refund Triggers**:
   - Payments in `late_authorized` status (customer debited after checkout session expiry) must be auto-refunded within 24 hours per RBI guidelines.
   - For failed fulfillment orders, refunds must be initiated via the refund API within 48 hours.

3. **Human Approval Thresholds**:
   - Any single refund exceeding ₹25,000 requires two-tier authorization from Finance Operations.
   - Cumulative daily refunds exceeding 5% of gross settled volume triggers an automated audit hold.
