# VoiceShield — Technical Decisions

## 1. Purpose

This document records the major technical decisions made for the VoiceShield project.

The purpose is to prevent architectural drift during implementation and ensure that all team members and development tools follow the same technical direction.

These decisions should be treated as the current project baseline unless explicitly changed and documented.

---

# 2. Architecture Decision

## Decision

VoiceShield will use a layered application architecture.

```text
Frontend
    ↓
FastAPI Backend
    ├── Supabase PostgreSQL
    ├── Supabase Storage
    └── ML Service
```

## Rationale

This separation keeps:

* User interface concerns in the frontend
* Application/API logic in FastAPI
* Persistent structured data in PostgreSQL
* Persistent audio files in Supabase Storage
* ML processing in the ML subsystem

The architecture also keeps the ML subsystem independent from the frontend.

---

# 3. Frontend Technology Decision

## Decision

The frontend will use:

```text
HTML5
CSS3
Bootstrap
JavaScript
```

## Rationale

This provides a straightforward web frontend while keeping the implementation lightweight and easy to maintain.

The project will not introduce React, Vue, Angular, or another frontend framework unless a future technical decision explicitly approves it.

---

# 4. Backend Technology Decision

## Decision

FastAPI will be used as the central application backend.

```text
Frontend
    ↓
FastAPI
```

## Rationale

FastAPI provides the API boundary between the frontend and backend services.

It is responsible for:

* API endpoints
* Request validation
* Application logic
* Authentication integration
* Authorization
* Database interaction
* Storage interaction
* ML orchestration

---

# 5. Database Decision

## Decision

VoiceShield will use **Supabase PostgreSQL** as its relational database.

```text
FastAPI
   ↓
Supabase PostgreSQL
```

## Rationale

PostgreSQL provides the relational structure required for application entities and their relationships.

Supabase provides the managed PostgreSQL infrastructure used by the project.

The database schema is defined separately in:

```text
docs/DATABASE_SCHEMA.md
```

---

# 6. Audio Storage Decision

## Decision

Persistent audio files will be stored using **Supabase Storage**.

```text
FastAPI
   ↓
Supabase Storage
```

Structured information about audio files will be stored in PostgreSQL.

## Rationale

Audio files are binary objects and should not be stored directly as large binary values inside the relational database.

The database stores the metadata and references required by the application.

---

# 7. Supabase Architecture Decision

## Decision

Supabase will provide two primary persistence components:

```text
Supabase
├── PostgreSQL
└── Storage
```

PostgreSQL is used for structured application data.

Storage is used for persistent audio files.

## Rationale

This provides a clear separation between structured records and binary audio objects while keeping both services within the selected Supabase infrastructure.

---

# 8. ML Architecture Decision

## Decision

ML functionality will remain a separate subsystem.

```text
FastAPI
   ↓
ML Service
```

The frontend will not directly communicate with the ML service.

## Rationale

This separates application/API responsibilities from machine-learning responsibilities.

It also allows the ML pipeline to be developed and evaluated independently.

---

# 9. ML Responsibility Decision

The ML subsystem is responsible for ML-related processing such as:

```text
Audio preprocessing
Feature / representation extraction
AI voice detection
Segment analysis
Speaker verification
ML result generation
```

The exact implementation must follow:

```text
docs/ML_SPECIFICATION.md
```

The backend remains responsible for orchestrating the application workflow.

---

# 10. API Contract Decision

## Decision

Frontend-backend communication will follow a documented API contract.

```text
Frontend
    ↓
API Contract
    ↓
FastAPI
```

The API contract is defined in:

```text
docs/API_CONTRACT.md
```

## Rule

Frontend implementation must not assume undocumented endpoint paths, request fields, response fields, or status values.

Changes to the API must be reflected in the API contract and affected implementations.

---

# 11. Authentication Decision

## Decision

Protected application functionality requires authentication.

The authentication mechanism must follow the established project architecture and API contract.

The frontend may manage the user-facing authentication flow, but authentication and authorization must not depend solely on frontend logic.

---

# 12. Authorization Decision

## Decision

Authorization will be enforced by the backend.

```text
Request
   ↓
Authentication
   ↓
Authorization
   ↓
Resource
```

## Rationale

Frontend controls cannot provide sufficient security.

A user must not be able to access another user's private resources simply by changing a resource identifier or manually sending an API request.

---

# 13. Frontend-to-Database Decision

## Decision

The frontend will not directly access the application's PostgreSQL database.

The intended path is:

```text
Frontend
    ↓
FastAPI
    ↓
Supabase PostgreSQL
```

## Rationale

FastAPI provides the application and authorization boundary.

---

# 14. Frontend-to-Storage Decision

## Decision

The standard application flow for persistent audio is:

```text
Frontend
    ↓
FastAPI
    ↓
Supabase Storage
```

The frontend must not receive or expose privileged storage credentials.

---

# 15. Frontend-to-ML Decision

## Decision

The frontend will not directly call the ML service.

The intended path is:

```text
Frontend
    ↓
FastAPI
    ↓
ML Service
```

## Rationale

This keeps ML service access behind the backend boundary.

---

# 16. Audio Processing Decision

## Decision

Audio must pass through backend validation before being processed by the ML subsystem.

```text
Audio
 ↓
FastAPI Validation
 ↓
ML Processing
```

Invalid or unsupported audio must not be passed into the ML pipeline.

---

# 17. Analysis Workflow Decision

The standard analysis workflow is:

```text
Audio Input
    ↓
FastAPI
    ↓
Validation
    ↓
Supabase Storage
    ↓
ML Analysis
    ↓
Analysis Result
    ↓
Supabase PostgreSQL
    ↓
Frontend
```

This is the baseline workflow for the standard audio-analysis feature.

---

# 18. Analysis State Decision

Analysis processing uses explicit application states.

The conceptual flow is:

```text
PENDING
   ↓
PROCESSING
   ↓
COMPLETED
```

or:

```text
PENDING
   ↓
PROCESSING
   ↓
FAILED
```

The exact persisted status values must remain consistent with:

```text
API_CONTRACT.md
DATABASE_SCHEMA.md
```

---

# 19. Result Integrity Decision

## Decision

ML results must come from actual ML/backend processing.

The application must never fabricate:

```text
Predictions
Confidence values
Risk levels
Speaker matches
Segment results
```

If ML processing fails, the system must report an appropriate failure state.

---

# 20. Deepfake Detection and Speaker Verification Decision

## Decision

Deepfake/synthetic-speech detection and speaker verification are separate capabilities.

```text
Deepfake Detection
        ≠
Speaker Verification
```

Deepfake detection evaluates whether speech appears synthetic or manipulated.

Speaker verification evaluates whether speech corresponds to a reference speaker.

The frontend should present these results separately.

---

# 21. Local Storage Decision

The repository contains:

```text
storage/
├── temp/
└── uploads/
```

These directories are intended for application/runtime storage where applicable.

They do not replace Supabase Storage as the project's persistent audio-storage system.

---

# 22. Temporary File Decision

Temporary processing files should not be retained indefinitely.

When temporary files are no longer required, they should be cleaned up according to the implementation.

Persistent user audio belongs in the defined persistent storage system.

---

# 23. Configuration and Secrets Decision

Sensitive configuration must be supplied through environment configuration.

Examples include:

```text
Database credentials
Supabase privileged credentials
Authentication secrets
ML service credentials
Deployment secrets
```

These values must not be hardcoded into application source code.

---

# 24. Git Security Decision

The Git repository may contain:

```text
Source code
Documentation
Configuration templates
Tests
Non-sensitive project assets
```

The repository must not contain:

```text
Passwords
API keys
Private tokens
Service-role credentials
Database passwords
Private user audio
Private user data
```

Sensitive environment files must be excluded using appropriate Git configuration.

---

# 25. Documentation Decision

The `docs/` directory acts as the project's documentation and design reference.

Important documents include:

```text
ARCHITECTURE.md
API_CONTRACT.md
DATABASE_SCHEMA.md
ML_SPECIFICATION.md
FRONTEND_SPECIFICATION.md
USER_FLOWS.md
FEATURES.md
SECURITY.md
PRIVACY.md
TECH_STACK.md
TESTING.md
DEMO_GUIDE.md
TECHNICAL_DECISIONS.md
```

Implementation should remain consistent with these documents.

---

# 26. Existing Folder Structure Decision

The established project structure should be preserved.

```text
VoiceShield/
├── backend/
├── database/
├── deployment/
├── docs/
├── frontend/
├── ml/
├── storage/
├── tests/
├── docker-compose.yml
└── README.md
```

Unnecessary restructuring should not be introduced.

---

# 27. Backend–ML Boundary Decision

The backend is responsible for ML orchestration.

The ML subsystem is responsible for ML computation.

Conceptually:

```text
FastAPI
   │
   ├── Prepare/request analysis
   │
   ▼
ML Service
   │
   ├── Process audio
   ├── Run inference
   └── Return structured result
   │
   ▼
FastAPI
```

Neither component should unnecessarily absorb the responsibilities of the other.

---

# 28. Testing Decision

Testing will be performed at multiple levels:

```text
Unit
 ↓
Integration
 ↓
API
 ↓
ML
 ↓
Frontend
 ↓
End-to-End
```

Testing requirements are defined in:

```text
docs/TESTING.md
```

---

# 29. Deployment Decision

The project contains deployment configuration under:

```text
deployment/
```

and Docker-related configuration:

```text
Dockerfile
docker-compose.yml
```

Deployment implementation must remain consistent with the established architecture.

No new deployment platform should be introduced as an architectural requirement without an explicit decision.

---

# 30. Security Decision

Security requirements are defined separately in:

```text
docs/SECURITY.md
```

Security decisions include:

* Server-side authorization
* Secret protection
* Protected user resources
* Secure storage access
* Input validation
* Controlled API access
* No exposure of privileged credentials

---

# 31. Privacy Decision

Privacy requirements are defined separately in:

```text
docs/PRIVACY.md
```

Audio and user-related information must be handled according to the documented privacy requirements.

---

# 32. Architecture Stability Rule

The following components are considered established:

```text
Frontend
    HTML + CSS + Bootstrap + JavaScript

Backend
    FastAPI

Database
    Supabase PostgreSQL

Persistent Audio Storage
    Supabase Storage

ML
    Separate ML subsystem
```

These should not be replaced or redesigned during normal implementation.

---

# 33. Change Management

A major technical change should be documented before implementation.

Examples:

```text
Changing frontend framework
Changing backend framework
Changing database
Changing persistent storage system
Changing ML architecture
Changing API contract
Changing authentication architecture
Changing deployment architecture
```

The change should identify:

```text
Current Decision
Proposed Change
Reason
Impact
Affected Documents
```

---

# 34. Conflict Resolution

If two project documents appear to conflict, do not silently invent a solution.

The conflict must be identified and resolved explicitly before implementation.

The relevant documentation should then be updated so that the project has one clear source of truth.

---

# 35. Implementation Rule

Development tools and developers must implement the documented architecture rather than redesigning the system independently.

The intended implementation boundary is:

```text
Frontend
    ↓
FastAPI
    ├── Supabase PostgreSQL
    ├── Supabase Storage
    └── ML Service
```

Any implementation that bypasses these boundaries requires an explicit technical decision.

---

# 36. Final Technical Decision

The current VoiceShield technical baseline is:

```text
                    VoiceShield
                         │
              ┌──────────┴──────────┐
              │                     │
          Frontend               FastAPI
              │                     │
       HTML/CSS/Bootstrap/JS        │
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
          Supabase PostgreSQL  Supabase Storage    ML Service
```

This architecture is the current technical baseline for implementation.

Future development should extend this architecture rather than unintentionally replacing it.
