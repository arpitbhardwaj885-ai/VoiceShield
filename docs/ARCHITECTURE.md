# VoiceShield — System Architecture

## 1. Overview

VoiceShield is an AI-based voice security system that analyzes audio to detect AI-generated or voice-cloned speech.

The system can analyze uploaded or recorded audio and, where supported, real-time audio. It can provide AI-generated probability, risk information, suspicious segments, speaker verification results, and explanation information.

The project is divided into four main parts:

* **Frontend** — User interface and audio interaction
* **Backend** — API, authentication and application logic
* **ML** — Voice deepfake detection, speaker verification and analysis
* **Supabase** — PostgreSQL database and audio storage

The basic flow is:

```text
User
  ↓
Frontend
  ↓
FastAPI Backend
  ├── Supabase PostgreSQL
  ├── Supabase Storage
  └── ML System
          ↓
       Prediction
          ↓
     FastAPI Backend
          ↓
       Frontend
          ↓
        Result
```

---

## 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │        USER         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      FRONTEND       │
                         │    HTML/CSS/JS      │
                         │      Bootstrap      │
                         └──────────┬──────────┘
                                    │
                             REST / WebSocket
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       FASTAPI       │
                         │       BACKEND       │
                         └─────────┬───────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
             ┌────────────┐ ┌────────────┐ ┌────────────┐
             │  Supabase  │ │  Supabase  │ │     ML     │
             │ PostgreSQL │ │  Storage   │ │   System   │
             └────────────┘ └────────────┘ └────────────┘
                    │              │              │
                    │              │              ▼
                    │              │       ┌──────────────┐
                    │              │       │ Preprocessing│
                    │              │       │ Detection    │
                    │              │       │ Verification │
                    │              │       │ Explainability│
                    │              │       └──────────────┘
                    │              │
                    └──────────────┴──────────────┐
                                                  ▼
                                           Analysis Result
                                                  │
                                                  ▼
                                              Frontend
```

This architecture is the baseline for implementation.

---

## 3. Frontend

The frontend is built using:

* HTML
* CSS
* JavaScript
* Bootstrap

The frontend provides the user interface for:

* Registration
* Login
* Dashboard
* Audio upload
* Audio recording
* Audio analysis
* Result viewing
* Analysis history
* Speaker profiles
* Speaker verification
* Live analysis

The frontend communicates with the backend using REST APIs and WebSockets.

The frontend does **not** directly access:

* Supabase PostgreSQL
* Supabase service-role credentials
* ML internals

All application requests pass through FastAPI.

---

## 4. Backend

The backend is built using **Python and FastAPI**.

FastAPI is the central application backend and connects the frontend with the database, storage and ML system.

The backend is responsible for:

* Authentication
* JWT handling
* User management
* Request validation
* Audio upload handling
* Audio storage coordination
* Analysis creation
* ML communication
* Analysis result storage
* Speaker profile operations
* Analysis history
* WebSocket communication
* Access control
* Error handling

The backend should remain independent from the internal implementation of the ML models.

---

## 5. Supabase

Supabase is used as the project's managed PostgreSQL and storage infrastructure.

### Supabase PostgreSQL

PostgreSQL stores the application's structured data.

The current database design contains these seven main tables:

```text
users
audio_files
speakers
speaker_reference_audio
analyses
segments
model_versions
```

The backend communicates with PostgreSQL through the established backend/database layer.

The frontend does not directly modify database records.

### Supabase Storage

Supabase Storage is used for persistent audio files.

The database stores the metadata and storage reference for an audio file rather than storing the complete audio binary inside the database.

Example:

```text
Supabase Storage
└── audio/
    └── user-id/
        └── audio-file.wav
```

The corresponding database record can contain:

```text
storage_path = audio/user-id/audio-file.wav
```

Storage paths should not expose unnecessary user information.

---

## 6. ML System

The ML component is responsible for audio intelligence.

Its responsibilities include:

* Audio preprocessing
* Feature extraction
* AI-generated/deepfake detection
* Voice-clone detection
* Speaker embeddings
* Speaker verification
* Suspicious segment analysis
* Explainability
* Model evaluation

The ML system is kept separate from the FastAPI application.

Its internal implementation can change without requiring the frontend to change, as long as the agreed ML interface remains compatible.

The ML component is organized approximately as:

```text
ml/
├── preprocessing/
├── features/
├── detection/
├── speaker_verification/
├── pipeline/
├── evaluation/
├── explainability/
├── training/
└── tests/
```

The backend should communicate with ML through a stable interface rather than depending on a particular model implementation.

---

## 7. Audio Upload Flow

For uploaded audio, the flow is:

```text
User
  ↓
Frontend
  ↓
FastAPI
  ↓
Validate Audio
  ↓
Supabase Storage
  ↓
audio_files metadata
  ↓
ML Analysis
  ↓
Analysis Result
  ↓
Supabase PostgreSQL
  ↓
Frontend
```

The `audio_files` record keeps information about the stored audio and its storage location.

The ML system processes the audio and returns the analysis information to the backend.

---

## 8. Analysis Flow

The normal analysis flow is:

```text
Frontend
   ↓
FastAPI
   ↓
Retrieve Audio
   ↓
ML
   ↓
Detection / Verification
   ↓
Analysis Result
   ↓
FastAPI
   ↓
PostgreSQL
   ↓
Frontend
```

An analysis can contain information such as:

* AI-generated probability
* Authentic probability
* Speaker similarity where applicable
* Risk level
* Suspicious segments
* Explanation information
* Model/version information

The exact API fields are defined separately in `API_CONTRACT.md`.

---

## 9. Suspicious Segment Flow

Suspicious sections of an audio file are identified by the ML system.

```text
Audio
  ↓
ML
  ↓
Segment Analysis
  ↓
Segment Probabilities
  ↓
FastAPI
  ↓
segments table
  ↓
Frontend
  ↓
Timeline / Suspicious Sections
```

The `segments` table stores the segment information associated with an analysis.

---

## 10. Speaker Verification Flow

Speaker verification uses a registered speaker profile and reference audio.

```text
Reference Audio
       ↓
Speaker Profile
       ↓
Supabase Storage
       ↓
PostgreSQL Metadata
       ↓
New Audio
       ↓
ML Speaker Verification
       ↓
Similarity Result
       ↓
FastAPI
       ↓
Frontend
```

A speaker can have multiple reference recordings.

Speaker verification is only performed when the required speaker/reference information is available.

---

## 11. Live Analysis

VoiceShield can support live analysis through WebSockets.

The basic flow is:

```text
Microphone
    ↓
Browser
    ↓
WebSocket
    ↓
FastAPI
    ↓
ML
    ↓
Partial Results
    ↓
FastAPI
    ↓
WebSocket
    ↓
Frontend
```

Live analysis is intended for microphone input or another audio stream that the application is authorized to process.

The exact WebSocket message format is defined in the API/ML contracts.

---

## 12. Analysis History

Analysis history is retrieved through the backend.

```text
Frontend
   ↓
FastAPI
   ↓
Supabase PostgreSQL
   ↓
analyses
   ↓
Frontend
```

Users should only be able to access their own analysis history.

---

## 13. Authentication

Authentication is handled through the backend.

### Registration

```text
User
  ↓
Frontend
  ↓
FastAPI
  ↓
Password Hashing
  ↓
Supabase PostgreSQL
```

### Login

```text
User
  ↓
Frontend
  ↓
FastAPI
  ↓
Credential Verification
  ↓
JWT Token
  ↓
Frontend
```

Protected requests include the JWT token.

The backend checks authentication and ownership before returning private user data.

---

## 14. Security Boundary

FastAPI is the main application security boundary.

```text
Frontend
    ↓
FastAPI
    ↓
┌───────────────┐
│   Supabase    │
│ PostgreSQL    │
│ Storage       │
└───────────────┘
       +
      ML
```

The following must remain server-side:

* Supabase service-role key
* Database credentials
* JWT secret
* Other private API credentials

Secrets must be stored using environment variables.

The `.env` file must not be committed to Git.

An `.env.example` file may be provided with placeholder values.

---

## 15. Data Ownership

User ownership must be checked before accessing private resources.

This includes:

* Audio files
* Speaker profiles
* Reference recordings
* Analyses
* Analysis history

A user should not be able to access another user's private data simply by changing an ID in a request.

Supabase Row Level Security should be configured where appropriate.

---

## 16. Separation of Responsibilities

The system follows these boundaries:

```text
Frontend
→ Presentation and user interaction

FastAPI Backend
→ Application logic, authentication and orchestration

Supabase PostgreSQL
→ Structured persistent data

Supabase Storage
→ Persistent audio files

ML
→ Audio intelligence and prediction
```

The intended communication pattern is:

```text
Frontend
     ↕
  FastAPI
   ↙   ↘
Supabase  ML
```

The following direct connections are **not part of the intended architecture**:

```text
Frontend ↔ PostgreSQL
Frontend ↔ ML
ML ↔ PostgreSQL
```

This keeps the application boundaries clear.

---

## 17. Repository Structure

The project uses a monorepo structure.

```text
VoiceShield/
│
├── frontend/
│
├── backend/
│
├── ml/
│
├── database/
│
├── deployment/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACT.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEMO_GUIDE.md
│   ├── FEATURES.md
│   ├── FRONTEND_SPECIFICATION.md
│   ├── ML_SPECIFICATION.md
│   ├── PRIVACY.md
│   ├── PROJECT_SPECIFICATION.md
│   ├── SECURITY.md
│   ├── TECHNICAL_DECISIONS.md
│   ├── TECH_STACK.md
│   ├── TESTING.md
│   └── USER_FLOWS.md
│
├── tests/
│
├── docker-compose.yml
│
└── README.md
```

The `docs/` directory contains the shared project contracts and documentation.

---

## 18. Deployment

Docker is used to keep the application environment consistent.

The project includes deployment configuration for:

```text
Backend
Frontend
ML
Nginx
Docker Compose
```

Supabase remains an external managed service.

The local Docker environment does not need a local PostgreSQL server when using the hosted Supabase database.

The deployment structure is approximately:

```text
                    Internet
                       │
                       ▼
                    Nginx
                       │
              ┌────────┴────────┐
              ▼                 ▼
          Frontend           FastAPI
                                │
                       ┌────────┴────────┐
                       ▼                 ▼
                   Supabase             ML
                PostgreSQL +          Service
                   Storage
```

---

## 19. Scalability

The architecture allows individual components to be improved independently.

A possible future scaling approach is:

```text
Frontend
    ↓
Load Balancer
    ↓
Multiple FastAPI Instances
    ↓
Supabase
    +
ML Workers / Services
```

If ML inference becomes computationally expensive, ML processing can later be separated into dedicated workers or services without changing the frontend architecture.

---

## 20. Architecture Principles

The project follows these principles:

1. Keep frontend and backend responsibilities separate.
2. Use FastAPI as the central application backend.
3. Use Supabase PostgreSQL for structured persistent data.
4. Use Supabase Storage for persistent audio files.
5. Keep ML implementation independent from the frontend.
6. Keep the ML interface stable even when internal models change.
7. Do not expose server-side secrets to the frontend.
8. Check user ownership before accessing private resources.
9. Store model/version information with analysis results.
10. Keep the system modular and testable.
11. Avoid unnecessary changes to established shared contracts.
12. Changes affecting multiple components must be coordinated.

---

## 21. Main Data Flow

The complete application flow is:

```text
                         USER
                           │
                           ▼
                      FRONTEND
                           │
                    REST / WebSocket
                           │
                           ▼
                       FASTAPI
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
        Supabase       Supabase          ML
        PostgreSQL      Storage         System
             │             │             │
             │             │        Prediction
             │             │             │
             └─────────────┴──────┬──────┘
                                  │
                                  ▼
                              FASTAPI
                                  │
                                  ▼
                              FRONTEND
                                  │
                                  ▼
                                RESULT
```

---

## 22. Final Architecture Summary

The final VoiceShield architecture is:

```text
                         VOICESHIELD
                              │
                              ▼
                    ┌──────────────────┐
                    │     Frontend     │
                    │   HTML/CSS/JS    │
                    │    Bootstrap     │
                    └────────┬─────────┘
                             │
                       REST / WebSocket
                             │
                             ▼
                    ┌──────────────────┐
                    │      FastAPI     │
                    │      Backend     │
                    └───────┬────┬─────┘
                            │    │
                 ┌──────────┘    └──────────┐
                 ▼                           ▼
        ┌──────────────────┐       ┌──────────────────┐
        │     Supabase     │       │    ML System     │
        │                  │       │                  │
        │   PostgreSQL     │       │  Preprocessing   │
        │   Storage        │       │  Detection       │
        │                  │       │  Verification    │
        │                  │       │  Explainability  │
        └──────────────────┘       └──────────────────┘
```

This document represents the current system architecture baseline for VoiceShield.

Any future implementation should remain compatible with this architecture and the other shared project contracts, especially:

```text
docs/API_CONTRACT.md
docs/DATABASE_SCHEMA.md
docs/ML_SPECIFICATION.md
```

Changes that affect these boundaries should be coordinated before implementation.
