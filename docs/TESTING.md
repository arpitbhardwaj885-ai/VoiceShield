# VoiceShield — Testing Specification

## 1. Purpose

This document defines the testing strategy for VoiceShield.

Testing must verify that the frontend, FastAPI backend, Supabase database/storage integration, and ML subsystem work correctly within the established architecture.

This document must remain consistent with:

* `PROJECT_SPECIFICATION.md`
* `FEATURES.md`
* `USER_FLOWS.md`
* `ARCHITECTURE.md`
* `API_CONTRACT.md`
* `DATABASE_SCHEMA.md`
* `ML_SPECIFICATION.md`
* `SECURITY.md`
* `PRIVACY.md`

---

# 2. Testing Goals

Testing should verify:

```text
Correctness
Reliability
Security
API Contract Compliance
Database Integrity
Storage Behavior
ML Pipeline Behavior
Frontend Behavior
End-to-End User Flows
```

The objective is to detect implementation problems before deployment or demonstration.

---

# 3. Testing Layers

VoiceShield should use multiple testing layers:

```text
Unit Tests
    ↓
Integration Tests
    ↓
API Tests
    ↓
ML Tests
    ↓
Frontend Tests
    ↓
End-to-End Tests
```

Each layer should test a different responsibility.

---

# 4. Existing Test Structure

The current project contains:

```text
backend/tests/
ml/tests/
tests/
├── e2e/
├── integration/
└── test_data/
```

Existing test directories should be preserved.

Tests should be placed in the directory corresponding to the component being tested.

---

# 5. Unit Testing

Unit tests verify individual functions or small components independently.

Examples include:

```text
Input validation
Audio validation
Utility functions
Feature extraction helpers
ML preprocessing functions
Result formatting
Business-logic functions
```

Unit tests should avoid unnecessary external dependencies.

---

# 6. Backend Unit Testing

Backend unit tests should cover important backend logic.

Examples:

```text
Request validation
Authentication-related logic
Authorization checks
Audio validation
Analysis state handling
Result processing
Error handling
```

The backend tests should verify that invalid input is rejected correctly.

---

# 7. API Testing

API tests verify that FastAPI endpoints follow `API_CONTRACT.md`.

For each endpoint, tests should verify:

```text
HTTP method
Endpoint path
Authentication requirement
Request format
Response format
Status code
Error format
Authorization behavior
```

The API implementation must not silently diverge from the documented contract.

---

# 8. Authentication Testing

Authentication tests should verify:

```text
Valid login
Invalid login
Missing credentials
Expired/invalid authentication state
Unauthenticated access
Registration validation
```

Protected endpoints must reject unauthenticated requests where required.

---

# 9. Authorization Testing

Authorization is separate from authentication.

Tests should verify that:

```text
User A
   ↓
Cannot access
   ↓
User B's private resources
```

Test cases should include:

```text
Unauthorized analysis access
Unauthorized audio access
Unauthorized speaker profile access
Unauthorized deletion
Unauthorized modification
```

Authorization must be enforced by the backend.

---

# 10. Audio Upload Testing

Audio upload tests should verify:

```text
Valid audio accepted
Unsupported format rejected
Invalid audio rejected
Empty file rejected
Oversized file rejected where applicable
Storage failure handled
```

The exact accepted formats and limits must follow the established project specifications.

---

# 11. Audio Recording Testing

Where browser recording is implemented, test:

```text
Microphone permission
Recording start
Recording stop
Recording submission
Invalid recording handling
Recording failure handling
```

Browser-specific behavior should be tested in supported browsers.

---

# 12. Storage Testing

Supabase Storage integration should be tested for:

```text
Upload
Successful storage
Correct storage reference
Access control
Deletion
Missing object handling
Storage failure
```

The application must not expose private audio to unauthorized users.

---

# 13. Database Testing

Supabase PostgreSQL integration should be tested for:

```text
Record creation
Record retrieval
Record update
Record deletion
Relationships
Foreign-key behavior
User ownership
Required fields
Constraints
```

Tests must follow `DATABASE_SCHEMA.md`.

---

# 14. Database Integrity

Tests should verify that related records remain consistent.

Important relationships include:

```text
User
 ├── Analyses
 ├── Audio
 └── Speaker Profiles
       └── Reference Audio
```

The exact relationships must match `DATABASE_SCHEMA.md`.

---

# 15. Analysis Workflow Testing

The main analysis workflow should be tested end-to-end at the integration level.

Expected flow:

```text
Audio
 ↓
FastAPI
 ↓
Validation
 ↓
Supabase Storage
 ↓
ML
 ↓
Result
 ↓
Supabase PostgreSQL
 ↓
API Response
```

Tests should verify that each required stage completes correctly.

---

# 16. Analysis Status Testing

Tests should verify valid state transitions.

Conceptually:

```text
PENDING
   ↓
PROCESSING
   ↓
COMPLETED
```

and:

```text
PENDING
   ↓
PROCESSING
   ↓
FAILED
```

Invalid state transitions should be rejected or prevented according to the implementation.

---

# 17. ML Testing

ML tests should verify the ML subsystem independently from the frontend.

Testing should cover:

```text
Audio preprocessing
Feature extraction
Model loading
Inference
Detection output
Segment analysis
Speaker verification
Result formatting
```

The exact ML tests must follow `ML_SPECIFICATION.md`.

---

# 18. ML Input Testing

ML input tests should include:

```text
Valid audio
Short audio
Longer audio
Unsupported input
Invalid/corrupted audio
Low-quality audio
Boundary cases
```

The purpose is to ensure that the pipeline behaves predictably for supported inputs.

---

# 19. ML Output Testing

ML output should be checked for:

```text
Expected fields
Correct data types
Valid confidence range
Valid classification
Valid segment structure
Valid speaker-verification structure where applicable
```

The ML output must match the defined contract.

---

# 20. No Fabricated ML Results

Tests must ensure that the application does not fabricate ML predictions.

If ML fails:

```text
ML Failure
 ↓
Analysis Failure / Appropriate Error State
```

The system must not return a fake successful prediction.

---

# 21. Segment-Level Testing

Where segment analysis is implemented, tests should verify:

```text
Audio segmentation
Segment boundaries
Segment processing
Segment result association
Combined result generation
```

Segment results must remain associated with the correct analysis.

---

# 22. Speaker Verification Testing

Where speaker verification is implemented, tests should verify:

```text
Reference audio handling
Reference profile association
Verification request
ML verification
Result storage
Result retrieval
Authorization
```

Speaker verification must remain separate from synthetic-speech detection.

---

# 23. Explainability Testing

Where explainability is implemented, tests should verify that:

```text
Explanation data is generated from actual ML/backend output
```

The system must not generate unsupported explanations.

---

# 24. Frontend Testing

Frontend testing should verify:

```text
Page loading
Navigation
Forms
Validation
Authentication behavior
Audio upload
Recording
Loading states
Error states
Result display
History display
Speaker profile interaction
Responsive behavior
```

---

# 25. Frontend API Integration Testing

Frontend API integration should verify that the frontend correctly handles:

```text
Successful response
Validation error
Authentication error
Authorization error
Not found
Server error
Network failure
```

The frontend must interpret responses according to `API_CONTRACT.md`.

---

# 26. UI State Testing

Important UI states include:

```text
Initial
Loading
Success
Empty
Error
Processing
Completed
```

For example:

```text
No Audio
   ↓
Audio Selected
   ↓
Uploading
   ↓
Processing
   ↓
Completed
   ↓
Result Displayed
```

---

# 27. History Testing

History functionality should verify:

```text
History loads
Only user's records are returned
Empty history works
Analysis details open correctly
Invalid analysis ID is handled
Unauthorized analysis access is rejected
```

---

# 28. Speaker Profile Testing

Speaker profile functionality should verify:

```text
Create
Read
Update
Delete
Reference audio association
Authorization
Invalid input
Missing profile
```

---

# 29. Live Analysis Testing

Where live analysis is implemented, test:

```text
Microphone permission
WebSocket connection
Connection failure
Audio transmission
ML processing
Result transmission
Stop operation
Session cleanup
```

The live-analysis flow must follow the established API/architecture contract.

---

# 30. Integration Testing

Integration tests verify communication between components.

Important integrations include:

```text
Frontend ↔ FastAPI
FastAPI ↔ Supabase PostgreSQL
FastAPI ↔ Supabase Storage
FastAPI ↔ ML
```

Integration tests should use controlled test data and environments.

---

# 31. End-to-End Testing

End-to-end tests verify complete user journeys.

The most important E2E flow is:

```text
Register/Login
      ↓
Dashboard
      ↓
Upload Audio
      ↓
Submit Analysis
      ↓
Processing
      ↓
ML Result
      ↓
Result Page
      ↓
History
```

---

# 32. Speaker Verification E2E Flow

Where implemented:

```text
Login
 ↓
Create Speaker Profile
 ↓
Add Reference Audio
 ↓
Upload Analysis Audio
 ↓
Run Analysis
 ↓
Speaker Verification
 ↓
Result
```

---

# 33. Negative Testing

The system must also be tested with invalid actions.

Examples:

```text
Invalid login
Invalid registration
Invalid audio
Unsupported audio
Missing required fields
Unauthorized resource access
Invalid analysis ID
Missing speaker profile
Storage failure
Database failure
ML failure
Network failure
```

---

# 34. Security Testing

Security tests should verify:

```text
Authentication enforcement
Authorization enforcement
Private resource protection
Credential protection
Input validation
Secret handling
Error information exposure
```

The frontend must not expose server-side secrets.

---

# 35. Privacy Testing

Privacy-related testing should verify that:

```text
Private audio remains protected
User resources remain isolated
Unauthorized users cannot retrieve private data
Deletion behavior follows the documented policy
```

Testing must follow `PRIVACY.md`.

---

# 36. Regression Testing

Whenever an existing feature is modified, previously working functionality should be retested.

High-priority regression areas:

```text
Authentication
Audio upload
Analysis
ML integration
Results
History
Speaker verification
Authorization
```

---

# 37. Test Data

Test data should be stored under:

```text
tests/test_data/
```

where appropriate.

Test audio should be clearly identified as test data.

Real private user recordings should not be committed to the repository.

---

# 38. Environment Separation

Testing should avoid accidentally modifying production data.

Where possible:

```text
Development
    ↓
Testing
    ↓
Production
```

should use appropriate environment separation.

Production credentials must not be placed in test files.

---

# 39. Test Configuration

Test configuration should be separated from production configuration.

Secrets should be supplied through environment configuration rather than committed into the repository.

---

# 40. Test Naming

Tests should have descriptive names.

Example:

```text
test_upload_valid_audio()
test_reject_unsupported_audio()
test_unauthorized_analysis_access()
test_analysis_status_changes_to_completed()
```

Test names should clearly describe the behavior being verified.

---

# 41. Test Independence

Tests should be independent wherever practical.

A test should not rely unnecessarily on another test having executed first.

Test setup and cleanup should be controlled explicitly.

---

# 42. Failure Diagnosis

When a test fails, determine which layer is responsible:

```text
Frontend
   ↓
API
   ↓
Backend
   ↓
Database / Storage
   ↓
ML
```

Do not immediately modify unrelated components to hide a failing test.

---

# 43. Contract Testing

The following contracts must be tested for consistency:

```text
Frontend ↔ API
API ↔ Database
Backend ↔ ML
```

Changes to an API response should trigger corresponding frontend and test updates.

---

# 44. Minimum Test Coverage

Before considering the core application ready, the following must have tests:

```text
[ ] Authentication
[ ] Authorization
[ ] Audio validation
[ ] Audio upload
[ ] Analysis request
[ ] Analysis status
[ ] ML response
[ ] Result retrieval
[ ] History
[ ] Database operations
[ ] Storage operations
[ ] Error handling
```

---

# 45. Core End-to-End Acceptance Test

The minimum successful demonstration flow should be:

```text
1. Start application
2. Register or login
3. Open dashboard
4. Open Analyze
5. Upload valid audio
6. Submit analysis
7. Analysis enters processing state
8. ML processes audio
9. Analysis completes
10. Result is returned
11. Result is displayed
12. Analysis appears in history
```

Every step must produce the expected state.

---

# 46. Failure Acceptance Tests

The application should also demonstrate correct behavior for:

```text
Invalid audio
Unauthorized request
Failed analysis
Unavailable ML service
Storage failure
Database failure
```

The UI must display an appropriate state rather than pretending the operation succeeded.

---

# 47. Testing Before Commit

Before committing significant implementation changes:

```text
[ ] Relevant unit tests pass
[ ] Relevant integration tests pass
[ ] API tests pass
[ ] ML tests pass
[ ] Frontend functionality checked
[ ] E2E flow checked where applicable
[ ] No secrets committed
[ ] Documentation remains consistent
```

---

# 48. Testing Before Demo

Before a project demonstration:

```text
[ ] Backend starts successfully
[ ] Frontend loads successfully
[ ] Database connection works
[ ] Supabase Storage works
[ ] ML service works
[ ] Authentication works
[ ] Audio upload works
[ ] Analysis works
[ ] Result page works
[ ] History works
[ ] Main error states work
```

The complete demonstration path should be tested from a clean application state.

---

# 49. Definition of Done

A feature is considered tested when:

```text
[ ] Expected behavior works
[ ] Invalid behavior is handled
[ ] Authentication is tested where applicable
[ ] Authorization is tested where applicable
[ ] API contract is verified
[ ] Database behavior is verified
[ ] Storage behavior is verified
[ ] ML behavior is verified where applicable
[ ] Frontend state handling works
[ ] Relevant regression tests pass
```

---

# 50. Final Testing Rule

Testing must validate the architecture rather than bypass it.

The expected system boundary is:

```text
Frontend
    ↓
FastAPI
    ├── Supabase PostgreSQL
    ├── Supabase Storage
    └── ML
```

Tests must verify these boundaries and their contracts.

A passing test must represent actual system behavior.

Tests must not be written merely to make an implementation appear correct.

No fake ML results, fake database records, hardcoded success responses, or bypassed authorization should be used to satisfy tests.
