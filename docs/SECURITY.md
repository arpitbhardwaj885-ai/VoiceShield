# VoiceShield — Security Specification

## 1. Purpose

This document defines the security requirements for VoiceShield.

The purpose is to ensure that:

* User accounts are protected
* APIs are protected
* Audio files are protected
* Supabase credentials remain secure
* ML services are not exposed unnecessarily
* Users can access only resources they are authorized to access
* Sensitive information is not unnecessarily exposed through logs or errors

This document must remain consistent with:

```text
docs/ARCHITECTURE.md
docs/API_CONTRACT.md
docs/DATABASE_SCHEMA.md
docs/ML_SPECIFICATION.md
docs/TECH_STACK.md
```

---

# 2. Security Architecture

VoiceShield follows this security boundary:

```text
┌──────────────────────┐
│       FRONTEND       │
│                      │
│ HTML + CSS +         │
│ Bootstrap + JS       │
└──────────┬───────────┘
           │
           │ HTTPS
           ▼
┌──────────────────────┐
│       FASTAPI        │
│       BACKEND        │
│                      │
│ Authentication       │
│ Authorization        │
│ Validation           │
│ Business Logic       │
└───────┬───────┬──────┘
        │       │
        │       │ HTTP
        │       ▼
        │   ┌──────────────┐
        │   │  ML SERVICE  │
        │   └──────────────┘
        │
        ▼
┌──────────────────────┐
│       SUPABASE       │
│                      │
│ PostgreSQL           │
│ Storage              │
└──────────────────────┘
```

The backend is the primary security boundary between the frontend and protected application resources.

---

# 3. Core Security Principles

VoiceShield follows these principles:

1. Never trust client input.
2. Authenticate users before accessing protected resources.
3. Authorize every protected resource request.
4. Never expose private credentials to the frontend.
5. Validate uploaded files.
6. Minimize sensitive data exposure.
7. Use HTTPS in production.
8. Do not expose internal errors to users.
9. Keep ML service access controlled.
10. Follow least-privilege principles.
11. Do not store secrets in source control.
12. Do not allow one user to access another user's private data.

---

# 4. Authentication

Authentication determines whether a user is a valid VoiceShield user.

Protected functionality must require authentication where defined by the API contract.

Examples include:

```text
User profile
Audio history
Private audio files
Analysis results
Speaker profiles
Speaker reference recordings
```

The frontend is responsible for presenting authentication UI.

The backend is responsible for enforcing authentication.

---

# 5. Authorization

Authentication alone is not sufficient.

After identifying a user, the backend must verify that the user is authorized to access the requested resource.

Conceptually:

```text
Request
   ↓
Authentication
   ↓
Identify User
   ↓
Authorization
   ↓
Resource Access
```

A user must not be able to access another user's:

* Audio files
* Analysis results
* Speaker profiles
* Speaker reference audio
* Private account data

---

# 6. Resource Ownership

Resources associated with a user must have an ownership relationship.

Examples:

```text
User
  ↓
Audio Files
  ↓
Analyses
```

and:

```text
User
  ↓
Speakers
  ↓
Reference Audio
```

The backend must verify ownership before returning or modifying protected resources.

---

# 7. IDOR Protection

The backend must protect against insecure direct object reference vulnerabilities.

For example, changing:

```text
/analyses/{analysis_id}
```

to another user's `analysis_id` must not allow unauthorized access.

The backend must verify:

```text
Authenticated User
        ↓
Owns / Can Access Resource
        ↓
Allow
```

Otherwise:

```text
403 Forbidden
```

or the appropriate API error must be returned.

---

# 8. Frontend Security Boundary

The frontend must be treated as an untrusted client.

Anything received from the frontend must be validated by the backend.

The backend must not assume that:

```text
Buttons
Forms
JavaScript validation
Hidden fields
Disabled controls
```

provide security.

Client-side validation improves user experience but does not replace server-side validation.

---

# 9. API Authentication

Protected API endpoints must require appropriate authentication.

The authentication mechanism must be implemented consistently across:

```text
Frontend
FastAPI
Supabase
```

The frontend must send the required authentication information with protected API requests.

The backend must validate it before processing protected operations.

---

# 10. API Authorization

Each protected endpoint must define whether authentication is required.

Conceptually:

```text
Public Endpoint
    ↓
No authenticated user required

Protected Endpoint
    ↓
Authenticated user required

User-Owned Resource
    ↓
Authenticated + Authorized user required
```

The API contract is the source of truth for endpoint behavior.

---

# 11. HTTP Security

Production communication must use HTTPS.

The intended flow is:

```text
Browser
   ↓
HTTPS
   ↓
FastAPI
```

Sensitive information must not be transmitted over unencrypted HTTP in production.

---

# 12. CORS

Cross-Origin Resource Sharing must be explicitly configured.

The backend should allow only the frontend origins required by the application.

Do not use an unrestricted production configuration such as:

```text
allow_origins = ["*"]
```

when credentials or protected authentication mechanisms are involved.

Development and production origins may be different.

---

# 13. Request Validation

FastAPI must validate incoming requests.

Validation should cover:

* Required fields
* Data types
* Field lengths
* Allowed values
* UUID formats
* Pagination parameters
* Query parameters
* Request bodies
* Uploaded files

Invalid requests must be rejected before unnecessary processing.

---

# 14. Audio Upload Security

Audio uploads are untrusted input.

The backend must validate uploaded audio before processing it.

Validation should include appropriate checks for:

```text
File type
File extension
File size
Decodability
Audio properties
```

Do not rely only on the filename extension.

For example:

```text
malicious_file.exe
```

must not become trusted simply because a client changes its filename.

---

# 15. File Size Limits

Audio uploads must have a maximum allowed size.

The backend should reject files exceeding the configured limit.

This helps prevent:

```text
Memory exhaustion
Storage abuse
Processing abuse
Denial-of-service conditions
```

The exact maximum size should be configured rather than hard-coded in multiple locations.

---

# 16. Audio Processing Security

Uploaded audio must be processed safely.

The ML pipeline must not execute uploaded content as code.

The system must treat audio as data.

Processing libraries should be used in a controlled manner.

Unexpected or corrupted audio should result in a controlled error.

---

# 17. Temporary Files

ML processing may require temporary files.

The flow is:

```text
Upload
  ↓
Temporary Processing File
  ↓
ML Analysis
  ↓
Result
  ↓
Cleanup
```

Temporary files should be deleted when they are no longer required.

Temporary files must not become an unintended permanent storage mechanism.

---

# 18. Supabase Security

VoiceShield uses:

```text
Supabase PostgreSQL
Supabase Storage
```

Supabase access must follow the project's authorization model.

The frontend must never receive credentials that provide unrestricted backend/database privileges.

---

# 19. Supabase Service Credentials

A Supabase service-role credential is highly privileged.

It must:

```text
Remain server-side
Never be placed in frontend JavaScript
Never be committed to Git
Never be included in public documentation
Never be returned through an API response
```

If the backend requires privileged Supabase access, that credential must remain in the backend environment.

---

# 20. Environment Variables

Secrets must be supplied through environment configuration.

Potential configuration values include:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
ML_SERVICE_URL
SECRET_KEY
```

The exact names used by the implementation must be consistent throughout the project.

Secrets must not be hard-coded into source files.

---

# 21. `.env` Security

Local environment files may contain secrets.

They must not be committed to Git.

The repository should contain an example configuration such as:

```text
.env.example
```

containing placeholders only.

Example:

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ML_SERVICE_URL=
SECRET_KEY=
```

No real credentials should appear in `.env.example`.

---

# 22. Secret Rotation

If a credential is accidentally exposed:

```text
1. Revoke/rotate the credential.
2. Remove it from exposed locations.
3. Update the environment configuration.
4. Check repository history where appropriate.
5. Verify that the application still works.
```

Never assume that deleting a secret from the latest commit makes an exposed secret safe.

---

# 23. Password Security

If VoiceShield manages passwords directly, passwords must never be stored in plaintext.

Passwords must be handled using an appropriate password-hashing mechanism.

However, if authentication is delegated to an authentication provider, the application should not duplicate password storage unnecessarily.

The final implementation must follow the selected authentication architecture.

---

# 24. Session / Token Security

Authentication tokens or session information must be handled securely.

The application must:

* Avoid exposing tokens unnecessarily
* Avoid logging tokens
* Avoid placing sensitive credentials into URLs
* Validate authentication information server-side
* Expire/revoke sessions according to the selected authentication mechanism

The exact mechanism must remain consistent with the authentication implementation.

---

# 25. API Rate Limiting

Resource-intensive endpoints should be protected against abuse.

Particularly important endpoints include:

```text
Audio upload
Audio analysis
Live analysis
Speaker verification
```

Rate limiting or equivalent resource controls should be considered for these operations.

The implementation should choose appropriate limits based on actual deployment requirements.

---

# 26. ML Service Security

The ML service must not be treated as a public unrestricted API.

Preferred communication:

```text
FastAPI Backend
      ↓
Controlled ML Service
```

The ML service should accept requests from authorized backend infrastructure.

The ML service should not independently expose user-management functionality.

---

# 27. ML Service Authentication

If the ML service is deployed separately, communication between FastAPI and ML should be protected.

Possible mechanisms include:

```text
Internal network restrictions
Authentication token
API key
Private service networking
```

The final mechanism depends on the deployment environment.

The important requirement is:

```text
Public user
    X
    ↓
Direct unrestricted ML access
```

Users should access ML functionality through the application backend.

---

# 28. ML Resource Protection

ML inference can be computationally expensive.

The system should protect against excessive requests.

Controls may include:

```text
Request limits
File-size limits
Processing timeouts
Concurrency limits
Rate limits
```

The exact values should be determined during implementation and deployment testing.

---

# 29. Database Security

Database access must be restricted.

The frontend must not connect directly to PostgreSQL.

The ML service must not directly modify application database records.

The intended flow is:

```text
Frontend
   ↓
FastAPI
   ↓
Supabase PostgreSQL
```

---

# 30. Database Input Safety

Database queries must not be constructed by unsafe string concatenation.

Use the selected database abstraction/query mechanism safely.

User-controlled values must be treated as untrusted input.

---

# 31. Storage Security

Audio files stored in Supabase Storage may contain sensitive information.

Access must be controlled according to user authorization.

Private audio should not be exposed through permanently public URLs unless the application explicitly requires that behavior.

Where temporary access is required, use an appropriate controlled access mechanism.

---

# 32. Storage Paths

Storage paths should be organized so that ownership can be enforced.

Conceptually:

```text
users/
    <user_id>/
        audio/
        speakers/
```

The exact storage path must remain consistent with the database/storage implementation.

Do not expose internal storage implementation details unnecessarily to users.

---

# 33. Analysis Result Security

Analysis results may contain sensitive information.

A user must only be able to access their authorized results.

For example:

```text
User A
   ↓
Analysis A
   ✓ allowed

User A
   ↓
Analysis B owned by User B
   ✗ denied
```

---

# 34. Speaker Data Security

Speaker profiles and reference recordings may contain sensitive voice information.

Access must be restricted to authorized users.

Reference recordings must not become publicly accessible merely because they are stored in the application.

---

# 35. Error Handling

Production errors must not expose:

```text
Stack traces
Database credentials
API keys
File-system paths
Internal service addresses
Model internals
Authentication tokens
```

Users should receive controlled error messages.

Example:

```json
{
    "error": {
        "code": "INTERNAL_ERROR",
        "message": "An unexpected error occurred."
    }
}
```

Detailed diagnostics should remain in protected server logs.

---

# 36. Logging

Logs should help diagnose problems without unnecessarily exposing sensitive information.

Do not log:

```text
Passwords
Authentication tokens
API keys
Service-role credentials
Private audio contents
Sensitive user information
```

Logs should preferably contain safe identifiers such as:

```text
request_id
analysis_id
timestamp
error_code
service
```

where appropriate.

---

# 37. Logging Audio

The system must not log raw audio content.

Avoid logging:

```text
Audio binary
Base64 audio
Complete audio payloads
Private recording contents
```

Only necessary metadata should be logged.

---

# 38. Security Headers

The production frontend/backend deployment should use appropriate HTTP security headers.

Depending on deployment requirements, these may include:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Strict-Transport-Security
```

The final configuration should be tested rather than blindly copied.

---

# 39. XSS Protection

User-controlled text must not be inserted into the frontend as trusted HTML.

JavaScript should prefer safe DOM APIs and text rendering.

Be especially careful with:

```text
User names
Analysis descriptions
Error messages
File names
Speaker names
```

Do not use unsafe HTML injection for user-controlled values.

---

# 40. CSRF Considerations

The CSRF protection strategy must depend on the selected authentication mechanism.

If browser cookies are used for authentication, appropriate CSRF protections must be implemented.

If a bearer-token architecture is used, the CSRF threat model differs.

Do not add or remove CSRF mechanisms without considering the actual authentication architecture.

---

# 41. Dependency Security

Third-party dependencies should be kept reasonably up to date.

Dependencies should be reviewed for known vulnerabilities.

Do not add libraries simply for convenience when the existing stack already provides the required capability.

---

# 42. Dependency Boundaries

The project must maintain the selected technology stack:

```text
Frontend
    HTML
    CSS
    Bootstrap
    JavaScript

Backend
    Python
    FastAPI

Database
    Supabase PostgreSQL

Storage
    Supabase Storage

ML
    Python
```

Security dependencies should support this architecture rather than replacing it.

---

# 43. Authentication vs Authorization

These concepts must remain separate.

### Authentication

Answers:

```text
"Who is this user?"
```

### Authorization

Answers:

```text
"Is this user allowed to perform this action?"
```

Both must be enforced where required.

---

# 44. Least Privilege

Each component should receive only the permissions it requires.

Conceptually:

```text
Frontend
    ↓
Minimal public/client privileges

Backend
    ↓
Application-level privileges

ML
    ↓
ML processing privileges only
```

Do not give the ML service unnecessary database or storage permissions.

---

# 45. Secure Communication Boundaries

The intended boundaries are:

```text
Browser → FastAPI
        HTTPS

FastAPI → ML
        Controlled HTTP

FastAPI → Supabase
        Secure server-side connection
```

Production traffic should use encrypted communication where applicable.

---

# 46. Security of Live Analysis

Live analysis introduces additional security concerns.

The system must:

* Authenticate the session
* Authorize the analysis request
* Validate incoming audio chunks
* Control resource usage
* Prevent unauthorized WebSocket access
* Close invalid/expired connections
* Avoid exposing another user's live session

The WebSocket must not become an authentication bypass.

---

# 47. WebSocket Authorization

For live analysis:

```text
WebSocket Connection
        ↓
Authentication
        ↓
Authorization
        ↓
Live Analysis
```

The server must verify that the connected user is allowed to start and continue the requested analysis.

---

# 48. Input Sanitization

User-provided text such as:

```text
Speaker name
File name
Profile information
Search parameters
```

must be validated and safely handled.

Input sanitization must not be treated as a replacement for proper output encoding and parameterized database operations.

---

# 49. File Name Security

Uploaded filenames must not be trusted as filesystem paths.

Do not allow user-controlled filenames to cause path traversal.

Unsafe concepts such as:

```text
../../file
```

must not be used directly as local filesystem paths.

Generated safe names or controlled storage paths should be preferred.

---

# 50. Path Traversal Protection

Any user-controlled path or identifier must be validated.

The application must prevent access to arbitrary filesystem locations.

The ML service should only access files explicitly provided for the current analysis.

---

# 51. Denial-of-Service Protection

Potential expensive operations include:

```text
Large audio uploads
Long recordings
Repeated ML inference
Live analysis
Speaker verification
```

The application should implement appropriate:

```text
File limits
Timeouts
Rate limits
Concurrency controls
Resource limits
```

---

# 52. Privacy by Design

Security and privacy should be considered during implementation rather than added after the application is complete.

The system should minimize:

```text
Data collection
Data retention
Sensitive logging
Unnecessary access
Unnecessary duplication
```

---

# 53. Data Deletion

When application functionality allows deletion of an audio file or related resource, deletion must consider both:

```text
Database metadata
+
Supabase Storage object
```

Deleting only the database record must not unintentionally leave private audio permanently stored.

Likewise, deleting storage without updating related database state must be handled safely.

---

# 54. Security Testing

Security testing should include:

```text
Authentication testing
Authorization testing
IDOR testing
Upload validation testing
Invalid input testing
CORS testing
API access testing
Storage access testing
WebSocket authorization testing
Secret exposure checks
```

---

# 55. Minimum Security Test Cases

The implementation should verify at least:

```text
[ ] Unauthenticated user cannot access protected endpoints
[ ] User cannot access another user's analysis
[ ] User cannot access another user's audio
[ ] User cannot access another user's speaker data
[ ] Invalid audio uploads are rejected
[ ] Oversized uploads are rejected
[ ] Invalid API input is rejected
[ ] Service credentials are not exposed to frontend
[ ] .env is not committed
[ ] ML service is not unrestricted
[ ] WebSocket authorization works
[ ] Production errors do not expose stack traces
[ ] Sensitive values are not written to logs
```

---

# 56. Security Incident Handling

If a security issue is discovered:

```text
1. Stop further exposure where possible.
2. Identify the affected component.
3. Revoke compromised credentials if necessary.
4. Fix the vulnerability.
5. Test the fix.
6. Review related components.
7. Rotate affected secrets.
8. Document the incident.
```

---

# 57. Security Implementation Rule

Gemini or any implementation agent must not weaken security to make an implementation easier.

For example, it must not:

```text
Disable authentication
Allow all CORS origins without reason
Make private storage public
Expose service-role keys
Skip file validation
Disable authorization checks
Return stack traces
Hard-code secrets
```

simply because doing so makes development easier.

---

# 58. Security Configuration Rule

Security-sensitive configuration must be centralized where practical.

Avoid having separate hard-coded values scattered across:

```text
Frontend
Backend
ML
Database scripts
Deployment files
```

Use environment/configuration mechanisms consistently.

---

# 59. Development vs Production

Development settings may be less restrictive where necessary, but production must use secure configuration.

For example:

```text
Development:
localhost origins may be allowed.

Production:
Only approved frontend origins should be allowed.
```

Development shortcuts must not accidentally become production defaults.

---

# 60. Security Definition of Done

Security implementation is considered acceptable when:

```text
[ ] Authentication is implemented
[ ] Authorization is enforced
[ ] Resource ownership is checked
[ ] API input is validated
[ ] Audio uploads are validated
[ ] File-size limits exist
[ ] Private storage is protected
[ ] Supabase credentials are protected
[ ] Secrets are environment-based
[ ] .env is excluded from Git
[ ] ML service access is controlled
[ ] WebSocket authorization exists where applicable
[ ] Errors do not expose internal information
[ ] Sensitive data is not unnecessarily logged
[ ] HTTPS is used in production
[ ] CORS is restricted appropriately
[ ] Security tests pass
```

---

# 61. Security Source of Truth

This document defines the security baseline for VoiceShield.

Security-related implementation must remain compatible with:

```text
ARCHITECTURE.md
API_CONTRACT.md
DATABASE_SCHEMA.md
ML_SPECIFICATION.md
TECH_STACK.md
```

If an implementation decision conflicts with this document, the conflict must be resolved before implementation.

Do not silently remove or weaken a security requirement.

---

# 62. Final Security Model

The intended security model is:

```text
                    INTERNET
                       │
                       ▼
                ┌─────────────┐
                │  FRONTEND   │
                │             │
                │ HTML/CSS    │
                │ Bootstrap   │
                │ JavaScript  │
                └──────┬──────┘
                       │
                    HTTPS
                       │
                       ▼
                ┌─────────────┐
                │   FASTAPI   │
                │             │
                │ Auth        │
                │ Authorization
                │ Validation  │
                │ Business    │
                │ Logic       │
                └──┬──────┬───┘
                   │      │
                   │      │ Controlled
                   │      │ HTTP
                   │      ▼
                   │  ┌─────────┐
                   │  │   ML    │
                   │  │ Service │
                   │  └─────────┘
                   │
                   ▼
             ┌──────────────┐
             │   SUPABASE   │
             │              │
             │ PostgreSQL   │
             │ Storage      │
             └──────────────┘
```

The fundamental rule is:

```text
Frontend
   ↓
FastAPI
   ↓
Protected Resources
```

The frontend is never the authority for security decisions.

The backend is responsible for enforcing authentication, authorization, validation, and protected resource access.
