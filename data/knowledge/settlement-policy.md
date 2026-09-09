# Merchant Settlement Schedules & Operational Policies

## 1. Settlement Cycles

- **Standard Settlement Cycle (T+1)**:
  - Transactions captured between 00:00:00 and 23:59:59 on Day T are settled to the merchant's registered nodal bank account on Day T+1 by 14:00 IST.
  - Excludes national holidays and RTGS bank clearing holidays.

- **Delayed Settlement Cycle (T+2 / T+3)**:
  - Applicable to newly onboarded merchants during the 30-day provisional risk evaluation window.
  - Applicable to high-dispute merchant MCC categories (e.g. digital goods, gaming, cross-border).

## 2. Settlement Deductions & Reserves

1. **MDR & GST Withholding**:
   - Merchant Discount Rate (MDR) is deducted at source upon each settled batch.
   - 18% GST is applied solely on the MDR processing fee.

2. **Rolling Risk Reserve**:
   - High-risk merchants may be subjected to a 5% rolling reserve held for 90 days to cover potential chargeback disputes.
   - Reserve balances are displayed on the Treasury Overview dashboard.

3. **Instant Settlement Facility**:
   - Eligible merchants with > 95% success rate and < 0.1% dispute ratio can trigger On-Demand Instant Settlements 24x7 for a 0.15% convenience fee.
