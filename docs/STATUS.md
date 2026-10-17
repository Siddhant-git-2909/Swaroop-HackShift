# STATUS.md — SWAROOP Features & Integrity Status

## Feature Matrix

| Feature | Category | Implementation Status | Notes |
|---|---|---|---|
| Responsive Landing & Dashboard | UI / Core | **BUILT** | Mobile-first responsive UI with demo shortcuts |
| Voice & Text Worker Onboarding | AI / Input | **BUILT** | Speech-to-profile with grounded taxonomy extraction (no hallucination) |
| Skill Passport & Profile | Core | **BUILT** | Public shareable `/w/:slug`, QR modal, skills, evidence, privacy-protected |
| Trust Ladder (L1 / L2 / L3) | Trust Engine | **BUILT** | L1 Self-declared, L2 Evidence added, L3 Independently verified |
| Work Evidence & AI-assisted check | Evidence | **BUILT** | Work photos gallery, AI consistency scoring, transparent labels |
| Customer Discovery & Search | Matching | **BUILT** | Category pills, Delhi NCR areas, explainable matching breakdown (0-100) |
| Service Request & Booking Lifecycle | Core | **BUILT** | Requested → Quoted → Accepted → In Progress → Work Done → Completed |
| Itemised Quotations Workflow | Billing | **BUILT** | Worker sends line items, customer approves before job start |
| Booking-linked Reviews | Reputation | **BUILT** | 1-5 star ratings with testimonials, updates claim confirmation |
| Sewa Kendra Facilitator Portal | Credibility | **BUILT** | Human-in-the-loop in-person assessment certifying workers to Level 3 |
| Demo Reset & Seed Data | Ops | **BUILT** | Instant 1-click restore of Delhi NCR workers, areas, bookings |
| OTP Login (Phone verification) | Auth | **SIMULATED** | Demo OTP `123456`, clearly labelled with `SIMULATED` badge |
| Identity Check | Trust | **SIMULATED** | No government ID collected or stored |
| Real Telephony & WhatsApp Bot | Communication | **ROADMAP** | Planned for post-hackathon pilot |
| Real UPI Escrow & Payouts | Payments | **ROADMAP** | Planned for financial partner integration |

## Truthful Trust Ladder Guarantee
- **Level 1 (Self-declared)**: Granted upon worker profile confirmation.
- **Level 2 (Evidence added)**: Granted when at least 1 job photo is attached and verified via AI-assisted consistency check.
- **Level 3 (Independently verified)**: Strictly granted ONLY via in-person assessment by an authorized human facilitator at a Sewa Kendra. Automated AI output can NEVER award Level 3.
