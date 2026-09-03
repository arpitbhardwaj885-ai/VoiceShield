# VoiceShield — Frontend Specification

## 1. Purpose

This document defines the frontend requirements for VoiceShield.

The frontend is a web interface responsible for user interaction, navigation, audio input, API communication, and presentation of backend/ML results.

The frontend must remain consistent with:

* `PROJECT_SPECIFICATION.md`
* `FEATURES.md`
* `USER_FLOWS.md`
* `ARCHITECTURE.md`
* `API_CONTRACT.md`
* `SECURITY.md`
* `PRIVACY.md`
* `TECH_STACK.md`

---

# 2. Frontend Technology

The VoiceShield frontend uses:

```text
HTML5
CSS3
Bootstrap
JavaScript
```

No frontend framework is required by the current architecture.

Do not replace the existing frontend architecture with React, Vue, Angular, or another framework without an explicit architectural decision.

---

# 3. Frontend Responsibility

The frontend is responsible for:

* Rendering pages
* User interaction
* Navigation
* Form handling
* Client-side validation
* Audio selection
* Browser audio recording
* Sending requests to FastAPI
* Receiving API responses
* Displaying loading states
* Displaying errors
* Displaying analysis results
* Displaying analysis history
* Displaying speaker profiles
* Managing frontend application state

The frontend is **not** responsible for:

* Direct PostgreSQL access
* Direct Supabase service-role access
* Server-side authorization
* ML inference
* Storing secret credentials
* Making security decisions based only on client-side logic

---

# 4. Current Frontend Structure

The frontend currently contains:

```text
frontend/
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── analyze.html
├── live-analysis.html
├── result.html
├── history.html
├── profile.html
├── speaker-profile.html
├── assets/
├── css/
└── js/
```

The existing structure should be preserved unless a documented implementation requirement requires a change.

---

# 5. Page Responsibilities

## 5.1 `index.html`

The landing page.

Its purpose is to introduce VoiceShield and provide navigation toward authentication or the application.

Typical actions:

```text
Get Started
Login
Register
```

It must not expose protected user information.

---

## 5.2 `login.html`

Responsible for user authentication.

The page should provide:

* Login form
* Validation feedback
* Loading state
* Authentication error state
* Navigation after successful authentication

---

## 5.3 `register.html`

Responsible for account registration.

The page should provide:

* Registration form
* Client-side validation
* Loading state
* Registration errors
* Successful registration feedback

---

## 5.4 `dashboard.html`

The authenticated application dashboard.

It may provide:

* Recent analysis information
* Quick analysis action
* Live analysis action
* History navigation
* Speaker profile navigation
* Profile navigation

Only authenticated users should access protected dashboard information.

---

## 5.5 `analyze.html`

The primary audio analysis page.

It should support the audio-input workflow defined by the project.

Possible input methods:

```text
Upload audio
Record audio
```

The page should provide:

* Audio input controls
* File validation feedback
* Recording controls where supported
* Upload/submit action
* Loading/progress state
* Error state

---

## 5.6 `live-analysis.html`

The live-analysis interface.

Where live analysis is implemented, this page should provide:

* Microphone access
* Recording state
* Connection state
* Analysis state
* Live result information
* Stop action
* Error handling

Real-time communication must follow the architecture and API contracts.

---

## 5.7 `result.html`

Displays the result of an audio analysis.

Possible sections include:

```text
Analysis status
Overall assessment
Confidence
Segment findings
Speaker verification
Explanation
Analysis metadata
```

Only information actually returned by the backend/ML pipeline should be displayed.

---

## 5.8 `history.html`

Displays the user's previous analyses.

Possible information:

```text
Analysis ID
Audio information
Date/time
Status
Result
```

The page should support opening an individual analysis.

---

## 5.9 `profile.html`

Displays the authenticated user's profile information.

It may provide account-related information and profile settings supported by the application.

---

## 5.10 `speaker-profile.html`

Provides speaker-profile functionality.

It may support:

```text
Create speaker profile
View speaker profile
Add reference audio
View reference audio information
Update speaker information
Delete speaker profile
```

Operations must be authorized by the backend.

---

# 6. Navigation Model

The main application navigation is conceptually:

```text
Landing
   │
   ├── Login
   └── Register

Authenticated User
   │
   └── Dashboard
        ├── Analyze
        ├── Live Analysis
        ├── History
        ├── Speaker Profiles
        └── Profile
```

Navigation must not be used as the sole security mechanism.

---

# 7. Authentication State

The frontend should maintain an appropriate representation of authentication/session state.

Conceptually:

```text
Unauthenticated
      ↓
Login
      ↓
Authenticated
      ↓
Protected Application
```

If a user is not authenticated, protected frontend pages should redirect or otherwise prevent access to protected application functionality.

Server-side authorization remains mandatory.

---

# 8. API Communication

The frontend communicates with FastAPI.

Conceptually:

```text
Browser
   ↓
HTTP Request
   ↓
FastAPI
   ↓
Response
   ↓
Browser
```

The frontend must not directly access the application's PostgreSQL database.

The frontend must not expose Supabase service-role credentials.

---

# 9. API Base URL

API endpoints should be accessed through a centralized frontend configuration rather than hardcoding different backend URLs throughout individual pages.

A shared JavaScript configuration should be used where appropriate.

Example conceptual structure:

```text
frontend/js/
    config.js
```

The exact file organization may follow the existing project structure.

---

# 10. API Request Handling

Frontend API calls should consistently handle:

```text
Request started
Request successful
Request failed
Request completed
```

A shared API helper may be used to avoid duplicating request logic.

The implementation must follow `API_CONTRACT.md`.

---

# 11. Authentication Headers

When the API contract requires authentication information, the frontend must send it according to the defined authentication mechanism.

The frontend must not:

* Hardcode user credentials
* Expose secret keys
* Store service-role credentials
* Bypass backend authorization

---

# 12. Audio Upload UI

The upload interface should provide:

```text
File selector
Selected file information
Validation feedback
Upload/Analyze action
Loading state
Error state
```

Before submission, the frontend should perform basic validation where appropriate.

The backend remains responsible for authoritative validation.

---

# 13. Audio Recording UI

Where browser recording is implemented, the interface should provide clear controls:

```text
Start Recording
Recording
Stop Recording
Review
Submit
```

The user should be able to understand whether the microphone is currently active.

The browser's microphone permission must be requested through the standard browser API.

---

# 14. Recording State

The UI should clearly distinguish states such as:

```text
Ready
Requesting Permission
Recording
Stopped
Processing
Error
```

The exact state implementation may vary.

---

# 15. Analysis Loading State

Analysis may take time.

The frontend should communicate that processing is occurring.

Example:

```text
Uploading audio...
Preparing analysis...
Analyzing audio...
Processing result...
```

The frontend must not display a completed result while analysis is still processing.

---

# 16. Analysis Result UI

The result page should separate different types of information.

Recommended conceptual structure:

```text
┌─────────────────────────────┐
│ Analysis Status             │
├─────────────────────────────┤
│ Overall Assessment          │
├─────────────────────────────┤
│ Confidence                  │
├─────────────────────────────┤
│ Segment Findings            │
├─────────────────────────────┤
│ Speaker Verification        │
├─────────────────────────────┤
│ Explanation                 │
└─────────────────────────────┘
```

Sections should only appear when corresponding data exists.

---

# 17. Prediction Presentation

The frontend should present the ML prediction accurately.

It must not transform a probabilistic prediction into an absolute statement.

For example, the interface should avoid implying:

```text
100% guaranteed real
100% guaranteed fake
```

unless the backend actually provides such a deterministic status and the project explicitly defines it that way.

---

# 18. Confidence Presentation

Where confidence is provided by the ML system, the frontend may display it using:

* Percentage
* Numeric value
* Progress indicator
* Confidence card

The presentation must match the API's meaning and scale.

The frontend must not invent confidence values.

---

# 19. Segment Visualization

Where segment information is returned, the frontend may display:

```text
Segment list
Timeline
Segment status
Segment prediction
Segment confidence
```

Only data returned by the API should be visualized.

---

# 20. Speaker Verification UI

When speaker verification is available, the result page may display:

```text
Speaker verification status
Similarity/verification information
Reference speaker
Verification confidence where provided
```

Speaker verification must remain visually and conceptually separate from synthetic-speech detection.

---

# 21. Explainability UI

Where explanation data is available, the frontend should present it in an understandable form.

Possible UI:

```text
Explanation Card
Segment Evidence
Analysis Indicators
Supporting Information
```

The frontend must not generate explanations that are not supplied by the ML/backend system.

---

# 22. History UI

The history page should present previous analyses in a readable structure.

Possible layout:

```text
Analysis
Date
Status
Result
Action
```

Each analysis may provide an action to open its detailed result.

---

# 23. Empty History State

If the user has no analyses:

```text
No analyses yet.
```

The interface should provide an appropriate action such as:

```text
Analyze Audio
```

The empty state must not be presented as an error.

---

# 24. Speaker Profile UI

The speaker profile interface should allow appropriate speaker management.

Possible structure:

```text
Speaker Name
Reference Audio
Verification Availability
Actions
```

Only authorized speaker information should be displayed.

---

# 25. Error Handling

The frontend should handle API and browser errors.

Common states include:

```text
400 → Invalid request
401 → Authentication required
403 → Access denied
404 → Resource not found
409 → Conflict
422 → Validation error
5xx → Server error
Network failure
Timeout
```

The exact error response must follow `API_CONTRACT.md`.

The frontend should translate technical errors into understandable user feedback where appropriate.

---

# 26. Error Message Rules

Error messages should:

* Be understandable
* Be relevant to the user's action
* Avoid exposing secrets
* Avoid exposing stack traces
* Avoid exposing internal database details
* Avoid exposing unnecessary infrastructure information

---

# 27. Loading Indicators

Loading indicators should be used for operations that may take noticeable time.

Examples:

```text
Login
Registration
Upload
Analysis
History loading
Speaker operations
Profile operations
```

Buttons should prevent accidental repeated submissions where appropriate.

---

# 28. Success Feedback

Successful operations should provide appropriate feedback.

Examples:

```text
Account created
Audio uploaded
Analysis completed
Speaker created
Reference audio added
Profile updated
Resource deleted
```

Success messages must correspond to actual successful backend operations.

---

# 29. Responsive Design

The frontend should support:

```text
Desktop
Laptop
Tablet
Mobile
```

Bootstrap's responsive utilities and grid system should be used where practical.

---

# 30. Bootstrap Usage

Bootstrap should be used for common UI patterns such as:

* Grid
* Forms
* Buttons
* Cards
* Navigation
* Modals
* Alerts
* Badges
* Tables
* Progress indicators

Custom CSS should be used where application-specific styling is required.

---

# 31. CSS Organization

Application-specific styles should be maintained under:

```text
frontend/css/
```

CSS should not unnecessarily be duplicated across multiple HTML pages.

Shared styles should be centralized where practical.

---

# 32. JavaScript Organization

Application JavaScript should be maintained under:

```text
frontend/js/
```

JavaScript should be organized around logical responsibilities.

Possible organization:

```text
frontend/js/
├── config.js
├── api.js
├── auth.js
├── analyze.js
├── live-analysis.js
├── history.js
├── profile.js
└── speaker-profile.js
```

These filenames are organizational examples; existing project files should be preserved where already established.

---

# 33. Client-Side Validation

Client-side validation should improve user experience.

Examples:

```text
Required fields
File selected
Basic file type check
Basic file size check
Input format
```

Client-side validation does **not** replace backend validation.

---

# 34. Audio File Handling

The frontend should not permanently store uploaded audio in browser storage unless explicitly required.

The normal flow is:

```text
User Audio
   ↓
Frontend
   ↓
FastAPI
   ↓
Supabase Storage
```

Temporary browser state may be used where necessary for recording or preview.

---

# 35. Security Rules

The frontend must never contain:

```text
Supabase service-role key
Database password
ML service secret
Backend private credentials
```

Public configuration values may be exposed only where appropriate and according to the project's security model.

---

# 36. Authorization Rules

The frontend may hide UI controls based on application state, but this is not authorization.

Actual authorization must be enforced by FastAPI/backend logic.

Example:

```text
Frontend hides Delete button
        ≠
Backend authorization
```

The backend must still reject unauthorized deletion requests.

---

# 37. Direct Supabase Access

The frontend must not directly perform privileged database or storage operations.

The intended application path is:

```text
Frontend
   ↓
FastAPI
   ↓
Supabase PostgreSQL / Storage
```

If a specific Supabase client-side capability is explicitly introduced later, it must be documented before implementation.

---

# 38. Direct ML Access

The frontend must not directly call the ML service.

The intended path is:

```text
Frontend
   ↓
FastAPI
   ↓
ML
```

This keeps ML service access behind the backend boundary.

---

# 39. Live Analysis Frontend

Where live analysis is implemented:

```text
Browser Microphone
       ↓
Frontend
       ↓
WebSocket
       ↓
FastAPI
       ↓
ML
```

The frontend should display:

```text
Connection State
Recording State
Processing State
Current Result
Error State
```

---

# 40. Accessibility

The frontend should follow basic accessibility practices.

Examples:

* Labels for form fields
* Keyboard-accessible controls
* Meaningful button text
* Appropriate heading structure
* Sufficient visual distinction
* Error messages associated with relevant controls
* Accessible status feedback where practical

---

# 41. Browser Compatibility

The application should target modern browsers that support the required web APIs.

Audio recording functionality depends on browser support for the required media APIs.

Unsupported functionality should fail gracefully.

---

# 42. Page Protection

Protected pages include, where applicable:

```text
dashboard.html
analyze.html
live-analysis.html
result.html
history.html
profile.html
speaker-profile.html
```

Unauthenticated users should not be allowed to access protected data.

Backend authorization remains the authoritative security mechanism.

---

# 43. No Fabricated Data

The frontend must never fabricate:

```text
Analysis results
Confidence values
Speaker matches
Segment predictions
Model versions
Historical analyses
```

If data is unavailable, the UI should display an appropriate unavailable/error/empty state.

---

# 44. Frontend State Model

The frontend should conceptually manage:

```text
Authentication State
      ↓
Page State
      ↓
Request State
      ↓
Data State
      ↓
Error State
```

For analysis:

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

# 45. Frontend–Backend Contract

Frontend implementation must follow the API contract exactly.

The frontend must not assume undocumented:

* Endpoint paths
* Request fields
* Response fields
* Status values
* Authentication mechanisms
* Error structures

When the API contract changes, affected frontend code must be updated accordingly.

---

# 46. Frontend–ML Boundary

The frontend has no direct responsibility for ML inference.

The frontend receives processed information through FastAPI.

```text
ML
 ↓
FastAPI
 ↓
Frontend
```

The frontend should not implement ML logic that duplicates the ML subsystem.

---

# 47. Performance

The frontend should avoid unnecessary:

* API requests
* Repeated DOM operations
* Large unnecessary downloads
* Duplicate submissions
* Continuous polling where an appropriate mechanism already exists

Long-running analysis should use the mechanism defined by the backend/API architecture.

---

# 48. Maintainability

Frontend code should:

* Use reusable components/functions where practical
* Avoid unnecessary duplication
* Keep API logic separate from presentation logic
* Keep configuration centralized
* Use clear naming
* Avoid large monolithic JavaScript files where separation is practical

---

# 49. Definition of Done

A frontend feature is complete when:

```text
[ ] Required page/UI exists
[ ] User interaction works
[ ] API integration works
[ ] Loading state exists
[ ] Error state exists
[ ] Empty state exists where applicable
[ ] Authentication behavior is correct
[ ] Backend authorization is respected
[ ] Data is displayed from actual API responses
[ ] No secrets are exposed
[ ] Responsive behavior works
[ ] Existing architecture is preserved
```

---

# 50. Final Frontend Rule

The VoiceShield frontend is:

```text
HTML5
+
CSS3
+
Bootstrap
+
JavaScript
```

Its primary responsibility is to provide the user interface and communicate with the FastAPI backend.

The authoritative application flow is:

```text
Frontend
    ↓
FastAPI
    ├── Supabase PostgreSQL
    ├── Supabase Storage
    └── ML Service
```

The frontend must not bypass these boundaries or invent data that is not provided by the backend/ML system.

Any major frontend architectural change must be explicitly documented before implementation.
