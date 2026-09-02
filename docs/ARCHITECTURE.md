# VoiceShield — System Architecture

## 1. Overview

VoiceShield is an AI-based voice security system that analyzes audio to detect whether it is genuine or AI-generated/voice-cloned.

The system also supports speaker verification, which allows us to check whether the analyzed voice matches a registered/reference speaker.

The project is divided into four main parts:

* **Frontend** — User interface and audio interaction
* **Backend** — API, authentication and application logic
* **ML** — Voice deepfake detection and speaker verification
* **Database** — Users, analyses, speakers and other application data

The basic flow is:

```text
User
 ↓
Frontend
 ↓
Backend
 ├── Database
 └── ML Service
       ↓
    Prediction
       ↓
Backend
 ↓
Frontend
 ↓
Result
```

---

## 2. Main Components

### Frontend

The frontend is built using:

* HTML
* CSS
* JavaScript
* Bootstrap

It provides the interface through which users can:

* Register and log in
* Upload audio
* Record audio
* Start an analysis
* View detection results
* View suspicious segments
* Check analysis history
* Manage speaker profiles
* Use live analysis

The frontend does not directly connect to the database or ML service. All requests go through the backend.

---

### Backend

The backend is built using **Python and FastAPI**.

It acts as the main controller of the application.

Its main responsibilities are:

* User authentication
* JWT handling
* Audio upload and validation
* Creating analysis requests
* Communicating with the ML service
* Storing analysis results
* Speaker management
* Risk calculation
* WebSocket communication for live analysis

The backend basically connects everything together:

```text
Frontend
   ↓
Backend
   ├── PostgreSQL
   └── ML
```

---

### ML Service

The ML component is responsible for analyzing the actual voice/audio.

The planned pipeline is:

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
Speaker Verification (if reference voice exists)
 ↓
ML Result
```

The ML system may use different models during development. The rest of the application should not depend on the internal model architecture.

For example, we may replace one detection model with another later without changing the frontend.

---

### Database

We use **PostgreSQL** for application data.

The database mainly stores:

* User accounts
* Analysis records
* Analysis segments
* Speaker profiles
* Model versions
* Relevant metadata

Large audio files and ML datasets are not intended to be stored directly inside PostgreSQL.

---

# 3. Communication Between Components

The components communicate in the following way:

```text
Frontend
   │
   │ REST API / WebSocket
   ▼
Backend
   │
   ├── SQLAlchemy
   │       ↓
   │   PostgreSQL
   │
   └── HTTP
         ↓
       ML Service
```

### Frontend → Backend

REST APIs are used for normal operations such as:

```text
Login
Register
Upload audio
Create analysis
Get result
Get history
Manage speakers
```

WebSockets are used for live analysis.

### Backend → Database

The backend uses SQLAlchemy to communicate with PostgreSQL.

The frontend never connects directly to PostgreSQL.

### Backend → ML

The backend sends the audio/analysis request to the ML service and receives a structured prediction.

This keeps the ML implementation separate from the application logic.

---

# 4. Audio Analysis Flow

For a normal uploaded audio file, the process is:

```text
1. User selects/records audio
             ↓
2. Frontend uploads audio
             ↓
3. Backend validates the file
             ↓
4. Backend creates an analysis
             ↓
5. Audio is passed to ML
             ↓
6. ML preprocesses the audio
             ↓
7. Detection model analyzes the voice
             ↓
8. Suspicious segments are identified
             ↓
9. Speaker verification is performed if requested
             ↓
10. ML returns the prediction
             ↓
11. Backend calculates application risk
             ↓
12. Result is saved in PostgreSQL
             ↓
13. Frontend displays the result
```

---

# 5. ML Result

The ML service should return a common format so that the backend does not need to know how the model works internally.

Example:

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

These values are examples. The actual model will determine the prediction.

---

# 6. Deepfake Detection and Speaker Verification

These are treated as two different ML tasks.

### Deepfake Detection

The question is:

> Does this audio contain signs of synthetic or manipulated speech?

Example output:

```text
AI probability: 91%
Authentic probability: 9%
```

### Speaker Verification

The question is:

> Does this voice match the registered/reference speaker?

Example:

```text
Speaker similarity: 87%
Result: MATCH
```

Keeping these two tasks separate is important because a real recording of the wrong person is not necessarily a deepfake, and an AI-generated voice may be designed to imitate a specific person.

---

# 7. Risk Calculation

The ML model provides the main prediction, but the final application risk is handled by the backend.

The backend can consider:

```text
AI probability
+
Speaker similarity
+
Suspicious segments
+
Model confidence
        ↓
Risk Engine
        ↓
Overall Risk
```

The initial risk levels are:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

The exact scoring rules will be finalized during implementation and testing.

---

# 8. Live Analysis

VoiceShield is also designed to support real-time analysis.

The basic flow is:

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
          Frontend
```

Instead of waiting for the complete recording, the system can analyze smaller audio chunks and update the risk information while the session is running.

For the SIH prototype, live analysis is intended for microphone input or another audio stream that the application is authorized to process.

---

# 9. Authentication

Authentication is handled by the backend.

Basic flow:

```text
Register
   ↓
Backend
   ↓
Password Hash
   ↓
PostgreSQL
```

For login:

```text
Login
 ↓
Backend
 ↓
Verify Credentials
 ↓
JWT Token
 ↓
Frontend
```

The frontend sends the JWT token with protected API requests.

Passwords are never stored as plain text.

---

# 10. Security and Privacy

Since voice recordings can contain sensitive information, the application should follow basic security and privacy practices.

Some of the planned measures are:

* Password hashing
* JWT authentication
* Authorization checks
* File type validation
* File size limits
* Rate limiting
* Secure environment variables
* Temporary audio cleanup
* Access control for analysis history
* No API keys or passwords committed to Git

Development secrets should be stored in `.env` files and excluded using `.gitignore`.

---

# 11. Project Structure

The main project structure is:

```text
VoiceShield/
│
├── frontend/
│   ├── HTML files
│   ├── css/
│   ├── js/
│   └── assets/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── ml/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── websocket/
│   └── tests/
│
├── ml/
│   ├── preprocessing/
│   ├── features/
│   ├── detection/
│   ├── speaker_verification/
│   ├── training/
│   ├── evaluation/
│   └── tests/
│
├── database/
│   ├── schema/
│   ├── migrations/
│   └── seeds/
│
├── docs/
├── deployment/
├── storage/
└── tests/
```

Each team member mainly works inside their assigned area.

---

# 12. Team Responsibilities

### Frontend Member

Works mainly on:

```text
frontend/
```

Focus:

* Pages
* UI
* Audio recording
* Upload
* Results
* Dashboard
* Charts
* WebSocket client

### Backend Member

Works mainly on:

```text
backend/
```

Focus:

* FastAPI
* Authentication
* APIs
* Audio handling
* ML integration
* WebSockets
* Risk engine

### Database Member

Works mainly on:

```text
database/
```

Focus:

* PostgreSQL
* Tables
* Relationships
* Constraints
* Indexes
* Migrations
* Seed data

### ML Member

Works mainly on:

```text
ml/
```

Focus:

* Dataset
* Preprocessing
* Feature extraction
* Deepfake detection
* Speaker verification
* Model evaluation
* Inference

---

# 13. Shared Development Rules

All team members can read the documentation, but changes to shared contracts should be coordinated.

The important shared files are:

```text
docs/
├── ARCHITECTURE.md
├── API_CONTRACT.md
├── DATABASE_SCHEMA.md
└── ML_SPECIFICATION.md
```

The main rule is:

> A change in one component should not silently break another component.

For example, if the ML service changes:

```json
{
  "ai_probability": 0.91
}
```

to:

```json
{
  "fake_score": 91
}
```

the backend and API documentation also need to be updated.

---

# 14. Development Environment

The project is designed to run locally during development.

The main services are:

```text
Frontend
Backend
ML Service
PostgreSQL
```

Docker Compose will eventually be used to simplify running these services together.

Conceptually:

```text
Docker Compose
│
├── Backend
├── ML Service
├── PostgreSQL
└── Frontend/Web Server
```

---

# 15. Final Data Flow

The main VoiceShield pipeline can be summarized as:

```text
              AUDIO
                ↓
            FRONTEND
                ↓
             BACKEND
                ↓
        ┌───────┴───────┐
        ↓               ↓
       ML            DATABASE
        ↓
   ML Prediction
        ↓
    Risk Engine
        ↓
    DATABASE
        ↓
     FRONTEND
        ↓
      RESULT
```

The goal is to keep each part independent enough that the four team members can develop in parallel while still following the same interfaces and data structures.
