# VoiceShield — User Flows

## 1. Purpose

This document defines the primary user flows of VoiceShield.

It describes how users move through the application and how the frontend, FastAPI backend, Supabase services, and ML subsystem interact during major operations.

This document must remain consistent with:

* `PROJECT_SPECIFICATION.md`
* `FEATURES.md`
* `ARCHITECTURE.md`
* `API_CONTRACT.md`
* `DATABASE_SCHEMA.md`
* `ML_SPECIFICATION.md`
* `TECH_STACK.md`
* `SECURITY.md`
* `PRIVACY.md`

---

# 2. Main Application Flow

The primary VoiceShield flow is:

```text
User
  ↓
Frontend
  ↓
Authentication
  ↓
Dashboard
  ↓
Audio Input
  ↓
Backend Validation
  ↓
Audio Storage
  ↓
ML Analysis
  ↓
Analysis Result
  ↓
Database
  ↓
Result Display
  ↓
Analysis History
```

---

# 3. New User Registration Flow

```text
User
 ↓
Registration Page
 ↓
Enter Registration Information
 ↓
Frontend Validation
 ↓
FastAPI
 ↓
Authentication System
 ↓
Account Created
 ↓
Login / Authenticated Application
```

### Steps

1. User opens the registration page.
2. User enters the required registration information.
3. Frontend performs basic validation.
4. Frontend sends the registration request to the backend/authentication system.
5. Backend validates the request.
6. Account creation is performed.
7. User receives appropriate success or failure feedback.
8. User can proceed to authentication.

### Failure Cases

Possible failures include:

* Invalid input
* Missing required information
* Existing account
* Authentication service failure
* Network failure

The application must display an appropriate error without exposing internal implementation details.

---

# 4. Login Flow

```text
User
 ↓
Login Page
 ↓
Credentials
 ↓
FastAPI / Authentication
 ↓
Authenticated Session
 ↓
Dashboard
```

### Steps

1. User opens the login page.
2. User enters authentication information.
3. Frontend performs basic validation.
4. Request is sent to the backend/authentication system.
5. Credentials/session are validated.
6. On success, the user enters the authenticated application.
7. User is directed to the dashboard.

### Failure Cases

* Invalid credentials
* Missing fields
* Authentication service unavailable
* Network failure

---

# 5. Dashboard Flow

After authentication:

```text
Login
 ↓
Dashboard
 ├── Analyze Audio
 ├── Live Analysis
 ├── Analysis History
 ├── Speaker Profiles
 └── Profile
```

The dashboard provides the main navigation point for authenticated functionality.

The dashboard should retrieve user-specific information through FastAPI.

---

# 6. Audio Upload Flow

The standard audio-upload flow is:

```text
User
 ↓
Analyze Page
 ↓
Select Audio File
 ↓
Frontend Validation
 ↓
FastAPI
 ↓
Backend Validation
 ↓
Supabase Storage
 ↓
Database Metadata
 ↓
ML Analysis
 ↓
Result
```

### Steps

1. User opens the analysis page.
2. User selects an audio file.
3. Frontend checks basic file requirements.
4. Frontend sends the file to FastAPI.
5. Backend validates the uploaded file.
6. Backend stores the audio using Supabase Storage.
7. Appropriate metadata is stored in Supabase PostgreSQL.
8. Backend starts or performs the analysis workflow.
9. ML subsystem processes the audio.
10. ML returns structured analysis information.
11. Backend stores the analysis result.
12. Frontend displays the result.

---

# 7. Audio Recording Flow

Where browser recording is supported:

```text
User
 ↓
Analyze Page
 ↓
Allow Microphone
 ↓
Start Recording
 ↓
Capture Audio
 ↓
Stop Recording
 ↓
Review Recording
 ↓
Submit
 ↓
FastAPI
 ↓
Storage
 ↓
ML Analysis
```

### Steps

1. User selects the recording option.
2. Browser requests microphone permission.
3. User starts recording.
4. Audio is captured by the browser.
5. User stops recording.
6. User can review/confirm the recording.
7. Recording is submitted to the backend.
8. Backend validates and stores the audio.
9. Analysis proceeds through the normal pipeline.

---

# 8. Audio Validation Flow

Uploaded or recorded audio passes through validation.

```text
Audio
 ↓
Backend
 ↓
File Validation
 ├── Valid → Continue
 └── Invalid → Error
```

Validation should consider requirements defined by the backend and ML specifications.

Possible invalid conditions include:

* Unsupported format
* Invalid audio
* File too large
* Empty file
* Corrupted input

Invalid audio must not be sent to the ML pipeline.

---

# 9. Standard Analysis Flow

```text
Audio
 ↓
Validation
 ↓
Storage
 ↓
Analysis Request
 ↓
ML Processing
 ↓
Detection
 ↓
Segment Analysis
 ↓
Optional Speaker Verification
 ↓
Combined Result
 ↓
Database
 ↓
Frontend
```

### Steps

1. Audio is accepted by the backend.
2. Backend creates/manages the relevant analysis record.
3. Audio is made available to the ML subsystem.
4. ML preprocessing occurs.
5. Detection is performed.
6. Segment-level processing occurs where applicable.
7. Speaker verification is performed only when requested/configured.
8. ML returns structured results.
9. Backend stores the result.
10. Frontend displays the result.

---

# 10. Analysis Status Flow

An analysis may move through:

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

The exact status values must remain consistent with `API_CONTRACT.md` and `DATABASE_SCHEMA.md`.

The frontend should display the current status appropriately.

---

# 11. Analysis Result Flow

After successful analysis:

```text
ML Result
 ↓
FastAPI
 ↓
Stored Analysis
 ↓
Result Page
```

The result page may display:

* Overall assessment
* Confidence
* Segment findings
* Speaker verification
* Explanation
* Timestamp
* Model information where supported

The frontend must display actual backend/ML output.

It must not fabricate ML results.

---

# 12. Segment Analysis Flow

When segment-level analysis is enabled:

```text
Complete Audio
 ↓
Segmentation
 ↓
Segment 1 ──→ Analysis
Segment 2 ──→ Analysis
Segment 3 ──→ Analysis
...
 ↓
Combined Analysis
 ↓
Result
```

Segment findings should remain associated with the correct analysis.

The exact segmentation methodology is defined in `ML_SPECIFICATION.md`.

---

# 13. Speaker Profile Creation Flow

```text
User
 ↓
Speaker Profiles
 ↓
Create Speaker
 ↓
Enter Speaker Information
 ↓
Save
 ↓
Speaker Profile Created
```

A speaker profile belongs to the authenticated user.

The backend must enforce ownership.

---

# 14. Speaker Reference Audio Flow

```text
Speaker Profile
 ↓
Add Reference Audio
 ↓
Select / Record Audio
 ↓
Backend Validation
 ↓
Supabase Storage
 ↓
Reference Audio Metadata
 ↓
Speaker Profile
```

Reference audio must be protected according to the security and privacy requirements.

---

# 15. Speaker Verification Flow

```text
Analyzed Audio
        +
Speaker Reference Audio
        ↓
FastAPI
        ↓
ML Speaker Verification
        ↓
Verification Result
        ↓
Analysis Result
```

Speaker verification is separate from deepfake detection.

The system should not interpret the two results as the same measurement.

---

# 16. Analysis History Flow

```text
User
 ↓
Dashboard
 ↓
History
 ↓
FastAPI
 ↓
Authorized Analyses
 ↓
History Page
```

### Steps

1. Authenticated user opens history.
2. Frontend requests the user's analysis history.
3. Backend verifies authentication.
4. Backend verifies authorization/ownership.
5. Backend retrieves appropriate records.
6. Frontend displays the history.

The user must not receive another user's private analyses.

---

# 17. Historical Analysis Details Flow

```text
History
 ↓
Select Analysis
 ↓
FastAPI
 ↓
Authorization Check
 ↓
Analysis Details
 ↓
Result Page
```

The backend must verify that the authenticated user is authorized to access the selected analysis.

---

# 18. Audio Deletion Flow

Where deletion is supported:

```text
User
 ↓
Delete Audio
 ↓
FastAPI
 ↓
Authorization Check
 ↓
Supabase Storage
 ↓
Database Metadata
 ↓
Deletion Complete
```

The application should handle both:

```text
Stored Audio
+
Associated Database Metadata
```

and avoid leaving an ambiguous state.

---

# 19. Speaker Deletion Flow

Where speaker deletion is supported:

```text
User
 ↓
Delete Speaker
 ↓
FastAPI
 ↓
Authorization Check
 ↓
Speaker Data / Reference Audio
 ↓
Database / Storage Cleanup
 ↓
Deletion Complete
```

The exact deletion behavior must follow the database and privacy contracts.

---

# 20. Live Analysis Flow

Where live analysis is implemented:

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
 ↓
Live Result
```

### Steps

1. User opens live analysis.
2. Browser requests microphone permission.
3. User starts live analysis.
4. Audio data is captured.
5. Audio data is transmitted through the defined real-time channel.
6. FastAPI manages the communication.
7. ML processes appropriate audio data.
8. ML returns analysis information.
9. Backend sends appropriate results to the frontend.
10. User sees the current live-analysis state/result.

---

# 21. Live Analysis Stop Flow

```text
User
 ↓
Stop
 ↓
Browser Stops Capture
 ↓
WebSocket / Backend Session Ends
 ↓
Final State
```

The frontend should clearly indicate that live analysis has stopped.

---

# 22. Authentication Guard Flow

Protected pages must follow:

```text
Page Request
 ↓
Authentication Check
 ├── Authenticated → Continue
 └── Not Authenticated → Login
```

The frontend may perform an initial session check, but actual authorization must be enforced by the backend.

---

# 23. Authorization Flow

For protected resources:

```text
Request
 ↓
Authentication
 ↓
Authorization
 ├── Allowed → Resource
 └── Denied → Error
```

Authorization must be enforced server-side.

Frontend visibility is not sufficient for protecting resources.

---

# 24. Error Flow

General application error flow:

```text
User Action
 ↓
Request
 ↓
Validation / Processing
 ↓
Error
 ↓
FastAPI Structured Error
 ↓
Frontend Error State
 ↓
User Feedback
```

Examples:

```text
Invalid audio
Upload failure
Authentication failure
Unauthorized request
Database failure
Storage failure
ML failure
Timeout
Network failure
```

---

# 25. ML Failure Flow

If ML processing fails:

```text
Analysis
 ↓
ML Processing
 ↓
Failure
 ↓
FastAPI
 ↓
Analysis = FAILED
 ↓
Frontend
 ↓
User sees failure
```

The application must not convert an ML failure into a fabricated successful result.

---

# 26. Storage Failure Flow

If audio storage fails:

```text
Upload
 ↓
FastAPI
 ↓
Supabase Storage
 ↓
Failure
 ↓
Analysis Not Started
 ↓
Error Returned
```

The system should avoid starting an analysis for audio that was not successfully stored or otherwise made available according to the defined workflow.

---

# 27. Database Failure Flow

If a required database operation fails:

```text
Request
 ↓
FastAPI
 ↓
Database
 ↓
Failure
 ↓
Structured Error
 ↓
Frontend
```

The system should avoid reporting a successful operation when the required database operation did not complete.

---

# 28. Unauthorized Access Flow

```text
User Request
 ↓
FastAPI
 ↓
Authorization Check
 ↓
Unauthorized
 ↓
Appropriate Error
```

No private resource should be returned.

---

# 29. Empty History Flow

```text
User
 ↓
History
 ↓
FastAPI
 ↓
No Analyses
 ↓
Empty State
```

The frontend should show a useful empty state instead of displaying an error.

---

# 30. No Speaker Profile Flow

```text
Speaker Profiles
 ↓
No Profiles
 ↓
Empty State
 ↓
Create Speaker Action
```

The user should be given a clear next action.

---

# 31. Loading Flow

Long-running operations should communicate their current state.

Example:

```text
User Action
 ↓
Request Started
 ↓
Loading
 ↓
Processing
 ↓
Result / Error
```

The frontend should prevent confusing duplicate actions where appropriate.

---

# 32. Complete User Journey

The primary complete journey is:

```text
                    USER
                      │
                      ▼
                 REGISTER / LOGIN
                      │
                      ▼
                  DASHBOARD
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
        ANALYZE AUDIO     SPEAKER PROFILE
             │                 │
      ┌──────┴──────┐          │
      │             │          ▼
      ▼             ▼      REFERENCE AUDIO
    UPLOAD        RECORD         │
      │             │            │
      └──────┬──────┘            │
             ▼                   │
          VALIDATE               │
             │                   │
             ▼                   │
          STORAGE                │
             │                   │
             └────────┬──────────┘
                      ▼
                   ANALYSIS
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
      DEEPFAKE DETECTION   SPEAKER VERIFY
             │                 │
             └────────┬────────┘
                      ▼
                    RESULT
                      │
             ┌────────┴────────┐
             ▼                 ▼
          EXPLANATION        HISTORY
```

---

# 33. Responsibility Boundaries

## Frontend

Responsible for:

* User interaction
* Form handling
* Audio selection/recording
* Displaying loading states
* Displaying results
* Displaying errors
* Navigation

## FastAPI Backend

Responsible for:

* Authentication integration
* Authorization
* Validation
* API handling
* Business logic
* Storage interaction
* Database interaction
* ML orchestration

## Supabase

Responsible for:

* PostgreSQL database
* Persistent storage

## ML

Responsible for:

* Audio preprocessing
* Feature extraction
* Deepfake detection
* Segment analysis
* Speaker verification
* ML result generation

---

# 34. Flow Consistency Rules

All user flows must respect:

```text
Frontend
   ↓
FastAPI
   ↓
Supabase / ML
```

The frontend must not bypass FastAPI for protected application operations.

The ML subsystem must not become the application's authentication or user-management layer.

Supabase must remain the defined database/storage infrastructure.

---

# 35. No Fabricated Results

At no point in any user flow should the system create artificial ML results.

If ML is unavailable:

```text
ML unavailable
```

must be represented as a failure or unavailable state.

It must not be replaced with an invented prediction.

---

# 36. Flow Completion Criteria

A user flow is complete when:

```text
[ ] User action is available
[ ] Frontend behavior works
[ ] Backend API works
[ ] Authentication is handled
[ ] Authorization is enforced
[ ] Database behavior is correct
[ ] Storage behavior is correct where applicable
[ ] ML integration is correct where applicable
[ ] Loading state exists
[ ] Error state exists
[ ] Result state exists
[ ] Documentation remains consistent
```

---

# 37. Final Rule

These flows define the intended user journeys of VoiceShield.

They do not override the more specific technical contracts.

When implementing a flow:

```text
User Flow
    ↓
API Contract
    ↓
Architecture
    ↓
Database Schema
    ↓
ML Specification
    ↓
Security / Privacy
```

If an implementation requirement is missing or contradictory, it must be identified before making a major architectural assumption.
