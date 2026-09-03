# VoiceShield — Technology Stack

## 1. Purpose

This document defines the technology stack for VoiceShield.

It establishes the technologies to be used by each major component of the system and prevents individual implementation sessions from unnecessarily replacing or redesigning the selected stack.

The current stack is:

```text
Frontend      → HTML + CSS + Bootstrap + JavaScript
Backend       → Python + FastAPI
Database      → Supabase PostgreSQL
Storage       → Supabase Storage
ML            → Python-based ML stack
Communication → HTTP REST
```

---

# 2. Technology Stack Overview

| Component                 | Technology                                     |
| ------------------------- | ---------------------------------------------- |
| Frontend Structure        | HTML5                                          |
| Frontend Styling          | CSS3                                           |
| Frontend UI Framework     | Bootstrap                                      |
| Frontend Logic            | JavaScript                                     |
| Backend Language          | Python                                         |
| Backend Framework         | FastAPI                                        |
| API Format                | REST                                           |
| API Data Format           | JSON                                           |
| Database                  | Supabase PostgreSQL                            |
| Database Access           | Backend-side database layer                    |
| File Storage              | Supabase Storage                               |
| ML Language               | Python                                         |
| ML Pipeline               | Python-based ML components                     |
| ML Communication          | HTTP REST                                      |
| Testing                   | Python/JavaScript testing tools as appropriate |
| Version Control           | Git                                            |
| Environment Configuration | Environment variables                          |

---

# 3. Frontend Stack

The VoiceShield frontend uses a traditional web technology stack.

```text
HTML
 ↓
CSS
 ↓
Bootstrap
 ↓
JavaScript
```

The frontend must **not be replaced with React, Vue, Angular, Next.js, or another frontend framework unless the project architecture is explicitly changed and all affected documentation is updated.**

---

# 4. HTML5

HTML5 is used to define the structure of the VoiceShield web application.

HTML is responsible for:

* Page structure
* Forms
* Buttons
* Audio controls
* Navigation
* Tables
* Result sections
* Dashboard sections
* Semantic page elements

Typical structure:

```html
<!DOCTYPE html>
<html>
<head>
    ...
</head>
<body>
    ...
</body>
</html>
```

Frontend pages should use semantic HTML where appropriate.

---

# 5. CSS3

CSS is used for application-specific styling.

CSS is responsible for:

* Custom layouts
* Spacing
* Typography
* Component customization
* Responsive adjustments
* Visual states
* Application-specific design

Bootstrap should handle common UI/layout requirements where practical.

Custom CSS should be used when Bootstrap alone cannot provide the required VoiceShield design.

---

# 6. Bootstrap

Bootstrap is the primary frontend UI framework.

Bootstrap should be used for:

* Responsive layout
* Grid system
* Buttons
* Forms
* Cards
* Navigation
* Tables
* Alerts
* Modals
* Progress indicators
* Utility classes

The frontend should prefer Bootstrap components and utilities instead of recreating standard components unnecessarily.

Example:

```html
<button class="btn btn-primary">
    Analyze Audio
</button>
```

Bootstrap is a frontend dependency only.

It does not replace the FastAPI backend.

---

# 7. JavaScript

JavaScript is responsible for frontend application behavior.

JavaScript handles:

* User interactions
* Form submission
* Audio upload interaction
* Recording controls
* API requests
* Dynamic result rendering
* Loading states
* Error handling
* Dashboard updates
* WebSocket communication where required
* Client-side validation

The frontend communicates with the backend through the defined API contract.

---

# 8. Frontend API Communication

The frontend must communicate with FastAPI through HTTP requests.

General flow:

```text
HTML
  ↓
JavaScript
  ↓
FastAPI REST API
  ↓
Backend
```

Example:

```text
User selects audio
        ↓
JavaScript creates request
        ↓
FastAPI receives request
        ↓
Backend processes request
        ↓
JSON response
        ↓
JavaScript updates UI
```

The frontend must follow `API_CONTRACT.md`.

It must not invent its own request or response formats.

---

# 9. Frontend and Supabase

The frontend must **not directly access Supabase PostgreSQL**.

The intended architecture is:

```text
Frontend
   ↓
FastAPI
   ↓
Supabase PostgreSQL
```

For audio storage:

```text
Frontend
   ↓
FastAPI
   ↓
Supabase Storage
```

The frontend must not contain:

```text
Supabase service-role key
Database password
Private backend secrets
```

---

# 10. Backend Stack

The VoiceShield backend uses:

```text
Python
FastAPI
```

FastAPI is the central application backend.

It is responsible for:

* API endpoints
* Request validation
* Response formatting
* Authentication/authorization integration
* Business logic
* ML orchestration
* Database interaction
* Storage interaction
* Analysis history
* Risk calculation
* Backend-level error handling

---

# 11. Python

Python is the primary backend and ML programming language.

Python is used for:

```text
Backend
ML
Data processing
Testing
```

The Python environment should use an isolated virtual environment during development.

Example:

```text
backend/.venv
```

and/or an appropriate project-level environment depending on the implementation structure.

---

# 12. FastAPI

FastAPI is the backend web framework.

It is responsible for exposing the VoiceShield REST API.

General structure:

```text
Frontend
    ↓
FastAPI
    ├── Authentication
    ├── Audio Management
    ├── Analysis
    ├── Speaker Management
    ├── History
    └── ML Communication
```

FastAPI must follow the contracts defined in:

```text
docs/API_CONTRACT.md
docs/ARCHITECTURE.md
```

---

# 13. API Format

VoiceShield uses REST-style HTTP APIs.

The primary data exchange format is:

```text
JSON
```

Example:

```json
{
    "status": "completed",
    "analysis_id": "uuid"
}
```

Audio data may be transferred using appropriate multipart/form-data requests where required.

---

# 14. Database

VoiceShield uses:

```text
Supabase PostgreSQL
```

PostgreSQL is the relational database used for structured application data.

The current database schema is defined in:

```text
docs/DATABASE_SCHEMA.md
```

The current tables are:

```text
users
audio_files
speakers
speaker_reference_audio
analyses
segments
model_versions
```

---

# 15. Supabase PostgreSQL

Supabase provides the PostgreSQL database infrastructure.

The database stores structured information such as:

* Users
* Audio metadata
* Speaker profiles
* Speaker references
* Analysis records
* Analysis segments
* Model versions

The actual audio binary is not stored directly inside PostgreSQL.

---

# 16. Supabase Storage

VoiceShield uses:

```text
Supabase Storage
```

for persistent audio files.

General structure:

```text
Frontend
    ↓
FastAPI
    ↓
Supabase Storage
```

The database stores the corresponding:

```text
storage_path
```

rather than storing the audio binary in a PostgreSQL row.

---

# 17. Database Access Boundary

The application should maintain a clear database boundary:

```text
Frontend
    ↓
FastAPI
    ↓
Database
```

The frontend must not directly perform database queries.

The ML service must not directly perform database queries.

The backend is the central application layer responsible for database operations.

---

# 18. Database Models

The backend database models must remain consistent with:

```text
docs/DATABASE_SCHEMA.md
```

Any ORM/database abstraction used by the backend must map correctly to the PostgreSQL schema.

Do not create a second unrelated database model structure.

---

# 19. Machine Learning Stack

The ML component uses Python.

The ML stack is responsible for:

* Audio preprocessing
* Feature extraction
* Deepfake detection
* Segment analysis
* Speaker verification
* Model training
* Evaluation
* Robustness testing
* Explainability
* Inference

The detailed ML requirements are defined in:

```text
docs/ML_SPECIFICATION.md
```

---

# 20. ML Model Selection

The exact production ML model is **not fixed by this technology-stack document**.

The model must be selected through evaluation.

The implementation should remain model-agnostic enough to support replacement of the underlying model.

Conceptually:

```text
ML Interface
     ↑
     │
Model v1 / Model v2 / Future Model
```

The backend must communicate with the ML interface rather than depending on internal model architecture.

---

# 21. Backend ↔ ML Communication

The initial communication mechanism between FastAPI and ML is:

```text
HTTP REST
```

General flow:

```text
FastAPI
   │
   │ HTTP request
   ▼
ML Service
   │
   │ JSON result
   ▼
FastAPI
```

The exact endpoint and payload must follow the ML/backend contract.

---

# 22. WebSockets

WebSockets may be used for live analysis functionality where required.

General live flow:

```text
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
WebSocket
   ↓
Browser
```

WebSockets are intended for real-time communication.

They do not replace REST APIs for normal CRUD/application operations.

---

# 23. Authentication

Authentication is part of the backend/application security layer.

The frontend should only handle:

* Login/register forms
* Authentication state
* Sending appropriate authentication information
* Displaying authentication errors

Authentication credentials and sensitive secrets must remain protected.

The final authentication implementation must remain consistent with the project's security documentation.

---

# 24. Environment Variables

Environment-specific values must not be hard-coded.

Examples include:

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ML_SERVICE_URL
SECRET_KEY
```

The exact variable names must follow the implementation configuration.

Secrets must be stored in environment configuration rather than committed into source control.

---

# 25. Git

Git is the project's version-control system.

The repository should track:

```text
Source code
Configuration templates
Documentation
Tests
Database migrations
ML code
Frontend code
```

The repository must not track:

```text
.env
Private keys
Passwords
Large generated model files when inappropriate
Temporary audio files
Temporary processing output
```

---

# 26. Backend Dependencies

Backend dependencies should be explicitly declared.

The project should use a dependency-management file such as:

```text
requirements.txt
```

or the dependency-management mechanism already established by the project.

Dependencies should not be installed manually without recording them.

---

# 27. Frontend Dependencies

The frontend should keep dependencies minimal.

The required frontend technologies are:

```text
HTML5
CSS3
Bootstrap
JavaScript
```

Bootstrap may be included through the project's chosen package/CDN strategy.

The final implementation must use one consistent approach rather than mixing unrelated dependency-management strategies.

---

# 28. Development Environment

The project should support development on the existing repository structure.

Main development components:

```text
Frontend
Backend
ML
Database
```

The developer should be able to run the required services independently.

Conceptually:

```text
Frontend Server
      │
      ▼
FastAPI Server
      │
      ├── Supabase
      │
      └── ML Service
```

---

# 29. Testing Technologies

Testing technology should match the component.

Backend/ML:

```text
Python testing framework
```

Frontend:

```text
JavaScript/browser testing where required
```

Database:

```text
Migration/schema validation
```

The exact testing tools may be selected during implementation, but the testing strategy must remain consistent with `TESTING.md`.

---

# 30. Deployment

The deployment architecture must support:

```text
Frontend
Backend
ML
Supabase
```

The exact hosting providers are not fixed by this document unless separately specified by the project.

Do not introduce a hosting provider requirement simply because a particular deployment platform is familiar.

Deployment decisions must remain compatible with:

```text
ARCHITECTURE.md
SECURITY.md
```

---

# 31. Technology Substitution Rules

The following technologies are currently fixed:

```text
Frontend:
HTML
CSS
Bootstrap
JavaScript

Backend:
Python
FastAPI

Database:
Supabase PostgreSQL

Storage:
Supabase Storage

Backend ↔ ML:
HTTP REST
```

Do not replace them with:

```text
React
Angular
Vue
Django
Flask
Node.js backend
MongoDB
Firebase
Local PostgreSQL as the production database
Local filesystem as the persistent audio-storage system
```

unless the architecture is intentionally changed and all affected project contracts are updated first.

---

# 32. Separation of Responsibilities

The technology stack follows this separation:

```text
┌───────────────────────────────┐
│           FRONTEND            │
│                               │
│ HTML + CSS + Bootstrap + JS   │
└───────────────┬───────────────┘
                │
                │ REST / WebSocket
                ▼
┌───────────────────────────────┐
│            BACKEND            │
│                               │
│ Python + FastAPI              │
└───────┬───────────────┬───────┘
        │               │
        │               │ HTTP REST
        ▼               ▼
┌───────────────┐  ┌───────────────┐
│    SUPABASE   │  │      ML       │
│               │  │               │
│ PostgreSQL    │  │ Python        │
│ Storage       │  │ Detection     │
└───────────────┘  │ Verification  │
                   │ Evaluation    │
                   └───────────────┘
```

---

# 33. What Each Layer Must Not Do

## Frontend must not:

* Access PostgreSQL directly
* Contain Supabase service-role credentials
* Implement ML models
* Calculate authoritative application risk
* Bypass FastAPI authorization

## Backend must not:

* Contain frontend UI logic
* Implement the ML model internally unless explicitly required
* Store persistent audio binaries in PostgreSQL
* Bypass the ML interface for model-specific logic

## ML must not:

* Access the database directly
* Manage Supabase Storage
* Manage user authentication
* Implement frontend logic
* Modify application records directly

## Database must not:

* Contain ML inference logic
* Contain frontend logic
* Become the application API

---

# 34. Technology Decision Principles

When selecting additional libraries or dependencies, use the following principles:

1. Prefer the existing stack.
2. Prefer simple and maintainable solutions.
3. Avoid unnecessary frameworks.
4. Avoid duplicate functionality.
5. Keep components modular.
6. Keep dependencies justified.
7. Do not replace a project technology without a documented reason.
8. Keep implementation compatible with the existing contracts.

---

# 35. Compatibility Requirement

All components must remain compatible with:

```text
docs/ARCHITECTURE.md
docs/API_CONTRACT.md
docs/DATABASE_SCHEMA.md
docs/ML_SPECIFICATION.md
```

If a technology decision conflicts with one of these documents, stop and resolve the conflict before implementation.

Do not silently change the architecture to accommodate a library.

---

# 36. Current Technology Baseline

The authoritative current baseline is:

```text
==================================================
VOICE SHIELD TECHNOLOGY STACK
==================================================

FRONTEND
    HTML5
    CSS3
    Bootstrap
    JavaScript

BACKEND
    Python
    FastAPI
    REST APIs

DATABASE
    Supabase PostgreSQL

STORAGE
    Supabase Storage

ML
    Python
    Model-agnostic ML pipeline
    Deepfake detection
    Speaker verification

COMMUNICATION
    HTTP REST
    WebSocket where required for live analysis

VERSION CONTROL
    Git

CONFIGURATION
    Environment variables
==================================================
```

---

# 37. Final Rule

This document defines the technology baseline for VoiceShield.

Implementation agents must use this stack unless an explicit architectural decision is made to change it.

A coding agent must not independently:

* Replace the frontend framework
* Replace FastAPI
* Replace Supabase
* Replace PostgreSQL
* Replace Supabase Storage
* Replace REST communication
* Introduce a competing backend architecture

Any required technology change must first be discussed and reflected in the appropriate project documentation.
