# VoiceShield — API Contract

## 1. Purpose

This document defines the communication contract between the VoiceShield frontend, backend, and ML service.

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

Production URL will be configured later.

---

# 3. Authentication

VoiceShield uses JWT-based authentication.

After successful login, the backend returns an access token.

The frontend sends the token with protected requests:

```http
Authorization: Bearer <access_token>
```

Protected endpoints must reject requests without valid authentication.

---

# 4. Standard Response Format

Successful responses should follow a consistent structure.

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

The backend should use appropriate HTTP status codes.

Examples:

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

# 5. Authentication APIs

## 5.1 Register

```http
POST /api/auth/register
```

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

---

# 6. Login

```http
POST /api/auth/login
```

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

# 7. Current User

```http
GET /api/auth/me
```

Authentication required.

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

# 8. Audio Upload

```http
POST /api/audio/upload
```

Authentication required.

Content type:

```text
multipart/form-data
```

### Form fields

```text
file
```

Optional:

```text
speaker_id
```

Supported formats should initially include:

```text
.wav
.mp3
.flac
.m4a
```

The backend validates:

* File extension
* MIME type
* File size
* Audio readability
* Duration limits

### Response

```json
{
  "success": true,
  "data": {
    "audio_id": "uuid",
    "filename": "recording.wav",
    "duration": 42.5,
    "format": "wav",
    "status": "uploaded"
  },
  "message": "Audio uploaded successfully"
}
```

---

# 9. Create Analysis

```http
POST /api/analysis
```

Authentication required.

### Request

```json
{
  "audio_id": "uuid",
  "speaker_id": "uuid",
  "analysis_type": "full"
}
```

`speaker_id` is optional.

Possible analysis types:

```text
full
deepfake_only
speaker_verification
```

### Response

```json
{
  "success": true,
  "data": {
    "analysis_id": "uuid",
    "status": "processing"
  },
  "message": "Analysis started"
}
```

---

# 10. Analysis Status

```http
GET /api/analysis/{analysis_id}
```

Authentication required.

Possible statuses:

```text
queued
processing
completed
failed
```

### Processing response

```json
{
  "success": true,
  "data": {
    "analysis_id": "uuid",
    "status": "processing"
  }
}
```

---

# 11. Completed Analysis Response

When analysis is complete:

```json
{
  "success": true,
  "data": {
    "analysis_id": "uuid",
    "status": "completed",

    "ai_probability": 0.91,
    "authentic_probability": 0.09,

    "speaker_similarity": 0.87,

    "risk": {
      "level": "HIGH",
      "score": 0.89
    },

    "segments": [
      {
        "id": "segment-uuid",
        "start": 8.0,
        "end": 12.0,
        "ai_probability": 0.94,
        "risk_level": "HIGH"
      }
    ],

    "explanation": {
      "indicators": [
        "Synthetic speech indicators detected",
        "Multiple suspicious segments identified"
      ]
    },

    "model": {
      "name": "VoiceShield Detector",
      "version": "1.0"
    },

    "created_at": "2026-09-02T10:00:00Z"
  }
}
```

---

# 12. Analysis History

```http
GET /api/history
```

Authentication required.

Optional query parameters:

```text
?page=1
&limit=20
&risk=HIGH
&search=recording
```

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "analysis_id": "uuid",
        "filename": "call.wav",
        "ai_probability": 0.91,
        "risk_level": "HIGH",
        "created_at": "2026-09-02T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 127
    }
  }
}
```

---

# 13. Delete Analysis

```http
DELETE /api/analysis/{analysis_id}
```

Authentication required.

### Response

```json
{
  "success": true,
  "data": null,
  "message": "Analysis deleted successfully"
}
```

Users may only delete analyses belonging to their account.

---

# 14. Speaker Profiles

## Create Speaker

```http
POST /api/speakers
```

Authentication required.

### Request

```json
{
  "name": "John"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "speaker_id": "uuid",
    "name": "John",
    "status": "created"
  }
}
```

---

# 15. Add Speaker Reference Audio

```http
POST /api/speakers/{speaker_id}/audio
```

Authentication required.

Content type:

```text
multipart/form-data
```

### Response

```json
{
  "success": true,
  "data": {
    "speaker_id": "uuid",
    "reference_audio_id": "uuid",
    "status": "processing"
  }
}
```

The ML service will eventually generate the speaker representation/embedding.

---

# 16. List Speakers

```http
GET /api/speakers
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "speaker_id": "uuid",
      "name": "John",
      "reference_count": 3,
      "status": "ready"
    }
  ]
}
```

---

# 17. Speaker Verification

```http
POST /api/speakers/{speaker_id}/verify
```

Authentication required.

### Request

```json
{
  "audio_id": "uuid"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "speaker_id": "uuid",
    "similarity": 0.87,
    "confidence": 0.91,
    "result": "MATCH"
  }
}
```

Possible results:

```text
MATCH
NO_MATCH
INCONCLUSIVE
```

---

# 18. Live Analysis WebSocket

Endpoint:

```text
WS /api/live-analysis
```

Authentication must be established before the live-analysis session.

Conceptual flow:

```text
Frontend
   │
   │ WebSocket connection
   ▼
Backend
   │
   │ audio chunks
   ▼
ML Service
   │
   │ partial prediction
   ▼
Backend
   │
   │ WebSocket message
   ▼
Frontend
```

---

# 19. Live Session Start

Frontend sends:

```json
{
  "type": "start",
  "session_id": "uuid",
  "speaker_id": "uuid"
}
```

`speaker_id` is optional.

Backend responds:

```json
{
  "type": "session_started",
  "session_id": "uuid"
}
```

---

# 20. Live Audio Chunk

Frontend sends audio chunks.

Conceptually:

```text
Binary WebSocket message
```

or a defined encoded format.

The exact browser audio format will be finalized during implementation.

---

# 21. Live Analysis Result

Backend sends partial results:

```json
{
  "type": "analysis_update",
  "session_id": "uuid",
  "timestamp": 15.5,

  "ai_probability": 0.78,
  "authentic_probability": 0.22,

  "speaker_similarity": 0.84,

  "risk": {
    "level": "MEDIUM",
    "score": 0.71
  }
}
```

---

# 22. Live Suspicious Segment

If suspicious activity is detected:

```json
{
  "type": "suspicious_segment",
  "session_id": "uuid",

  "segment": {
    "start": 15.0,
    "end": 20.0,
    "ai_probability": 0.93,
    "risk_level": "HIGH"
  }
}
```

---

# 23. Live Session End

Frontend:

```json
{
  "type": "stop",
  "session_id": "uuid"
}
```

Backend:

```json
{
  "type": "session_completed",
  "session_id": "uuid",
  "message": "Live analysis completed"
}
```

---

# 24. ML Service Contract

The backend communicates with the ML service.

The ML service should remain independent from the frontend.

Conceptual endpoint:

```http
POST /predict
```

The backend sends:

```text
Audio
+
Analysis configuration
+
Optional speaker reference
```

The ML service returns standardized JSON.

---

# 25. ML Request

Conceptual structure:

```json
{
  "analysis_id": "uuid",
  "audio_path": "/path/to/audio.wav",
  "analysis_type": "full",
  "speaker_reference": null
}
```

The exact transport mechanism may be changed later if the ML service uses a shared volume or object storage.

The logical contract remains the same.

---

# 26. ML Response

```json
{
  "analysis_id": "uuid",

  "ai_probability": 0.91,
  "authentic_probability": 0.09,

  "speaker_similarity": 0.87,

  "segments": [
    {
      "start": 8.0,
      "end": 12.0,
      "ai_probability": 0.94
    },
    {
      "start": 27.0,
      "end": 31.0,
      "ai_probability": 0.91
    }
  ],

  "confidence": 0.93,

  "explanation": {
    "indicators": [
      "Synthetic speech characteristics detected"
    ]
  },

  "model": {
    "name": "VoiceShield Detector",
    "version": "1.0"
  }
}
```

---

# 27. Important ML Contract Rule

The ML team is free to change:

* Model architecture
* Feature extraction
* Preprocessing
* Training procedure
* Dataset
* Internal algorithms

as long as the **external ML output contract remains compatible**.

For example, the ML team may replace:

```text
Model A
```

with:

```text
Model B
```

without requiring the frontend to change.

---

# 28. Risk Levels

The application recognizes:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

The backend's risk engine is responsible for converting ML signals into the final application risk.

The ML model must not directly control UI wording.

For example:

```text
ML:
ai_probability = 0.91

Backend:
risk_level = HIGH

Frontend:
Display HIGH
```

---

# 29. Error Codes

Standard application error codes:

```text
AUTH_REQUIRED
INVALID_CREDENTIALS
USER_EXISTS
USER_NOT_FOUND

INVALID_AUDIO
UNSUPPORTED_AUDIO_FORMAT
AUDIO_TOO_LARGE
AUDIO_CORRUPTED
AUDIO_PROCESSING_FAILED

ANALYSIS_NOT_FOUND
ANALYSIS_FAILED
ANALYSIS_IN_PROGRESS

SPEAKER_NOT_FOUND
SPEAKER_NOT_READY
SPEAKER_VERIFICATION_FAILED

ML_SERVICE_UNAVAILABLE
ML_ANALYSIS_FAILED

RATE_LIMITED
INTERNAL_ERROR
```

---

# 30. Health Check

```http
GET /api/health
```

Response:

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

If a dependency is unavailable, the backend should report degraded status appropriately.

---

# 31. API Ownership

## Frontend Member

Consumes:

```text
/api/auth/*
/api/audio/*
/api/analysis/*
/api/history
/api/speakers/*
/api/live-analysis
```

The frontend does not modify backend API definitions independently.

---

## Backend Member

Owns:

```text
/api/*
```

Responsible for:

* Request validation
* Authentication
* Authorization
* Business logic
* ML communication
* Database communication
* Response formatting

---

## Database Member

Does not create public APIs.

Instead, the database member provides:


Database schema
Relationships
Indexes
Migrations
```

The backend consumes the database through SQLAlchemy.

---

## ML Member

Owns:


ML Service Contract


The ML member guarantees that the agreed request/response structure remains compatible.

---

# 32. API Versioning

The initial API uses:

```text
/api
```

If a breaking change becomes necessary, introduce:

```text
/api/v2
```

Do not silently change an existing endpoint's response structure.

---

# 33. API Contract Rules

### Rule 1

Do not rename API fields without team agreement.

### Rule 2

Do not change data types without team agreement.

### Rule 3

Do not remove fields without checking frontend/backend dependencies.

### Rule 4

New optional fields are preferred over breaking existing fields.

### Rule 5

Breaking changes require an API version change when necessary.

### Rule 6

All protected endpoints require authentication.

### Rule 7

Users can access only their own analyses and speaker profiles.

### Rule 8

Frontend never accesses PostgreSQL directly.

### Rule 9

Frontend never accesses ML directly.

### Rule 10

ML implementation can change internally without breaking the external ML contract.

---

# 34. End-to-End Contract

The complete system should follow:


                    FRONTEND
                        │
                        │ REST
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

The critical data flow is:

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

# 35. Contract Status

This document represents the **initial VoiceShield API contract**.

Before production deployment, the team must additionally finalize:

* Exact authentication implementation
* Exact multipart upload behavior
* Exact WebSocket audio format
* ML transport mechanism
* Pagination implementation
* Rate-limit configuration
* Production error handling
* API documentation/OpenAPI definitions

Any changes must be coordinated between affected team members.
