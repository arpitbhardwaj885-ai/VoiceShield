# VoiceShield — Database Schema

## 1. Purpose

This document defines the database structure for VoiceShield.

VoiceShield uses **Supabase PostgreSQL** for structured application data and **Supabase Storage** for persistent audio files.

The database supports:

* User accounts
* Uploaded and recorded audio
* Speaker profiles
* Speaker reference recordings
* Voice analysis results
* Suspicious audio segments
* ML model version tracking

The database is accessed through the backend. The ML service does not directly modify database records.

---

## 2. Database Technology

VoiceShield uses:

* **Platform:** Supabase
* **Database:** PostgreSQL
* **Audio Storage:** Supabase Storage
* **Primary Keys:** UUID
* **Timestamps:** TIMESTAMPTZ
* **Structured Data:** JSONB

Actual audio files are stored in Supabase Storage.

PostgreSQL stores the metadata and relationships associated with those files.

```text
Audio File
    ↓
Supabase Storage
    ↓
storage_path
    ↓
audio_files
```

---

## 3. Main Tables

The current VoiceShield database contains seven tables:

```text
users
audio_files
speakers
speaker_reference_audio
analyses
segments
model_versions
```

The overall relationship is:

```text
users
 │
 ├──< audio_files
 │
 ├──< speakers
 │       │
 │       └──< speaker_reference_audio
 │                         │
 │                         └──> audio_files
 │
 └──< analyses
          │
          ├──> audio_files
          ├──> speakers
          ├──> model_versions
          │
          └──< segments
```

---

## 4. users

The `users` table stores application user information.

### Table: `users`

| Column        | Type         | Constraints      | Description                                            |
| ------------- | ------------ | ---------------- | ------------------------------------------------------ |
| id            | UUID         | PRIMARY KEY      | Unique user identifier                                 |
| name          | VARCHAR(100) | NOT NULL         | User's display name                                    |
| email         | VARCHAR(255) | NOT NULL, UNIQUE | User email address                                     |
| password_hash | TEXT         | NULL             | Password hash if authentication is application-managed |
| created_at    | TIMESTAMPTZ  | NOT NULL         | Account creation time                                  |
| updated_at    | TIMESTAMPTZ  | NOT NULL         | Last account update                                    |

### Notes

If Supabase Auth is used, the application user should be associated with the corresponding Supabase Auth user ID.

Passwords must never be stored as plain text.

The email address must be unique.

---

## 5. audio_files

The `audio_files` table stores metadata about uploaded or recorded audio.

The actual audio binary is stored in Supabase Storage.

### Table: `audio_files`

| Column       | Type         | Constraints           | Description                          |
| ------------ | ------------ | --------------------- | ------------------------------------ |
| id           | UUID         | PRIMARY KEY           | Unique audio identifier              |
| user_id      | UUID         | FOREIGN KEY, NOT NULL | User who owns the audio              |
| filename     | VARCHAR(255) | NOT NULL              | Original or display filename         |
| storage_path | TEXT         | NOT NULL              | Path of the file in Supabase Storage |
| mime_type    | VARCHAR(100) | NOT NULL              | Audio MIME type                      |
| file_size    | BIGINT       | NOT NULL              | File size in bytes                   |
| duration     | NUMERIC      | NULL                  | Audio duration in seconds            |
| status       | VARCHAR(30)  | NOT NULL              | Current audio status                 |
| created_at   | TIMESTAMPTZ  | NOT NULL              | Upload/creation time                 |

### Relationship

```text
audio_files.user_id
        ↓
users.id
```

The `id` of this table is used as `audio_id` by the API.

### Storage flow

```text
Frontend
    ↓
FastAPI
    ↓
Supabase Storage
    ↓
audio_files metadata
```

---

## 6. speakers

The `speakers` table stores speaker profiles created by users.

A speaker profile can be used as a reference for speaker verification.

### Table: `speakers`

| Column              | Type         | Constraints           | Description                                |
| ------------------- | ------------ | --------------------- | ------------------------------------------ |
| id                  | UUID         | PRIMARY KEY           | Unique speaker identifier                  |
| user_id             | UUID         | FOREIGN KEY, NOT NULL | Owner of the speaker profile               |
| name                | VARCHAR(100) | NOT NULL              | Speaker profile name                       |
| status              | VARCHAR(30)  | NOT NULL              | Current speaker profile status             |
| embedding_reference | TEXT         | NULL                  | Reference to stored speaker representation |
| created_at          | TIMESTAMPTZ  | NOT NULL              | Profile creation time                      |
| updated_at          | TIMESTAMPTZ  | NOT NULL              | Last profile update                        |

### Speaker status

```text
processing
ready
failed
```

A speaker should only be used for verification when its status is:

```text
ready
```

### Relationship

```text
speakers.user_id
        ↓
users.id
```

---

## 7. speaker_reference_audio

The `speaker_reference_audio` table connects speaker profiles with their reference audio recordings.

A speaker can have multiple reference recordings.

Example:

```text
Speaker
   │
   ├── Reference Audio 1
   ├── Reference Audio 2
   └── Reference Audio 3
```

### Table: `speaker_reference_audio`

| Column     | Type        | Constraints           | Description                         |
| ---------- | ----------- | --------------------- | ----------------------------------- |
| id         | UUID        | PRIMARY KEY           | Unique reference record             |
| speaker_id | UUID        | FOREIGN KEY, NOT NULL | Related speaker profile             |
| audio_id   | UUID        | FOREIGN KEY, NOT NULL | Reference audio file                |
| status     | VARCHAR(30) | NOT NULL              | Current reference processing status |
| duration   | NUMERIC     | NULL                  | Reference audio duration            |
| created_at | TIMESTAMPTZ | NOT NULL              | Record creation time                |
| updated_at | TIMESTAMPTZ | NOT NULL              | Last update time                    |

### Relationships

```text
speaker_reference_audio.speaker_id
        ↓
speakers.id
```

```text
speaker_reference_audio.audio_id
        ↓
audio_files.id
```

The same `audio_files` system is reused for speaker reference recordings.

A separate audio-storage system is not required.

---

## 8. analyses

The `analyses` table stores the results and metadata of audio analyses.

An analysis belongs to a user and references the audio that was analyzed.

### Table: `analyses`

| Column                | Type         | Constraints           | Description                                  |
| --------------------- | ------------ | --------------------- | -------------------------------------------- |
| id                    | UUID         | PRIMARY KEY           | Unique analysis identifier                   |
| user_id               | UUID         | FOREIGN KEY, NOT NULL | User who requested the analysis              |
| audio_id              | UUID         | FOREIGN KEY, NOT NULL | Audio file being analyzed                    |
| speaker_id            | UUID         | FOREIGN KEY, NULL     | Speaker used for verification, if applicable |
| model_version_id      | UUID         | FOREIGN KEY, NULL     | ML model used for the analysis               |
| status                | VARCHAR(30)  | NOT NULL              | Current analysis status                      |
| analysis_type         | VARCHAR(40)  | NOT NULL              | Type of analysis                             |
| ai_probability        | DECIMAL(5,4) | NULL                  | Probability that the audio is AI-generated   |
| authentic_probability | DECIMAL(5,4) | NULL                  | Probability that the audio is authentic      |
| speaker_similarity    | DECIMAL(5,4) | NULL                  | Similarity to the selected speaker           |
| risk_score            | DECIMAL(5,4) | NULL                  | Overall application risk score               |
| risk_level            | VARCHAR(20)  | NULL                  | LOW, MEDIUM, HIGH or CRITICAL                |
| confidence            | DECIMAL(5,4) | NULL                  | Model confidence                             |
| explanation           | JSONB        | NULL                  | Structured explanation information           |
| created_at            | TIMESTAMPTZ  | NOT NULL              | Analysis creation time                       |
| completed_at          | TIMESTAMPTZ  | NULL                  | Analysis completion time                     |

### Status values

```text
queued
processing
completed
failed
```

### Analysis types

```text
full
deepfake_only
speaker_verification
```

### Probability values

Probability values should normally be within:

```text
0.0000 → 1.0000
```

Example:

```text
0.91 = 91%
```

### Speaker relationship

`speaker_id` is nullable because VoiceShield can perform AI/deepfake detection without speaker verification.

### Model relationship

`model_version_id` is nullable so that an analysis can be created before the final model version is assigned, if required by the processing workflow.

---

## 9. segments

The `segments` table stores suspicious or analyzed portions of an audio recording.

This allows the frontend to show where suspicious activity was detected.

### Table: `segments`

| Column         | Type         | Constraints           | Description                    |
| -------------- | ------------ | --------------------- | ------------------------------ |
| id             | UUID         | PRIMARY KEY           | Unique segment identifier      |
| analysis_id    | UUID         | FOREIGN KEY, NOT NULL | Related analysis               |
| start_time     | NUMERIC      | NOT NULL              | Segment start time in seconds  |
| end_time       | NUMERIC      | NOT NULL              | Segment end time in seconds    |
| ai_probability | DECIMAL(5,4) | NOT NULL              | AI probability for the segment |
| risk_level     | VARCHAR(20)  | NOT NULL              | Segment risk level             |
| indicators     | JSONB        | NULL                  | Detected segment indicators    |
| created_at     | TIMESTAMPTZ  | NOT NULL              | Segment creation time          |

### Relationship

```text
segments.analysis_id
        ↓
analyses.id
```

One analysis can contain multiple segments.

Example:

```text
Analysis
   │
   ├── Segment 1
   ├── Segment 2
   └── Segment 3
```

---

## 10. model_versions

The `model_versions` table stores information about the ML models used by VoiceShield.

This allows historical analyses to identify which model produced their results.

### Table: `model_versions`

| Column      | Type         | Constraints | Description                     |
| ----------- | ------------ | ----------- | ------------------------------- |
| id          | UUID         | PRIMARY KEY | Unique model version identifier |
| model_name  | VARCHAR(100) | NOT NULL    | Model name                      |
| version     | VARCHAR(30)  | NOT NULL    | Model version                   |
| model_type  | VARCHAR(50)  | NOT NULL    | Type of ML model                |
| description | TEXT         | NULL        | Model description               |
| created_at  | TIMESTAMPTZ  | NOT NULL    | Model registration time         |

Example:

```text
Model Name: VoiceShield Detector
Version: v1.0
Model Type: deepfake_detection
```

A future model may be:

```text
v1.1
v2.0
```

Existing analyses should retain their associated model version.

---

## 11. Main Relationships

### User → Audio Files

One user can own multiple audio files.

```text
users.id
   │
   │ 1 : N
   ▼
audio_files.user_id
```

### User → Speakers

One user can create multiple speaker profiles.

```text
users.id
   │
   │ 1 : N
   ▼
speakers.user_id
```

### Speaker → Reference Audio

One speaker can have multiple reference recordings.

```text
speakers.id
   │
   │ 1 : N
   ▼
speaker_reference_audio.speaker_id
```

### Reference Audio → Audio File

Each reference recording points to an audio file.

```text
audio_files.id
   │
   │ 1 : N
   ▼
speaker_reference_audio.audio_id
```

### User → Analyses

One user can have multiple analyses.

```text
users.id
   │
   │ 1 : N
   ▼
analyses.user_id
```

### Audio File → Analyses

One audio file can be associated with analysis records.

```text
audio_files.id
   │
   │ 1 : N
   ▼
analyses.audio_id
```

### Speaker → Analyses

A speaker can be associated with multiple analyses.

```text
speakers.id
   │
   │ 1 : N
   ▼
analyses.speaker_id
```

The relationship is optional because `speaker_id` may be NULL.

### Model Version → Analyses

One model version can be used for many analyses.

```text
model_versions.id
   │
   │ 1 : N
   ▼
analyses.model_version_id
```

### Analysis → Segments

One analysis can contain multiple segments.

```text
analyses.id
   │
   │ 1 : N
   ▼
segments.analysis_id
```

---

## 12. Foreign Keys

The database must maintain these relationships:

```text
audio_files.user_id
        → users.id

speakers.user_id
        → users.id

speaker_reference_audio.speaker_id
        → speakers.id

speaker_reference_audio.audio_id
        → audio_files.id

analyses.user_id
        → users.id

analyses.audio_id
        → audio_files.id

analyses.speaker_id
        → speakers.id

analyses.model_version_id
        → model_versions.id

segments.analysis_id
        → analyses.id
```

Foreign keys prevent records from referring to resources that do not exist.

---

## 13. Reference Count

`reference_count` is not stored as a column in `speakers`.

If the API needs to return:

```json
{
  "speaker_id": "uuid",
  "reference_count": 3
}
```

the count should be calculated from:

```text
speaker_reference_audio
```

Example:

```text
Speaker
   ↓
speaker_reference_audio
   ↓
3 records
   ↓
reference_count = 3
```

This avoids synchronization problems.

---

## 14. Audio Storage

VoiceShield stores actual audio files in **Supabase Storage**.

Example:

```text
Supabase Storage
└── audio/
    └── user-id/
        ├── audio-1.wav
        ├── audio-2.wav
        └── audio-3.wav
```

The database stores:

```text
storage_path
```

The database does not store the actual audio binary.

The normal flow is:

```text
Frontend
    ↓
FastAPI
    ↓
Supabase Storage
    ↓
audio_files
```

Temporary local files may be used during ML processing when required.

---

## 15. Speaker Embeddings

Speaker embeddings are ML representations associated with speaker profiles.

The database stores:

```text
embedding_reference
```

rather than unnecessarily storing the complete embedding inside a normal text field.

Conceptually:

```text
Speaker
   ↓
embedding_reference
   ↓
Stored speaker representation
```

The exact physical storage mechanism for the representation is an implementation detail of the ML system and should remain compatible with the backend contract.

---

## 16. JSONB Fields

VoiceShield uses JSONB for structured information whose internal structure may evolve.

Current JSONB fields include:

```text
analyses.explanation
segments.indicators
```

Example:

```json
{
  "indicators": [
    "Synthetic speech indicators detected",
    "Unnatural spectral patterns detected"
  ],
  "summary": "Characteristics associated with synthetic speech were detected."
}
```

The exact explanation contents are produced by the ML/application layer.

---

## 17. Data Integrity

The database should enforce important integrity rules.

### Analysis

An analysis must reference:

```text
user_id → existing user
audio_id → existing audio file
```

Optional relationships:

```text
speaker_id → existing speaker
model_version_id → existing model version
```

### Speaker Reference

A speaker reference must reference:

```text
speaker_id → existing speaker
audio_id → existing audio file
```

### Segment

A segment must reference:

```text
analysis_id → existing analysis
```

### Probability Constraints

Probability values should be limited to:

```text
0.0000 → 1.0000
```

where applicable.

### Segment Time

The segment end time should be greater than the segment start time.

---

## 18. Delete Behavior

Deletion must be handled carefully because records are related.

### Deleting an analysis

Its related segments may also be deleted.

```text
Analysis
   ↓
Segments
```

The intended relationship is suitable for cascading segment deletion when an analysis is removed.

### Deleting a speaker

Speaker reference records must be handled appropriately.

```text
Speaker
   ↓
speaker_reference_audio
```

### Deleting a user

User deletion can affect:

```text
User
 ├── Audio Files
 ├── Speakers
 └── Analyses
```

Deletion behavior must follow the project's privacy and retention requirements.

The backend must not accidentally delete required data.

---

## 19. Indexes

Initial indexes should support common queries.

Recommended indexes:

```text
users.email

audio_files.user_id
audio_files.created_at

speakers.user_id

speaker_reference_audio.speaker_id
speaker_reference_audio.audio_id

analyses.user_id
analyses.audio_id
analyses.speaker_id
analyses.model_version_id
analyses.created_at
analyses.status
analyses.risk_level

segments.analysis_id

model_versions.model_name
model_versions.version
```

Additional indexes can be introduced later based on actual query performance.

---

## 20. UUIDs

VoiceShield uses UUIDs for primary keys.

Example:

```text
550e8400-e29b-41d4-a716-446655440000
```

UUIDs provide globally unique identifiers and avoid exposing simple sequential record numbers.

---

## 21. Timestamps

VoiceShield uses `TIMESTAMPTZ` for timestamps.

Important records contain:

```text
created_at
```

Records that can be updated also contain:

```text
updated_at
```

Analysis records additionally contain:

```text
completed_at
```

Application timestamps should be handled consistently using UTC.

---

## 22. Ownership and Access

Users should only be able to access resources belonging to them.

This includes:

* Audio files
* Speaker profiles
* Speaker reference recordings
* Analyses
* Analysis segments

Example:

```text
User A
 ├── Audio A
 ├── Speaker A
 └── Analysis A

User B
 ├── Audio B
 ├── Speaker B
 └── Analysis B
```

User A must not be able to access User B's private resources.

The backend must validate ownership before protected operations.

Supabase Row Level Security (RLS) should be used where appropriate.

---

## 23. Database Security

The following must never be committed to GitHub:

```text
.env
Supabase service-role key
Database passwords
JWT secrets
Private credentials
```

The Supabase service-role key must only be used in trusted server-side/backend code.

It must never be exposed to the frontend.

The frontend must never connect directly to PostgreSQL.

---

## 24. Backend Database Boundary

The intended database communication flow is:

```text
Frontend
    ↓
FastAPI
    ↓
Supabase PostgreSQL
```

The ML service does not directly modify PostgreSQL.

The ML flow is:

```text
FastAPI
    ↓
ML
    ↓
Analysis Result
    ↓
FastAPI
    ↓
Supabase PostgreSQL
```

This keeps database access centralized through the backend.

---

## 25. Source of Truth

The SQL implementation must remain consistent with this document.

Database implementation files are located under:

```text
database/schema/
database/migrations/
database/seeds/
```

The backend SQLAlchemy models must match the database schema.

If the database structure changes, update:

1. SQL schema/migration files
2. `DATABASE_SCHEMA.md`
3. `API_CONTRACT.md` if the API is affected
4. Backend database models if required

No team member should independently introduce a database structure that conflicts with this document.

---

## 26. Final Database Structure

The current VoiceShield database consists of:

```text
1. users
2. audio_files
3. speakers
4. speaker_reference_audio
5. analyses
6. segments
7. model_versions
```

Complete relationship structure:

```text
                         users
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
       audio_files      speakers      analyses
             │             │             │
             │             ▼             │
             │   speaker_reference_audio │
             │             │             │
             └─────────────┘             │
                           │             │
                           ▼             ▼
                        analyses ──────> segments
                           │
                           ▼
                    model_versions
```

The authoritative implementation must follow this seven-table design and the relationships defined in this document.

---

## 27. Development Notes

This document defines the current VoiceShield database contract.

The database member should implement the PostgreSQL schema in Supabase according to this document.

The backend member should create matching SQLAlchemy models.

The frontend must use the backend API rather than directly accessing the database.

The ML system must return analysis information through the defined backend/ML interface rather than directly modifying database records.

The schema should remain simple enough for the first working version while supporting future improvements to detection, speaker verification, analysis history, explainability, and model tracking.
