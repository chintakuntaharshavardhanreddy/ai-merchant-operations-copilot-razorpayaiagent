# Payment Failure Root Cause & Gateway Response Classification

## 1. UPI Failure Classifications

### U30 — Gateway Timeout / No Response
- **Description**: The issuing bank's Core Banking Solution (CBS) failed to respond to the UPI switch within the 30-second timeout threshold.
- **Root Cause**: Bank downtime, elevated traffic spikes during sales, or network routing degradation.
- **Action**: Automatic failover to secondary merchant UPI VPA routing. Customer notification advising retry in 10 minutes or using Netbanking.

### ZM — Invalid MPIN / Auth Failure
- **Description**: User entered an incorrect UPI MPIN or exceeded daily PIN retry limit.
- **Root Cause**: User-input failure.
- **Action**: Direct customer to reset MPIN via bank app. Do not retry automatically.

### U19 — Transaction Frequency Limit Exceeded
- **Description**: Exceeded bank daily limit or NPCI velocity threshold (often 10 transactions/day or ₹1,00,000 max).
- **Action**: Prompt customer to switch to Netbanking or Credit Card payment rail.

---

## 2. Card Failure Classifications

### ERR_3DS_TIMEOUT / CHALLENGE_ABANDONED
- **Description**: Customer received the OTP challenge screen but failed to submit within 180 seconds or closed the checkout iframe.
- **Impact**: Accounts for 40% of card checkout abandonments.
- **Action**: Send instant WhatsApp recovery payment link with pre-filled card details or 1-click UPI checkout.

### ERR_INSUFFICIENT_FUNDS
- **Description**: Customer's account does not possess adequate credit limit or balance.
- **Action**: Recommend Split Pay or EMI alternatives if transaction value > ₹3,000.

### CARD_VELOCITY_EXCEEDED
- **Description**: Triggered by the fraud engine when > 3 attempts occur within 5 minutes on the same card hash.
- **Action**: Temporarily lock checkout attempt for 15 minutes to prevent merchant chargeback liability.
