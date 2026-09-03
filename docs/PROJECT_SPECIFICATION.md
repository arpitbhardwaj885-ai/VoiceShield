# VoiceShield — Project Specification

## 1. Project Name

**VoiceShield**

VoiceShield is an audio analysis system designed to analyze voice recordings and identify indicators associated with synthetic, manipulated, or potentially deepfake-generated speech.

The system combines:

* Web-based user interface
* FastAPI backend
* Supabase PostgreSQL database
* Supabase Storage
* Machine-learning analysis
* Speaker verification
* Analysis history
* Explainable analysis results

---

# 2. Project Objective

The primary objective of VoiceShield is to provide users with a system through which they can submit or record audio and receive an analysis indicating whether the audio appears to contain characteristics associated with synthetic or manipulated speech.

The system should provide more than a simple binary prediction.

Where supported by the ML pipeline, the result should communicate:

* Overall assessment
* Confidence information
* Relevant analysis information
* Segment-level findings
* Speaker-related verification information
* Explanation/evidence supporting the result

The system must present ML results in a way that is understandable to the user while preserving the underlying technical result.

---

# 3. Core Problem

Voice cloning and synthetic speech technologies can generate increasingly realistic audio.

This creates risks such as:

* Impersonation
* Fraud
* Social engineering
* False attribution
* Misuse of recorded conversations
* Difficulty distinguishing authentic and synthetic speech

VoiceShield is intended to provide an analysis layer that helps users assess the authenticity of voice recordings.

---

# 4. Scope

VoiceShield consists of the following major capabilities:

```text
1. User authentication
2. Audio upload
3. Audio recording where supported
4. Audio analysis
5. Deepfake/synthetic speech detection
6. Segment-level analysis
7. Speaker verification
8. Speaker profiles
9. Analysis history
10. Analysis result visualization
11. Explainability information
12. Live analysis where supported
```

The exact implementation of each capability must follow the corresponding project documentation.

---

# 5. High-Level System

The system is organized into four primary layers:

```text
┌─────────────────────────────┐
│          FRONTEND           │
│                             │
│ HTML + CSS + Bootstrap + JS │
└──────────────┬──────────────┘
               │
               │ REST / WebSocket
               ▼
┌─────────────────────────────┐
│          BACKEND            │
│                             │
│ Python + FastAPI            │
└───────┬─────────────┬───────┘
        │             │
        │             │ HTTP
        ▼             ▼
┌──────────────┐  ┌──────────────┐
│   SUPABASE   │  │      ML      │
│              │  │              │
│ PostgreSQL   │  │ Python       │
│ Storage      │  │ Detection    │
└──────────────┘  │ Verification │
                  └──────────────┘
```

---

# 6. Frontend

The VoiceShield frontend uses:

```text
HTML5
CSS3
Bootstrap
JavaScript
```

The frontend is responsible for:

* User interface
* Navigation
* Forms
* Audio selection
* Audio recording controls
* Sending requests to the backend
* Displaying analysis progress
* Displaying analysis results
* Displaying history
* Displaying speaker information
* Handling user interactions

The frontend must not directly access:

* Supabase PostgreSQL
* Supabase service-role credentials
* Internal ML services

The frontend communicates with the FastAPI backend.

---

# 7. Backend

The backend uses:

```text
Python
FastAPI
```

FastAPI acts as the central application backend.

The backend is responsible for:

* API endpoints
* Authentication integration
* Authorization
* Request validation
* Business logic
* Audio management
* Database interaction
* Supabase Storage interaction
* ML service communication
* Analysis orchestration
* Result management
* History management
* Error handling

The backend must follow `API_CONTRACT.md`.

---

# 8. Database

VoiceShield uses:

```text
Supabase PostgreSQL
```

The database stores structured application data.

The current schema includes the following major entities:

```text
users
audio_files
speakers
speaker_reference_audio
analyses
segments
model_versions
```

The authoritative database definition is:

```text
docs/DATABASE_SCHEMA.md
```

The project must not introduce an unrelated database architecture.

---

# 9. Audio Storage

Persistent audio files are stored using:

```text
Supabase Storage
```

The PostgreSQL database stores metadata and references associated with stored audio.

Conceptually:

```text
Audio Binary
     ↓
Supabase Storage

Audio Metadata
     ↓
Supabase PostgreSQL
```

The application must maintain consistency between storage objects and their corresponding database records.

---

# 10. Machine Learning

The ML component uses Python.

It is responsible for audio analysis and ML inference.

The ML system includes the following conceptual capabilities:

```text
Audio preprocessing
        ↓
Feature extraction
        ↓
Deepfake detection
        ↓
Segment analysis
        ↓
Speaker verification where required
        ↓
Result generation
```

The detailed ML requirements are defined in:

```text
docs/ML_SPECIFICATION.md
```

The production model must be selected based on evaluation and must not be arbitrarily assumed by an implementation agent.

---

# 11. Deepfake Detection

The primary analytical capability is detection of characteristics associated with synthetic or manipulated speech.

The system should produce an analysis result containing appropriate information such as:

```text
Overall classification
Confidence
Analysis metadata
Segment-level information
Supporting evidence where available
```

The exact response structure must follow:

```text
docs/API_CONTRACT.md
docs/ML_SPECIFICATION.md
```

---

# 12. Segment-Level Analysis

Audio may be analyzed as multiple segments rather than only as one complete recording.

Conceptually:

```text
Complete Audio
      ↓
Segmentation
      ↓
Segment 1
Segment 2
Segment 3
...
      ↓
Individual Analysis
      ↓
Combined Result
```

Segment-level results can help identify portions of an audio recording that require additional attention.

The actual segmentation strategy is defined by the ML specification.

---

# 13. Speaker Verification

VoiceShield includes speaker verification functionality.

Speaker verification is intended to compare an analyzed voice against a registered speaker reference where such functionality is requested and supported.

Conceptually:

```text
Reference Audio
      +
Analyzed Audio
      ↓
Speaker Verification
      ↓
Similarity / Verification Result
```

Speaker verification must remain separate from the primary synthetic-speech detection task.

A recording can therefore involve two distinct analytical questions:

```text
Question 1:
Does the audio appear synthetic/manipulated?

Question 2:
Does the voice correspond to the claimed/reference speaker?
```

---

# 14. Speaker Profiles

Users may maintain speaker profiles.

A speaker profile can be associated with reference audio used for speaker verification.

The system must protect speaker information according to:

```text
docs/SECURITY.md
docs/PRIVACY.md
```

Speaker data must not be made publicly accessible without explicit application requirements.

---

# 15. Audio Analysis Workflow

The standard analysis workflow is:

```text
1. User authenticates
        ↓
2. User selects or records audio
        ↓
3. Frontend sends audio to FastAPI
        ↓
4. Backend validates the request
        ↓
5. Backend stores/manages audio
        ↓
6. Backend sends analysis request to ML
        ↓
7. ML processes audio
        ↓
8. ML returns analysis result
        ↓
9. Backend stores analysis result
        ↓
10. Frontend receives result
        ↓
11. User views analysis
```

The implementation must preserve this general responsibility boundary.

---

# 16. Live Analysis

VoiceShield may support live analysis.

Live analysis is intended for situations where audio is analyzed while it is being captured or transmitted.

The conceptual flow is:

```text
Microphone
    ↓
Browser
    ↓
WebSocket
    ↓
FastAPI
    ↓
ML Processing
    ↓
FastAPI
    ↓
Browser
```

Live analysis must follow the security and authorization requirements defined in `SECURITY.md`.

---

# 17. Analysis History

Authenticated users should be able to access their authorized analysis history.

History may include information such as:

```text
Analysis ID
Audio reference
Analysis status
Result
Timestamp
Model version
```

The exact data returned by the API is defined by:

```text
docs/API_CONTRACT.md
docs/DATABASE_SCHEMA.md
```

Users must not be able to access another user's private history.

---

# 18. Analysis Status

Analysis may involve multiple processing stages.

The application should support appropriate analysis states.

Conceptually:

```text
pending
processing
completed
failed
```

The exact status values must remain consistent with the API and database contracts.

The frontend should display an appropriate state to the user.

---

# 19. Explainability

VoiceShield should provide useful information explaining the analysis where the ML pipeline supports it.

Explainability may include:

* Segment-level findings
* Confidence information
* Relevant audio characteristics
* Model output
* Supporting analysis indicators

Explainability must not fabricate evidence.

If the ML pipeline does not provide a particular explanation, the frontend must not invent one.

---

# 20. Result Presentation

The result interface should clearly distinguish between:

```text
Prediction
Confidence
Evidence / explanation
Speaker verification
Segment findings
```

The UI must avoid presenting a probabilistic ML prediction as an absolute factual determination.

The wording used by the interface should remain consistent with the actual ML output.

---

# 21. User Authentication

VoiceShield requires an authentication mechanism for protected user functionality.

Authenticated users can access resources belonging to their account according to the authorization rules.

Authentication and authorization must follow:

```text
docs/SECURITY.md
docs/API_CONTRACT.md
```

---

# 22. Authorization

The backend is responsible for enforcing authorization.

A user may access only resources they are authorized to access.

Examples include:

```text
Own audio
Own analyses
Own speaker profiles
Own reference audio
Own history
```

The frontend must not be considered an authorization mechanism.

---

# 23. API Communication

The frontend communicates with the backend through HTTP REST APIs.

JSON is the primary structured data format.

Audio uploads may use multipart/form-data where required.

The API implementation must follow:

```text
docs/API_CONTRACT.md
```

---

# 24. Backend–ML Communication

The initial backend-to-ML communication mechanism is:

```text
HTTP REST
```

The backend sends analysis requests to the ML service.

The ML service returns structured analysis results.

The ML service must not become responsible for:

* User authentication
* User management
* Frontend rendering
* Direct application database management

---

# 25. Security Boundary

The backend is the primary application security boundary.

The intended model is:

```text
Frontend
    ↓
FastAPI
    ↓
Protected Resources
```

Security requirements are defined in:

```text
docs/SECURITY.md
```

---

# 26. Privacy

Voice data can be sensitive.

VoiceShield must handle audio and related information according to the project's privacy requirements.

Privacy requirements include considerations for:

* Audio storage
* Data access
* Data retention
* Data deletion
* Analysis history
* Speaker reference recordings
* Sensitive information
* Logs

The authoritative privacy requirements are defined in:

```text
docs/PRIVACY.md
```

---

# 27. Error Handling

The application must handle failures gracefully.

Potential failures include:

```text
Invalid audio
Unsupported format
Upload failure
Storage failure
ML failure
Timeout
Authentication failure
Authorization failure
Database failure
Network failure
```

The backend should return structured API errors according to `API_CONTRACT.md`.

The frontend should present understandable error messages.

Internal implementation details must not be unnecessarily exposed.

---

# 28. Performance Considerations

VoiceShield should be designed to avoid unnecessary processing.

Important considerations include:

* Audio file size
* Audio duration
* ML inference time
* Concurrent analyses
* Storage operations
* Database queries
* Live-analysis resource consumption

Resource limits should be introduced where required by implementation and deployment.

---

# 29. Reliability

The system should avoid leaving inconsistent states.

For example:

```text
Database record created
        +
Storage upload failed
```

must be handled appropriately.

Likewise:

```text
Audio stored
        +
Analysis failed
```

should result in a clearly represented analysis state rather than an ambiguous state.

---

# 30. Project Structure

The repository is organized into major components:

```text
VoiceShield/
│
├── backend/
├── database/
├── deployment/
├── docs/
├── frontend/
├── ml/
├── storage/
├── tests/
│
├── docker-compose.yml
├── LICENSE
└── README.md
```

The existing repository structure should be preserved unless an explicit architectural change is approved.

---

# 31. Documentation Structure

The project documentation is divided into specialized contracts.

```text
docs/
├── ARCHITECTURE.md
├── API_CONTRACT.md
├── DATABASE_SCHEMA.md
├── ML_SPECIFICATION.md
├── TECH_STACK.md
├── SECURITY.md
├── PRIVACY.md
├── PROJECT_SPECIFICATION.md
├── FEATURES.md
├── USER_FLOWS.md
├── FRONTEND_SPECIFICATION.md
├── TESTING.md
├── TECHNICAL_DECISIONS.md
└── DEMO_GUIDE.md
```

Each document has a specific responsibility.

Implementation decisions should use the relevant document rather than duplicating or contradicting requirements.

---

# 32. Technology Constraints

The current technology baseline is:

```text
Frontend:
HTML5
CSS3
Bootstrap
JavaScript

Backend:
Python
FastAPI

Database:
Supabase PostgreSQL

Storage:
Supabase Storage

ML:
Python

Backend ↔ ML:
HTTP REST

Real-time:
WebSocket where required
```

These technologies must not be replaced casually.

---

# 33. Explicit Non-Goals

The following are not part of the core VoiceShield architecture:

```text
React-based frontend
Vue-based frontend
Angular-based frontend
Node.js backend
Django backend
Flask backend
MongoDB as the primary database
Firebase as the primary backend/database
Direct frontend-to-database architecture
Direct frontend-to-ML architecture
```

Introducing one of these would represent an architectural change and must not happen silently.

---

# 34. Implementation Constraints

Implementation agents must:

1. Read the project documentation before modifying architecture.
2. Preserve existing technology choices.
3. Preserve API contracts.
4. Preserve database contracts.
5. Preserve ML interfaces.
6. Avoid unnecessary dependencies.
7. Avoid unnecessary folder restructuring.
8. Avoid replacing working components without justification.
9. Keep frontend, backend, database, storage, and ML responsibilities separated.
10. Report conflicts instead of silently resolving them through assumptions.

---

# 35. Source-of-Truth Hierarchy

When implementing the project, use the following order:

```text
1. ARCHITECTURE.md
2. API_CONTRACT.md
3. DATABASE_SCHEMA.md
4. ML_SPECIFICATION.md
5. TECH_STACK.md
6. SECURITY.md
7. PRIVACY.md
8. PROJECT_SPECIFICATION.md
9. Other specialized documentation
```

If two documents conflict, do not silently choose one.

The conflict must be identified and resolved before implementing the affected functionality.

---

# 36. Definition of the Project

VoiceShield is a web-based voice-analysis application consisting of:

```text
A frontend built with:
HTML + CSS + Bootstrap + JavaScript

A central backend built with:
Python + FastAPI

A relational database provided by:
Supabase PostgreSQL

Persistent audio storage provided by:
Supabase Storage

An ML subsystem built with:
Python

Communication between backend and ML:
HTTP REST

Optional real-time communication:
WebSocket
```

The system allows authenticated users to submit or capture voice audio, process it through the ML analysis pipeline, store the appropriate application data, and view structured analysis results through the web interface.

---

# 37. Final Implementation Rule

This document defines the project-level scope and purpose of VoiceShield.

It does not override more specific technical contracts.

For implementation:

```text
Architecture
      ↓
API Contract
      ↓
Database Schema
      ↓
ML Specification
      ↓
Technology Stack
      ↓
Security / Privacy
      ↓
Feature / UI / Testing Specifications
```

Implementation agents must follow the established contracts rather than inventing new architecture.

If a requirement is not defined, the implementation agent must not make a major architectural assumption.

The unresolved requirement should be identified and clarified before proceeding.
