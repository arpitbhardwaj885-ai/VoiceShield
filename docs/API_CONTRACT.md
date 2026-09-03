# VoiceShield — API Contract

## 1. Purpose

This document defines the communication contract between the VoiceShield frontend, backend, and ML service.

The backend is the central application layer.

The database is accessed only by the backend.

```text
Frontend
   │
   │ REST / WebSocket
   ▼
Backend
   │
   ├── PostgreSQL
   │
   └── ML Service
```

The frontend must never directly communicate with PostgreSQL or the ML service.

---

# 2. API Base URL

Development:

```text
http://localhost:8000
```

API prefix:

```text
/api
```

Therefore:

```text
http://localhost:8000/api
```

The production URL will be configured through the deployment environment.

---

# 3. Communication Methods

VoiceShield uses two primary communication mechanisms.

## REST API

REST is used for normal application operations:

* Authentication
* Audio upload
* Analysis creation
* Analysis results
* Analysis history
* Speaker management
* Profile-related operations
* Health checks

## WebSocket

WebSocket is used for live analysis:

```text
/api/live-analysis
```

The live-analysis feature processes smaller audio chunks and returns partial predictions.

---

# 4. Authentication

VoiceShield uses JWT-based authentication.

After successful login, the backend returns an access token.

Protected requests send the token using:

```http
Authorization: Bearer <access_token>
```

All protected endpoints must reject requests without valid authentication.

The backend must also check resource ownership before returning private user data.

---

# 5. Standard Response Format

Successful API responses should use JSON.

### Success

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "INVALID_AUDIO",
    "message": "The uploaded audio format is not supported."
  }
}
```

The exact error codes may be expanded during implementation but should remain documented.

---

# 6. HTTP Status Codes

The backend should use appropriate HTTP status codes.

Initial status codes:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
413 Payload Too Large
422 Validation Error
429 Too Many Requests
500 Internal Server Error
503 Service Unavailable
```

---

# 7. Authentication APIs

## 7.1 Register

```http
POST /api/auth/register
```

Creates a new user account.

### Request

```json
{
  "name": "Arpit",
  "email": "user@example.com",
  "password": "securePassword"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Arpit",
      "email": "user@example.com"
    }
  },
  "message": "Registration successful"
}
```

Passwords must never be returned in API responses.

---

# 8. Login

```http
POST /api/auth/login
```

Authenticates an existing user.

### Request

```json
{
  "email": "user@example.com",
  "password": "securePassword"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "access_token": "JWT_TOKEN",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "name": "Arpit",
      "email": "user@example.com"
    }
  },
  "message": "Login successful"
}
```

---

# 9. Current User

```http
GET /api/auth/me
```

Authentication required.

Returns information about the currently authenticated user.

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Arpit",
    "email": "user@example.com"
  }
}
```

---

# 10. Audio Upload

```http
POST /api/audio/upload
```

Authentication required.

The endpoint accepts an audio file from the frontend.

The backend is responsible for:

* Validating the uploaded file
* Checking the file type
* Applying file-size limits
* Storing the audio
* Creating the corresponding audio metadata
* Returning an identifier for later analysis

The exact multipart/form-data field name and complete upload behavior will be finalized during implementation.

### Conceptual response

```json
{
  "success": true,
  "data": {
    "audio_id": "uuid",
    "filename": "recording.wav",
    "status": "uploaded"
  },
  "message": "Audio uploaded successfully"
}
```

---

# 11. Create Analysis

```http
POST /api/analysis
```

Authentication required.

Creates an analysis for an uploaded audio file.

### Conceptual request

```json
{
  "audio_id": "uuid",
  "analysis_type": "full"
}
```

Supported analysis types:

```text
full
deepfake_only
speaker_verification
```

For speaker verification, the request may additionally identify the speaker profile to use.

The exact request structure will be finalized with the backend implementation and ML contract.

### Conceptual response

```json
{
  "success": true,
  "data": {
    "analysis_id": "uuid",
    "status": "queued"
  },
  "message": "Analysis created successfully"
}
```

---

# 12. Get Analysis Result

```http
GET /api/analysis/{id}
```

Authentication required.

Returns the result of an analysis owned by the authenticated user.

### Conceptual response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "analysis_type": "full",
    "ai_probability": 0.91,
    "authentic_probability": 0.09,
    "speaker_similarity": 0.87,
    "risk_score": 0.89,
    "risk_level": "HIGH",
    "confidence": 0.93,
    "model_version": "v1.0",
    "segments": [
      {
        "start": 8.0,
        "end": 12.0,
        "ai_probability": 0.94,
        "risk_level": "HIGH"
      }
    ]
  }
}
```

The numerical values above are examples only.

Actual values are produced by the ML system.

---

# 13. Analysis Status

An analysis can have the following initial states:

```text
queued
processing
completed
failed
```

Conceptual flow:

```text
queued
  ↓
processing
  ↓
completed
```

If processing fails:

```text
processing
  ↓
failed
```

---

# 14. Analysis History

```http
GET /api/history
```

Authentication required.

Returns analyses belonging to the authenticated user.

The frontend may use the history endpoint for:

* Searching analyses
* Filtering by risk
* Sorting by date
* Opening previous results
* Deleting an analysis

Pagination may be added as required during implementation.

---

# 15. Delete Analysis

```http
DELETE /api/analysis/{id}
```

Authentication required.

Deletes an analysis belonging to the authenticated user.

The backend must verify ownership before deletion.

Related segments may also be deleted according to the database relationship.

---

# 16. Speaker Management

## Create Speaker

```http
POST /api/speakers
```

Authentication required.

Creates a speaker profile.

### Conceptual request

```json
{
  "name": "John"
}
```

### Conceptual response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John",
    "status": "processing"
  }
}
```

---

# 17. Get Speakers

```http
GET /api/speakers
```

Authentication required.

Returns speaker profiles belonging to the authenticated user.

Example:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John",
      "status": "ready"
    }
  ]
}
```

---

# 18. Speaker Verification

```http
POST /api/speakers/{id}/verify
```

Authentication required.

Uses the selected speaker profile as a reference for speaker verification.

The verification process is:

```text
Audio
   ↓
Speaker Reference
   ↓
ML Speaker Verification
   ↓
Similarity Score
   ↓
Backend
   ↓
Frontend
```

A speaker should only be used when its status is:

```text
ready
```

---

# 19. Live Analysis

```text
WS /api/live-analysis
```

Authentication is required according to the final WebSocket implementation.

The intended flow is:

```text
Microphone / Authorized Audio Stream
                  ↓
               Browser
                  ↓
              WebSocket
                  ↓
               Backend
                  ↓
             Audio Chunks
                  ↓
              ML Service
                  ↓
          Partial Prediction
                  ↓
               Backend
                  ↓
              WebSocket
                  ↓
               Browser
```

The system should process smaller chunks instead of waiting for the entire recording.

Example timeline:

```text
00:00 → LOW
00:05 → LOW
00:10 → MEDIUM
00:15 → HIGH
00:20 → HIGH
```

The exact WebSocket message structure and audio format will be finalized before implementation.

---

# 20. ML Service Contract

The backend communicates with the ML system through a defined service interface.

The ML service should return a stable structure.

Conceptual result:

```json
{
  "ai_probability": 0.91,
  "authentic_probability": 0.09,
  "speaker_similarity": 0.87,
  "segments": [
    {
      "start": 8.0,
      "end": 12.0,
      "ai_probability": 0.94
    }
  ],
  "confidence": 0.93,
  "model_version": "v1.0"
}
```

These numbers are examples only.

The actual model determines the final values.

The backend must not depend on the internal implementation of the ML model.

The ML member must maintain compatibility with this external result contract.

---

# 21. Risk Result

The backend can combine ML information into an application-level risk result.

Possible inputs include:

```text
AI probability
Speaker similarity
Suspicious segments
Model confidence
```

Initial risk levels:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Exact risk-scoring thresholds should be finalized after ML evaluation.

They should not be invented before model testing.

---

# 22. Error Codes

The API should use consistent error codes.

Initial codes include:

```text
INVALID_REQUEST
INVALID_AUDIO
FILE_TOO_LARGE
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
ANALYSIS_NOT_FOUND
ANALYSIS_FAILED
SPEAKER_NOT_FOUND
SPEAKER_NOT_READY
SPEAKER_VERIFICATION_FAILED
ML_SERVICE_UNAVAILABLE
ML_ANALYSIS_FAILED
RATE_LIMITED
INTERNAL_ERROR
```

Additional error codes may be added when required.

---

# 23. Health Check

```http
GET /api/health
```

This endpoint checks the basic health of the application and its dependencies.

### Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "backend": "healthy",
    "database": "healthy",
    "ml_service": "healthy"
  }
}
```

If a dependency is unavailable, the backend should report an appropriate degraded status.

---

# 24. Ownership and Authorization

All protected resources must belong to the authenticated user unless an explicitly authorized system-level operation requires otherwise.

The backend must verify ownership for:

```text
Audio
Analyses
Speaker profiles
Speaker reference data
```

Example:

```text
User A
  ↓
Only User A's private resources
```

A user must not be able to access another user's analysis simply by changing an ID in the URL.

---

# 25. Frontend API Usage

The frontend consumes:

```text
/api/auth/*
/api/audio/*
/api/analysis/*
/api/history
/api/speakers/*
/api/live-analysis
/api/health
```

The frontend must not:

```text
Directly access PostgreSQL
Directly access the ML service
Expose server-side credentials
```

---

# 26. Backend API Ownership

The backend member owns:

```text
/api/*
```

The backend is responsible for:

* Request validation
* Authentication
* Authorization
* Business logic
* Database communication
* Supabase Storage communication
* ML communication
* Response formatting
* Error handling

---

# 27. Database API Boundary

The database member does not create public frontend APIs.

The database member provides:

```text
Database schema
Relationships
Constraints
Indexes
Migrations
Seed data
```

The backend consumes the database through the established SQLAlchemy/database layer.

The frontend does not communicate with PostgreSQL directly.

---

# 28. API Versioning

The initial API uses:

```text
/api
```

If a breaking change becomes necessary, a new API version can be introduced:

```text
/api/v2
```

An existing endpoint's response structure should not be silently changed in a breaking way.

---

# 29. API Contract Rules

### Rule 1

Do not rename API fields without team agreement.

### Rule 2

Do not change data types without team agreement.

### Rule 3

Do not remove fields without checking frontend, backend, and ML dependencies.

### Rule 4

Prefer new optional fields over breaking existing fields.

### Rule 5

Breaking changes require an API version change when necessary.

### Rule 6

All protected endpoints require authentication.

### Rule 7

Users can access only their own private analyses and speaker profiles.

### Rule 8

Frontend never accesses PostgreSQL directly.

### Rule 9

Frontend never accesses ML directly.

### Rule 10

ML implementation can change internally without breaking the external ML contract.

### Rule 11

Changes affecting another component must be communicated to the affected team member.

---

# 30. End-to-End Contract

The complete system should follow:

```text
                    FRONTEND
                        │
                 REST / WebSocket
                        │
                        ▼
                    BACKEND
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
          DATABASE               ML
              │                   │
              │                   │
              └─────────┬─────────┘
                        │
                        ▼
                     RESULT
                        │
                        ▼
                    FRONTEND
```

The main audio analysis flow is:

```text
Audio
  ↓
Audio ID
  ↓
Analysis ID
  ↓
ML Prediction
  ↓
Risk Assessment
  ↓
Database
  ↓
Frontend Result
```

---

# 31. API Security Requirements

The API must support:

* Authentication
* Authorization
* Input validation
* Audio file validation
* File-size limits
* Secure password storage
* Rate limiting
* Environment-based secrets
* Ownership checks
* Appropriate error handling

Secrets must never be committed to Git.

---

# 32. Privacy Requirements

VoiceShield may process sensitive voice recordings.

The application should clearly communicate what happens to uploaded audio.

The processing flow may be:

```text
Upload
   ↓
Temporary Processing
   ↓
Analysis
   ↓
Result
   ↓
Temporary Audio Cleanup
```

If audio is intentionally retained for analysis history or speaker profiles, the retention policy should be explicit.

---

# 33. Contract Status

This document represents the **initial VoiceShield API contract**.

The following details must be finalized during implementation before production deployment:

* Exact authentication implementation
* Exact multipart upload behavior
* Exact WebSocket audio format
* Exact WebSocket message structure
* ML transport mechanism
* Pagination implementation
* Rate-limit configuration
* Production error handling
* OpenAPI documentation
* Final request/response schemas

Until those details are finalized, implementation should follow the documented conceptual contract and must not introduce incompatible interfaces.

Any change affecting another component must be coordinated with the relevant team member.

---

# 34. Related Documents

This API contract should be used together with:

```text
docs/ARCHITECTURE.md
docs/DATABASE_SCHEMA.md
docs/ML_SPECIFICATION.md
docs/TECH_STACK.md
docs/SECURITY.md
docs/PRIVACY.md
```

These documents describe different parts of the same VoiceShield system and should remain consistent.
