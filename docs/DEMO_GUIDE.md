# VoiceShield — Demo Guide

## 1. Purpose

This document defines the standard demonstration flow for VoiceShield.

The purpose of the demo is to clearly demonstrate the core working functionality of the system while keeping the demonstration consistent with the project's documented architecture, API contract, database schema, ML specification, security requirements, and user flows.

The demo should focus on functionality that is actually implemented and tested.

---

# 2. Demo Objective

The primary objective of the VoiceShield demonstration is to show that the system can:

1. Authenticate a user.
2. Accept an audio recording or uploaded audio file.
3. Process the audio through the VoiceShield analysis pipeline.
4. Detect the likelihood of AI-generated/manipulated speech.
5. Produce an analysis result.
6. Display the result to the user.
7. Store the analysis.
8. Display the analysis in history.

Where implemented and tested, the demo can additionally show:

* Speaker profiles
* Speaker verification
* Suspicious audio segments
* Live analysis
* Explainability information
* Risk scoring
* Model version information

---

# 3. Demo Architecture

The demonstration follows the established architecture:

```text
                    USER
                      │
                      ▼
                FRONTEND
          HTML + CSS + Bootstrap + JS
                      │
              REST / WebSocket
                      │
                      ▼
                  FASTAPI
                 BACKEND
                  /     \
                 /       \
                ▼         ▼
        SUPABASE          ML
       PostgreSQL       SERVICE
          +
       Storage
```

The frontend communicates with the FastAPI backend.

The backend communicates with Supabase PostgreSQL, Supabase Storage, and the ML service.

The frontend must not directly access the database.

---

# 4. Before Starting the Demo

Before demonstrating VoiceShield, verify that the required services are running.

Minimum components:

```text
Frontend
Backend
Supabase PostgreSQL
Supabase Storage
ML Service
```

If Docker-based deployment is being used, verify that the required containers/services are running.

---

# 5. Demo Environment Checklist

Before the presentation:

```text
[ ] Repository is up to date
[ ] Backend starts successfully
[ ] Frontend loads successfully
[ ] Supabase connection works
[ ] Supabase Storage works
[ ] ML service is available
[ ] Authentication works
[ ] Test audio is available
[ ] Analysis endpoint works
[ ] Result page works
[ ] History works
[ ] No secrets are exposed
```

---

# 6. Recommended Demo Account

Use a dedicated demonstration account rather than exposing a real user's private information.

The account should contain only data appropriate for demonstration.

Do not use:

* Real passwords on presentation screens
* Private user recordings
* Production credentials
* Private database information

---

# 7. Recommended Demo Audio

Prepare at least one valid audio sample before the presentation.

Preferably have:

```text
Sample 1
Known/expected authentic speech

Sample 2
Known/expected synthetic or manipulated speech
```

The samples should be clearly identified as demonstration/test data.

The demo must not claim that an audio sample is definitively genuine or fake solely because of the expected label.

The actual model output should be shown.

---

# 8. Main Demo Flow

The recommended primary flow is:

```text
Landing Page
      ↓
Login / Register
      ↓
Dashboard
      ↓
Analyze Audio
      ↓
Upload / Record
      ↓
Submit
      ↓
Processing
      ↓
ML Analysis
      ↓
Result
      ↓
History
```

---

# 9. Step 1 — Open VoiceShield

Start the frontend application.

Show the VoiceShield landing page.

Briefly explain:

> VoiceShield is an AI-powered voice security platform designed to detect potential AI-generated or voice-cloned speech and assist with voice impersonation detection.

Do not spend excessive time on the landing page.

Move quickly to the actual product functionality.

---

# 10. Step 2 — Authentication

Open the login page.

Log in using the prepared demonstration account.

Show that authentication provides access to the protected application.

Expected flow:

```text
Login
 ↓
Authentication
 ↓
Authenticated Session
 ↓
Dashboard
```

Explain that protected resources belong to the authenticated user.

---

# 11. Step 3 — Dashboard

After login, open the dashboard.

Briefly show:

* Analysis functionality
* History
* Speaker functionality where implemented
* Profile functionality where implemented
* Live analysis where implemented

Do not spend too much time explaining every navigation item.

The main objective is to reach audio analysis.

---

# 12. Step 4 — Audio Analysis

Open the analysis page.

Choose one of the supported input methods:

```text
Upload Audio
```

or:

```text
Record Audio
```

For the most reliable demo, use a prepared audio file.

---

# 13. Step 5 — Upload Audio

Select the prepared audio file.

The frontend should perform basic validation.

The backend performs authoritative validation.

Expected flow:

```text
Audio File
   ↓
Frontend
   ↓
FastAPI
   ↓
Validation
   ↓
Supabase Storage
```

Explain that the actual audio file is stored in Supabase Storage while PostgreSQL stores the associated metadata.

---

# 14. Step 6 — Start Analysis

Submit the audio for analysis.

The expected system flow is:

```text
Audio
 ↓
FastAPI
 ↓
ML Processing
 ↓
Detection
 ↓
Result
 ↓
Database
```

The frontend should display an appropriate processing/loading state.

---

# 15. Step 7 — ML Processing

While processing is occurring, explain the high-level pipeline:

```text
Audio
 ↓
Preprocessing
 ↓
Feature / Representation Extraction
 ↓
AI Voice Detection
 ↓
Segment Analysis
 ↓
Speaker Verification (when applicable)
 ↓
Risk Calculation
 ↓
Result
```

Do not claim that every stage is active unless it has actually been implemented and tested.

---

# 16. Step 8 — Show the Result

After analysis completes, open/display the result.

The result may include:

```text
AI-generated probability
Authentic probability
Risk level
Analysis timestamp
Model version
```

Where implemented:

```text
Speaker similarity
Suspicious segments
Explanation / analysis indicators
```

Use the actual values returned by the system.

---

# 17. Explaining Probability

If the result displays:

```text
AI-generated probability: 91%
Authentic probability: 9%
```

explain that these are model estimates.

Do not say:

> "The audio is definitely AI-generated."

Instead explain:

> "The model estimates a high likelihood that this audio contains AI-generated or manipulated speech."

The exact interpretation should follow the ML specification.

---

# 18. Risk Level

Where risk classification is implemented, show the risk level returned by the application.

Example:

```text
AI-generated probability: 91%

Risk Level:
HIGH
```

Explain that the risk level is an application-level interpretation of available analysis signals.

Do not invent thresholds during the presentation.

The backend/risk engine owns the final risk classification.

---

# 19. Suspicious Segment Demonstration

If segment analysis is implemented, show the suspicious portions of the recording.

Example:

```text
Audio Timeline

00:00 ─────────────── 00:30

        █████
        08s-12s
        HIGH
```

Explain that the system can identify portions of the recording that have higher AI-generated probability.

Only show this feature if the ML pipeline is returning real segment-level results.

---

# 20. Speaker Verification Demonstration

If speaker verification is implemented:

```text
Speaker Profile
      ↓
Reference Audio
      ↓
Target Audio
      ↓
Speaker Verification
      ↓
Similarity Result
```

Show the registered speaker profile and the verification result.

Clearly distinguish:

```text
Deepfake Detection
```

from:

```text
Speaker Verification
```

They answer different questions.

Deepfake detection asks whether speech appears synthetic/manipulated.

Speaker verification asks whether the voice matches the selected reference speaker.

---

# 21. Analysis History

After showing the result, navigate to history.

Expected flow:

```text
Result
 ↓
Stored Analysis
 ↓
History
```

Show that the completed analysis appears in the authenticated user's history.

Explain that historical analyses allow the user to review previous results.

---

# 22. Database Demonstration

The database should normally remain in the background during the main user demo.

If technical judges ask about the database, explain:

```text
Supabase PostgreSQL
```

stores structured application data such as:

```text
users
audio_files
speakers
speaker_reference_audio
analyses
segments
model_versions
```

Actual audio files are stored in:

```text
Supabase Storage
```

rather than inside PostgreSQL.

---

# 23. Security Demonstration

If security is questioned, explain the main boundaries:

```text
Frontend
   ↓
FastAPI
   ↓
Supabase / ML
```

Important points:

* Authentication is required for protected functionality.
* Backend authorization protects user-owned resources.
* PostgreSQL is not directly exposed to the frontend.
* Supabase privileged credentials remain server-side.
* Uploaded audio is validated.
* Secrets are stored through environment configuration.
* Private user resources must not be accessible to other users.

---

# 24. ML Demonstration

If judges ask how the AI component works, explain at a high level:

```text
Audio
 ↓
Preprocessing
 ↓
Feature / Representation Extraction
 ↓
Deepfake Detection
 ↓
Segment Analysis
 ↓
Speaker Verification
 ↓
Structured ML Result
```

The exact model architecture, preprocessing configuration, training process, and evaluation metrics should be explained according to `ML_SPECIFICATION.md`.

Do not claim performance metrics that have not been measured.

---

# 25. Live Analysis Demonstration

If live analysis has been implemented and tested, demonstrate it after the standard upload workflow.

Flow:

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
Partial Result
 ↓
Frontend
```

Show:

```text
Connection
Recording
Processing
Live Result
```

Live analysis should only use microphone input or another audio stream that the application is explicitly authorized to process.

---

# 26. Error Demonstration

A short failure demonstration can be useful if time permits.

For example:

```text
Invalid Audio
 ↓
Validation
 ↓
Error
 ↓
User Feedback
```

The purpose is to demonstrate that the application handles invalid input rather than crashing or returning a fake result.

---

# 27. What Not to Demonstrate

Do not demonstrate unfinished functionality as if it were complete.

Do not show:

```text
Fake ML predictions
Hardcoded analysis results
Fake database records
Fake confidence values
Fake speaker matches
```

Do not claim:

```text
100% detection accuracy
Universal deepfake detection
Perfect speaker verification
```

unless such claims are actually supported by validated evaluation.

---

# 28. If ML Is Temporarily Unavailable

If the ML service fails during the demo:

```text
ML unavailable
 ↓
Analysis failure / appropriate error
```

Do not replace the failure with a hardcoded successful result.

If a fallback demonstration is necessary, clearly identify it as a mock/test demonstration rather than real ML inference.

---

# 29. If Supabase Is Unavailable

If the database or storage service is unavailable:

```text
Supabase unavailable
 ↓
Appropriate application error
```

Do not claim that the operation was successfully stored when it was not.

---

# 30. Judge Explanation — One-Minute Version

A concise explanation:

> VoiceShield is an AI-powered voice security platform designed to detect potential AI-generated or voice-cloned speech. A user can upload or record audio, after which the FastAPI backend validates and processes the request. The audio is stored through Supabase Storage, while PostgreSQL stores the associated metadata and analysis information. The ML service analyzes the speech and returns structured detection results such as AI-generated probability, authentic probability, and, where implemented, suspicious segments and speaker similarity. The backend stores the result and the frontend presents it to the user. Authenticated users can then review their previous analyses through the history interface.

---

# 31. Judge Explanation — Technical Version

The system consists of:

```text
Frontend
HTML + CSS + Bootstrap + JavaScript

        ↓

FastAPI Backend

        ↓

┌─────────────────┬─────────────────┐
│                 │                 │
▼                 ▼                 ▼
Supabase       Supabase            ML
PostgreSQL     Storage             Service
```

FastAPI acts as the central application backend.

Supabase PostgreSQL stores structured application data.

Supabase Storage stores persistent audio files.

The ML subsystem performs audio analysis and returns a stable structured result to the backend.

The backend stores the required result and exposes it to the frontend through the defined API contract.

---

# 32. Recommended Presentation Order

For an SIH-style demonstration, use this order:

```text
1. Problem
2. Solution
3. Login
4. Dashboard
5. Upload / Record Audio
6. Analysis
7. ML Result
8. Risk Level
9. Suspicious Segments
10. Speaker Verification
11. History
12. Architecture
13. Security / Privacy
14. Future Scope
```

Skip features that are not implemented or tested.

---

# 33. Demo Timing

A short technical demonstration can follow:

```text
0:00 – 1:00
Problem + Solution

1:00 – 2:00
Login + Dashboard

2:00 – 4:00
Audio Upload + Analysis

4:00 – 5:00
Result + Explanation

5:00 – 6:00
History / Speaker Verification

6:00 – 7:00
Architecture + Technical Explanation
```

Adjust the timing according to the actual presentation requirements.

---

# 34. Final Demo Checklist

Before the final SIH demonstration:

```text
APPLICATION
[ ] Frontend opens
[ ] Backend starts
[ ] Supabase connection works
[ ] Storage works
[ ] ML service works

AUTHENTICATION
[ ] Registration works
[ ] Login works
[ ] Protected pages work

AUDIO
[ ] Upload works
[ ] Valid audio is accepted
[ ] Invalid audio is rejected
[ ] Recording works if implemented

ANALYSIS
[ ] Analysis request works
[ ] Processing state works
[ ] ML result is returned
[ ] Result is displayed
[ ] Risk level is displayed where implemented

DATA
[ ] Analysis is stored
[ ] History works
[ ] User ownership works

ADVANCED
[ ] Speaker verification works if implemented
[ ] Segment analysis works if implemented
[ ] Live analysis works if implemented

SECURITY
[ ] No secrets in repository
[ ] No private user data in demo
[ ] Authorization works
[ ] Error messages do not expose internal details
```

---

# 35. Final Rule

The demo must show **actual implemented functionality**.

The demonstration should follow the documented VoiceShield architecture:

```text
Frontend
    ↓
FastAPI
    ├── Supabase PostgreSQL
    ├── Supabase Storage
    └── ML Service
```

The demo must not introduce a different architecture, undocumented API behavior, fabricated ML results, or unimplemented features.

The most important objective is to demonstrate a reliable end-to-end working flow rather than showing the maximum number of planned features.
