# FoodShare AI Security Specification

## 1. Data Invariants
- Users can create their initial profile document matching their `request.auth.uid`.
- Users cannot change their UID or set `role: 'admin'` unless approved by an admin or existing admin rule.
- A Food Donation can only be created by an authenticated user where `donorId == request.auth.uid`.
- Crucial Safety Rule: `safetyVerificationCompleted == true` is required with human acknowledgment to ensure AI never certifies food safety autonomously.
- A donation in `available` status can be claimed/requested by an NGO user (`status` changes to `'requested'` with `requestedByNgoId` set to their UID). This prevents race conditions and multiple NGOs from accepting the same donation.
- A volunteer can accept transport assignment (`volunteerId` set to their UID, status changes to `'in_transit'`).
- Status transition to `'delivered'` can only be performed by the assigned volunteer, NGO, donor, or admin.
- Once `'delivered'` or `'cancelled'`, the terminal state is locked to prevent replay attacks (except admin overrides).
- Impact logs can only be created upon delivery verification.

## 2. The Dirty Dozen Adversarial Payloads
1. **Unauthenticated Write**: Creating a donation without authentication. (Denied)
2. **Identity Spoofing**: User A creating a donation with `donorId: 'user-b'`. (Denied)
3. **Role Escalation**: Regular donor updating their user document to `role: 'admin'`. (Denied)
4. **Safety Bypass**: Attempting to create a donation with `safetyVerificationCompleted: false`. (Denied)
5. **Double Claim Hijack**: NGO B attempting to overwrite `requestedByNgoId` when donation is already `'requested'` by NGO A. (Denied)
6. **Delivery Bypass**: Random user setting `status: 'delivered'` on someone else's donation. (Denied)
7. **Terminal State Mutation**: Attempting to revert a `'delivered'` donation back to `'available'`. (Denied)
8. **Junk ID / Buffer Overflow**: Writing document with a 500-character malicious path ID. (Denied)
9. **Ghost Field Injection**: Adding unmodeled malicious executable fields to a donation update. (Denied)
10. **Email Spoofing**: Attempting admin actions with non-verified email or arbitrary email string. (Denied)
11. **Direct Impact Log Tampering**: Creating impact logs without authorized relation. (Denied)
12. **PII Scraping**: Attempting blanket list query of private contact fields of all users. (Denied)
