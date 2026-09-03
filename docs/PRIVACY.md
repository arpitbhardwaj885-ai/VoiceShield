# VoiceShield — Privacy Specification

## 1. Purpose

This document defines the privacy requirements for VoiceShield.

VoiceShield processes audio and associated analysis information. Because voice recordings can contain sensitive personal information, the system must minimize unnecessary data collection, restrict access to user-owned data, and handle stored information according to the documented project requirements.

This document must remain consistent with:

* `PROJECT_SPECIFICATION.md`
* `ARCHITECTURE.md`
* `DATABASE_SCHEMA.md`
* `API_CONTRACT.md`
* `ML_SPECIFICATION.md`
* `SECURITY.md`
* `TECHNICAL_DECISIONS.md`

---

# 2. Privacy Principles

VoiceShield follows these principles:

```text
Data Minimization
Purpose Limitation
User Data Isolation
Secure Storage
Controlled Access
Limited Retention
Transparent Processing
```

Only information required for the application's functionality should be collected and retained.

---

# 3. Types of Data

VoiceShield may process the following categories of information.

## 3.1 Account Data

Examples:

```text
User identifier
Authentication-related information
Profile information
```

Only information required by the authentication and application functionality should be stored.

---

## 3.2 Audio Data

VoiceShield may process:

```text
Uploaded audio
Recorded audio
Reference speaker audio
Audio associated with an analysis
```

Audio is treated as potentially sensitive user data.

---

## 3.3 Analysis Data

Analysis-related information may include:

```text
Analysis identifier
Analysis status
Analysis result
Risk classification
Confidence/probability values
Timestamp
Model information
Segment-level results where implemented
Speaker verification results where implemented
```

The exact stored fields must follow `DATABASE_SCHEMA.md`.

---

# 4. Data Storage Architecture

VoiceShield uses Supabase for persistent data storage.

```text
                    Supabase
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
      PostgreSQL              Storage
      Structured Data         Audio Files
```

Structured application data is stored in **Supabase PostgreSQL**.

Persistent audio files are stored in **Supabase Storage**.

---

# 5. Backend Privacy Boundary

The FastAPI backend acts as the primary application boundary.

The standard flow is:

```text
User
 ↓
Frontend
 ↓
FastAPI
 ├── Supabase PostgreSQL
 ├── Supabase Storage
 └── ML Service
```

The frontend must not bypass the application's established backend flow to access private application data.

---

# 6. User Data Isolation

A user's private data must remain isolated from other users.

This applies to:

```text
Audio
Analysis Records
Speaker Profiles
Reference Audio
Profile Data
```

Conceptually:

```text
User A
 ├── Audio A
 ├── Analysis A
 └── Speaker Profile A

User B
 ├── Audio B
 ├── Analysis B
 └── Speaker Profile B
```

User A must not be able to retrieve User B's private resources.

---

# 7. Audio Privacy

Audio recordings must be treated as private unless the application explicitly defines otherwise.

The system should:

* Avoid unnecessary exposure of audio.
* Restrict access to authorized users.
* Avoid storing unnecessary copies.
* Avoid placing private recordings in the Git repository.
* Remove temporary copies when they are no longer required.

---

# 8. Persistent Audio Storage

Persistent audio is stored using:

```text
Supabase Storage
```

The database stores the associated metadata and references required by the application.

The system must not unintentionally expose private audio through public storage configuration.

---

# 9. Temporary Audio

The project contains:

```text
storage/
├── temp/
└── uploads/
```

Temporary processing data should exist only for as long as required.

When temporary processing is complete and the data is no longer required, temporary files should be cleaned up according to the implementation.

The local temporary-storage directories do not replace Supabase Storage as the persistent storage system.

---

# 10. ML Processing Privacy

Audio may be passed from FastAPI to the ML subsystem for analysis.

The intended flow is:

```text
Audio
 ↓
FastAPI
 ↓
ML Service
 ↓
Analysis Result
```

The ML subsystem should receive only the data required for the requested analysis.

The frontend must not directly send private application data to an externally exposed ML service.

---

# 11. ML Result Privacy

ML results may contain information associated with the user's audio.

Examples include:

```text
Detection result
Probability/confidence
Risk level
Suspicious segments
Speaker similarity
```

These results must be associated with the appropriate user and protected from unauthorized access.

---

# 12. Speaker Reference Audio

Where speaker verification is implemented, reference audio is treated as private user data.

The relationship is:

```text
User
 ↓
Speaker Profile
 ↓
Reference Audio
```

Reference audio must not be exposed to other users without appropriate authorization.

---

# 13. Analysis History Privacy

Analysis history belongs to the authenticated user.

The history system must ensure:

```text
Authenticated User
       ↓
Own Analyses
```

and prevent:

```text
Authenticated User
       ↓
Another User's Analyses
```

---

# 14. Data Minimization

VoiceShield should collect and retain only information necessary for:

```text
Authentication
Audio analysis
Result generation
History
Speaker verification where implemented
Application functionality
```

Unnecessary personal information should not be collected.

---

# 15. Purpose Limitation

Collected audio and associated information should be used only for the purposes supported by the application.

Examples:

```text
Audio
 ↓
Requested Voice Analysis
```

or:

```text
Reference Audio
 ↓
Speaker Verification
```

Data should not be repurposed without an appropriate project requirement and documented decision.

---

# 16. Data Retention

VoiceShield should avoid retaining data longer than necessary.

Retention behavior must follow the project's implemented data-retention policy.

Where deletion is supported, deletion should remove the relevant application data and associated stored files according to the defined implementation.

---

# 17. Deletion

Where the application provides deletion functionality, deletion must be handled consistently across related resources.

For example:

```text
Analysis
 ↓
Associated Audio
 ↓
Related Metadata
```

The exact deletion behavior must follow the database schema, storage implementation, and documented application requirements.

---

# 18. Database Privacy

Supabase PostgreSQL contains structured application data.

Access must be controlled through the established backend architecture and authorization rules.

Sensitive database credentials must never be exposed to the frontend.

---

# 19. Storage Privacy

Supabase Storage contains persistent audio files.

Storage access must follow the user's authorization.

Private files must not become publicly accessible through an incorrect bucket or access configuration.

---

# 20. Authentication Privacy

Authentication information must be handled securely.

The application must not:

```text
Expose passwords
Log passwords
Return passwords through APIs
Store plaintext passwords when password storage is required
```

Authentication implementation must follow the established authentication architecture.

---

# 21. Secrets and Credentials

The following must remain private:

```text
Supabase service credentials
Database credentials
Authentication secrets
ML service credentials
Deployment secrets
API keys
```

Secrets must be supplied through environment configuration or an appropriate secret-management mechanism.

They must not be committed to Git.

---

# 22. Logs

Application logs must avoid unnecessary sensitive information.

Do not log:

```text
Passwords
Authentication tokens
Private audio contents
Secret credentials
Sensitive user information
```

Logs should contain enough information to diagnose application problems without exposing private data.

---

# 23. API Privacy

API responses should contain only the information required by the requesting operation.

The backend should not unnecessarily return:

```text
Private credentials
Internal database details
Unrelated user information
Private resources belonging to another user
```

---

# 24. Error Message Privacy

Error messages should not expose sensitive internal information.

Avoid returning:

```text
Database credentials
Authentication secrets
Internal stack traces
Private filesystem information
Unnecessary infrastructure details
```

Users should receive appropriate application-level error messages.

---

# 25. Frontend Privacy

The frontend should display only information the authenticated user is authorized to view.

The frontend must not contain:

```text
Database passwords
Supabase service-role credentials
Private backend secrets
ML service secrets
```

Client-side code must be considered publicly inspectable.

---

# 26. Third-Party Data Sharing

VoiceShield should not intentionally share user audio or personal information with unrelated third parties.

Any external service required by the application must be limited to the services defined by the project architecture.

The current architecture includes:

```text
Supabase
FastAPI
ML Service
```

Any future external data-processing service requires an explicit technical and privacy decision.

---

# 27. Data Transmission

Data should be transmitted through the established application boundaries.

Standard flow:

```text
Frontend
   ↓
FastAPI
   ↓
Supabase / ML
```

Production communication should use secure transport such as HTTPS.

---

# 28. Privacy and Security Relationship

Privacy and security are related but different.

```text
Security
    ↓
Protects data from unauthorized access

Privacy
    ↓
Controls what data is collected,
used, stored, and retained
```

VoiceShield must address both.

Security implementation requirements are defined in:

```text
docs/SECURITY.md
```

---

# 29. Development and Testing Data

Development and testing should use appropriate test data.

Developers should avoid committing:

```text
Real private audio
Real user information
Production credentials
Private authentication information
```

Test data should be stored separately from production data.

---

# 30. Git Repository Privacy

The Git repository may contain:

```text
Source Code
Documentation
Tests
Non-sensitive Configuration
```

It must not contain:

```text
Passwords
API Keys
Private Tokens
Supabase Service Credentials
Database Passwords
Private User Audio
Private User Data
```

---

# 31. Privacy During Demonstration

The SIH demonstration should use demonstration/test data whenever possible.

Do not expose:

```text
Real user passwords
Private recordings
Private database records
Authentication tokens
Supabase credentials
```

Screenshots and recordings of the demo should also avoid exposing private information.

---

# 32. Privacy Failure Handling

If private data is accidentally exposed, the incident should be treated as a security/privacy issue.

Examples:

```text
Private audio publicly accessible
User A sees User B's analysis
Secret committed to Git
Private information appears in logs
```

The affected component should be identified and corrected before continuing normal development.

---

# 33. Privacy Testing

Privacy-related tests should verify:

```text
[ ] User data isolation
[ ] Private audio protection
[ ] Analysis ownership
[ ] Speaker profile ownership
[ ] Reference audio protection
[ ] Secure error handling
[ ] Secret protection
[ ] No private data in repository
[ ] Appropriate deletion behavior
```

Testing requirements are additionally defined in:

```text
docs/TESTING.md
```

---

# 34. Privacy Checklist

Before deployment:

```text
[ ] Private audio is protected
[ ] User resources are isolated
[ ] Supabase Storage access is controlled
[ ] Database access is controlled
[ ] Authentication is enabled
[ ] Authorization is enforced
[ ] Secrets are not committed
[ ] Logs do not contain sensitive information
[ ] Temporary files are cleaned up
[ ] Test/private data is separated
[ ] Error messages do not expose sensitive information
```

---

# 35. Final Privacy Rule

VoiceShield must follow the principle:

```text
Collect only what is needed
        ↓
Use it only for the intended purpose
        ↓
Protect it from unauthorized access
        ↓
Retain it only as required
        ↓
Delete it when appropriate
```

The privacy implementation must remain consistent with the established VoiceShield architecture:

```text
Frontend
    ↓
FastAPI
    ├── Supabase PostgreSQL
    ├── Supabase Storage
    └── ML Service
```

No privacy-related implementation should bypass the established authentication, authorization, storage, database, or ML boundaries.
