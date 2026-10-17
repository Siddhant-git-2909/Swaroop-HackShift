# DECISIONS.md — SWAROOP Architecture Log

### ADR-01: In-Memory / SQLite High Fidelity Demo Store Fallback
- **Context**: Docker Desktop daemon was not running on the local Windows environment during initial development.
- **Decision**: Implemented an in-memory high-fidelity data store with seed data, haversine distance matching, trust recomputation, and atomic status transitions, with full compatibility for PostgreSQL via `DATABASE_URL` when active.
- **Rationale**: Ensures the demo runs seamlessly out of the box with zero setup hurdles or database connection crashes.

### ADR-02: Grounded Skill Extraction over Free-Form LLM Prompting
- **Context**: Risk of AI hallucinating certificates, qualifications, or exaggerated years of experience.
- **Decision**: Implemented strict grounding against `SKILLS_TAXONOMY` and `AREAS` in `server/app/shared/ai/extractor.py`. Any unstated trade or unmentioned metric is dropped or kept null.
- **Rationale**: Upholds the project rule: "AI never invents".

### ADR-03: Separation of Identity vs Skill Trust
- **Context**: Informal workers often lack conventional ID documents or credit scores.
- **Decision**: Identity verification status is kept separate from skill level. Level 3 depends strictly on physical craftsmanship assessment, not credit rating or identity badges.
- **Rationale**: Aligns with the core mission: "Resume nahi, hunar hai."
