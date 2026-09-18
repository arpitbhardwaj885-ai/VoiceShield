# Database Schema Documentation

## VoiceShield / AI Voice-Cloning Impersonation Detection System

**Database:** Supabase PostgreSQL  
**Storage:** Supabase Storage  
**Schema:** `public`  
**Last verified:** 2026-09-04

This document describes the current live database structure of the project. It is based on the database audit results and reflects the tables, columns, constraints, relationships, indexes, triggers, and storage bucket currently present in Supabase.

---

## 1. Database Overview

The database supports:

- User accounts
- Audio file metadata
- Speaker profiles
- Speaker reference audio
- AI voice/deepfake analyses
- Suspicious audio segments
- ML model version tracking
- Analysis history
- Private audio storage

### Core Processing Flow

```text
User
  │
  ├── Creates Account
  │
  ├── Uploads Audio
  │      │
  │      ▼
  │   audio_files
  │      │
  │      ▼
  │   ML Analysis
  │      │
  │      ▼
  │   analyses
  │      │
  │      ├── Suspicious Segments → segments
  │      │
  │      └── Model Used → model_versions
  │
  └── Optional Speaker Profile
         │
         ├── speakers
         │
         └── speaker_reference_audio
---

# 2. Tables

The database currently contains seven core tables:

| Table | Purpose |
|---|---|
| `users` | Stores application user accounts |
| `audio_files` | Stores metadata for uploaded audio files |
| `speakers` | Stores speaker profiles |
| `speaker_reference_audio` | Links speaker profiles to reference audio |
| `analyses` | Stores AI/deepfake analysis results |
| `segments` | Stores suspicious time segments from analyses |
| `model_versions` | Tracks ML model versions used for analysis |

---

# 3. Table Schema

## 3.1 users

Stores application users.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | No | `gen_random_uuid()` |
| name | varchar(100) | No | — |
| email | varchar(255) | No | — |
| password_hash | text | Yes | — |
| created_at | timestamptz | No | `now()` |
| updated_at | timestamptz | No | `now()` |

### Constraints

- Primary Key: `id`
- Unique: `email`

### Indexes

- `users_pkey`
- `users_email_key`
- `idx_users_email`

---

## 3.2 audio_files

Stores metadata for uploaded audio files. The actual audio file is stored in Supabase Storage.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | No | `gen_random_uuid()` |
| user_id | uuid | No | — |
| filename | varchar(255) | No | — |
| storage_path | text | No | — |
| mime_type | varchar(100) | No | — |
| file_size | bigint | No | — |
| duration | numeric | Yes | — |
| status | varchar(30) | No | — |
| created_at | timestamptz | No | `now()` |

### Relationships

```text
audio_files.user_id
    → users.id
```

### Delete Behavior

```text
users deleted
    → related audio_files deleted (CASCADE)
```

### Indexes

- `audio_files_pkey`
- `idx_audio_files_user_id`
- `idx_audio_files_created_at`

---

## 3.3 speakers

Stores speaker profiles created by users.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | No | `gen_random_uuid()` |
| user_id | uuid | No | — |
| name | varchar(100) | No | — |
| status | varchar(30) | No | — |
| embedding_reference | text | Yes | — |
| created_at | timestamptz | No | `now()` |
| updated_at | timestamptz | No | `now()` |

### Relationships

```text
speakers.user_id
    → users.id
```

### Delete Behavior

```text
users deleted
    → related speakers deleted (CASCADE)
```

### Allowed Status Values

```text
processing
ready
failed
```

### Indexes

- `speakers_pkey`
- `idx_speakers_user_id`

---

## 3.4 speaker_reference_audio

Links a speaker profile with audio files used as reference samples.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | No | `gen_random_uuid()` |
| speaker_id | uuid | No | — |
| audio_id | uuid | No | — |
| status | varchar(30) | No | — |
| duration | numeric | Yes | — |
| created_at | timestamptz | No | `now()` |
| updated_at | timestamptz | No | `now()` |

### Relationships

```text
speaker_reference_audio.speaker_id
    → speakers.id

speaker_reference_audio.audio_id
    → audio_files.id
```

### Delete Behavior

```text
speaker deleted
    → related reference audio records deleted (CASCADE)

audio deleted
    → related reference audio records deleted (CASCADE)
```

### Current Indexes

- `speaker_reference_audio_pkey`
- `idx_speaker_reference_audio_audio_id`
- `idx_speaker_reference_audio_speaker_id`
- `idx_sra_audio_id`
- `idx_sra_speaker_id`

> Note: `idx_sra_audio_id` and `idx_sra_speaker_id` are redundant with the longer-named indexes. They currently exist in the live database.

---

## 3.5 model_versions

Tracks versions of machine learning models used for analysis.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | No | `gen_random_uuid()` |
| model_name | varchar(100) | No | — |
| version | varchar(30) | No | — |
| model_type | varchar(50) | No | — |
| description | text | Yes | — |
| created_at | timestamptz | No | `now()` |

### Indexes

- `model_versions_pkey`
- `idx_model_versions_model_name`
- `idx_model_versions_version`

---

## 3.6 analyses

Stores the results of AI voice/deepfake analysis.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | No | `gen_random_uuid()` |
| user_id | uuid | No | — |
| audio_id | uuid | No | — |
| speaker_id | uuid | Yes | — |
| model_version_id | uuid | Yes | — |
| status | varchar(30) | No | — |
| analysis_type | varchar(40) | No | — |
| ai_probability | numeric(5,4) | Yes | — |
| authentic_probability | numeric(5,4) | Yes | — |
| speaker_similarity | numeric(5,4) | Yes | — |
| risk_score | numeric(5,4) | Yes | — |
| risk_level | varchar(20) | Yes | — |
| confidence | numeric(5,4) | Yes | — |
| explanation | jsonb | Yes | — |
| created_at | timestamptz | No | `now()` |
| completed_at | timestamptz | Yes | — |

### Relationships

```text
analyses.user_id
    → users.id

analyses.audio_id
    → audio_files.id

analyses.speaker_id
    → speakers.id

analyses.model_version_id
    → model_versions.id
```

### Delete Behavior

```text
user deleted
    → analyses deleted (CASCADE)

audio deleted
    → analyses deleted (CASCADE)

speaker deleted
    → speaker_id becomes NULL (SET NULL)

model version deleted
    → model_version_id becomes NULL (SET NULL)
```

### Allowed Status Values

```text
queued
processing
completed
failed
```

### Allowed Analysis Types

```text
full
deepfake_only
speaker_verification
```

### Allowed Risk Levels

```text
LOW
MEDIUM
HIGH
CRITICAL
```

### Probability and Score Validation

The following fields must remain between `0` and `1`:

- `ai_probability`
- `authentic_probability`
- `speaker_similarity`
- `risk_score`
- `confidence`

### Indexes

- `analyses_pkey`
- `idx_analyses_user_id`
- `idx_analyses_audio_id`
- `idx_analyses_speaker_id`
- `idx_analyses_model_version_id`
- `idx_analyses_status`
- `idx_analyses_risk_level`
- `idx_analyses_created_at`
- `idx_analyses_user_created`

The composite index `idx_analyses_user_created` uses:

```text
(user_id, created_at)
```

---

## 3.7 segments

Stores suspicious portions of an analyzed audio file.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | No | `gen_random_uuid()` |
| analysis_id | uuid | No | — |
| start_time | numeric | No | — |
| end_time | numeric | No | — |
| ai_probability | numeric(5,4) | No | — |
| risk_level | varchar(20) | No | — |
| indicators | jsonb | Yes | — |
| created_at | timestamptz | No | `now()` |

### Relationship

```text
segments.analysis_id
    → analyses.id
```

### Delete Behavior

```text
analysis deleted
    → related segments deleted (CASCADE)
```

### Validation

```text
end_time > start_time
```

### AI Probability

```text
0 ≤ ai_probability ≤ 1
```

### Allowed Risk Levels

```text
LOW
MEDIUM
HIGH
CRITICAL
```

### Indexes

- `segments_pkey`
- `idx_segments_analysis_id`

---

# 4. Entity Relationship Overview

```text
┌──────────────┐
│    users     │
└──────┬───────┘
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│ audio_files  │       │   speakers   │
└──────┬───────┘       └──────┬───────┘
       │                      │
       │                      ▼
       │              ┌──────────────────────────┐
       │              │ speaker_reference_audio  │
       │              └──────────────────────────┘
       │
       ▼
┌──────────────┐       ┌────────────────┐
│   analyses   │──────▶│ model_versions │
└──────┬───────┘       └────────────────┘
       │
       ▼
┌──────────────┐
│   segments   │
└──────────────┘
```

---

# 5. Security Architecture

## Row Level Security

RLS is intended to be enabled on all seven application tables.

The application architecture uses backend-controlled database access:

```text
Frontend
    │
    ▼
Backend API
    │
    ▼
Supabase PostgreSQL
```

The frontend should not directly access the database using privileged credentials.

### Critical Rule

The Supabase Service Role Key must:

- Remain on the backend only
- Never be exposed to the frontend
- Never be committed to GitHub
- Never be included in browser JavaScript

---

# 6. Supabase Storage

## Bucket

| Property | Value |
|---|---|
| Bucket ID | `audio-files` |
| Bucket Name | `audio-files` |
| Public | `false` |
| File Size Limit | Not configured |
| Allowed MIME Types | Not configured |

The bucket is private and is used for storing audio files.

The database stores the file location using:

```text
audio_files.storage_path
```

---

# 7. Automatic Timestamp Updates

The database contains the function:

```sql
set_updated_at()
```

Its behavior is:

```sql
NEW.updated_at = now();
RETURN NEW;
```

### Tables Using the Trigger

| Table | Trigger |
|---|---|
| users | `trg_users_updated_at` |
| speakers | `trg_speakers_updated_at` |
| speaker_reference_audio | `trg_speaker_reference_audio_updated_at` |

All three triggers execute before an `UPDATE`.

---

# 8. Current Database Index Summary

## users

- Primary key index on `id`
- Unique index on `email`
- Additional index on `email`

## audio_files

- Primary key index on `id`
- Index on `user_id`
- Index on `created_at`

## speakers

- Primary key index on `id`
- Index on `user_id`

## speaker_reference_audio

- Primary key index on `id`
- Indexes on `speaker_id`
- Indexes on `audio_id`

## analyses

- Primary key index on `id`
- Index on `user_id`
- Index on `audio_id`
- Index on `speaker_id`
- Index on `model_version_id`
- Index on `status`
- Index on `risk_level`
- Index on `created_at`
- Composite index on `(user_id, created_at)`

## segments

- Primary key index on `id`
- Index on `analysis_id`

## model_versions

- Primary key index on `id`
- Index on `model_name`
- Index on `version`

---

# 9. Current Database Status

At the time of the latest schema audit:

- All 7 required tables exist.
- All tables are currently empty.
- Primary keys are configured.
- Foreign key relationships are configured.
- Email uniqueness is configured.
- Validation constraints are configured.
- Timestamp defaults are configured.
- UUID generation is configured.
- Updated-at triggers are configured.
- The `audio-files` storage bucket exists and is private.

---

# 10. Backend Integration Guidelines

The expected application flow is:

```text
1. User registers
        ↓
2. Backend creates user record
        ↓
3. User uploads audio
        ↓
4. Audio stored in Supabase Storage
        ↓
5. Metadata inserted into audio_files
        ↓
6. Analysis record created with status = queued
        ↓
7. ML service processes audio
        ↓
8. Analysis results stored in analyses
        ↓
9. Suspicious regions stored in segments
        ↓
10. Frontend retrieves results through backend API
```

---

# 11. Important Data Rules

## UUIDs

All primary IDs use:

```sql
gen_random_uuid()
```

## Timestamps

Creation timestamps use:

```sql
now()
```

Updated timestamps are maintained through database triggers.

## Probability Values

All probability and score fields using validation constraints must remain in the range:

```text
0.0000 to 1.0000
```

## Audio Storage

Audio binary data is not stored directly inside PostgreSQL tables.

Instead:

```text
Audio File
    ↓
Supabase Storage
    ↓
storage_path stored in audio_files table
```

---

# 12. Known Current Database Notes

### Redundant Indexes

The live database currently contains duplicate/redundant indexes on `speaker_reference_audio`:

```text
idx_speaker_reference_audio_audio_id
idx_sra_audio_id
```

Both index `audio_id`.

And:

```text
idx_speaker_reference_audio_speaker_id
idx_sra_speaker_id
```

Both index `speaker_id`.

These do not break functionality but may be cleaned up later.

### Additional Email Index

The `users.email` column has both:

- `users_email_key` — unique index created by the UNIQUE constraint
- `idx_users_email` — regular index

Because the unique index already supports email lookups, the additional regular email index may be redundant.

These current indexes are documented here because this file reflects the live database state.

---

# 13. Schema Verification Checklist

| Component | Status |
|---|---|
| Required tables | Verified |
| Columns | Verified |
| Primary keys | Verified |
| Foreign keys | Verified |
| Email uniqueness | Verified |
| CHECK constraints | Verified |
| UUID defaults | Verified |
| Timestamp defaults | Verified |
| Indexes | Verified |
| Updated-at triggers | Verified |
| Updated-at function | Verified |
| Private storage bucket | Verified |
| RLS status | Pending final verification |
| RLS policies | Pending final verification |

---

## Document Purpose

This document is intended to serve as the repository reference for the current Supabase database structure. Any future schema migration should update this document to keep the repository documentation synchronized with the live database.
