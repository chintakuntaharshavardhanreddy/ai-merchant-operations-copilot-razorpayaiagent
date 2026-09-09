# Payment Dispute & Chargeback Management Framework

## 1. Dispute Stages & SLA Windows

| Dispute Stage | Definition | Merchant Action Window | Required Evidence |
| :--- | :--- | :--- | :--- |
| **Retrieval Request** | Cardholder requests transaction clarification | 7 Days | Invoice, delivery proof, IP address log |
| **First Chargeback** | Formal reversal issued by card network | 5 Days | Proof of service fulfillment, signed POD, OTP verification logs |
| **Pre-Arbitration** | Customer rejects merchant rebuttal evidence | 3 Days | Executive dispute committee review |
| **Arbitration** | Final decision escalated to Visa/Mastercard | 48 Hours | Binding card network verdict (fees: $500 if lost) |

## 2. Chargeback Threshold Rules & Penalties

- **Monitoring Threshold**: If the monthly dispute ratio exceeds **0.65%** of total transaction volume, the merchant account enters provisional warning status.
- **Excessive Chargeback Program**: Accounts exceeding **0.90%** face gateway penalties, increased MDR (+0.50%), and potential merchant account termination.

## 3. Recommended Operational Actions for Disputes

1. **Auto-accept low value disputes (< ₹500)**: Defending low ticket transactions incurs operational costs that exceed the recovery amount.
2. **Prioritize high-value fraud chargebacks**: Compile server session telemetry, IP geolocations, and 3DS authentication tokens within 48 hours.
