in this one na

Yes. Replace the current docs/DATABASE_SCHEMA.md with this version. I’ve kept it technical but natural, like documentation written by a student development team rather than an AI-generated specification.

# VoiceShield — Database Schema

## 1. Overview

VoiceShield uses PostgreSQL to store user accounts, analysis results, speaker profiles, suspicious audio segments, and information about the ML models used for analysis.

The database is accessed only through the backend.

```text
Frontend
   ↓
Backend
   ↓
PostgreSQL

The ML service does not directly modify the database. It sends its analysis result to the backend, and the backend stores the required information.
2. Main Tables

The initial database contains five main tables:

users
analyses
segments
speakers
model_versions

The basic relationship is:

users
  │
  ├───────────────┐
  │               │
  ▼               ▼
analyses        speakers
  │
  ▼
segments

analyses
  │
  ▼
model_versions

3. Users

The users table stores the accounts created in VoiceShield.
Table: users
Column	Type	Constraints	Description
id	UUID	PRIMARY KEY	Unique user ID
name	VARCHAR(100)	NOT NULL	User's display name
email	VARCHAR(255)	NOT NULL, UNIQUE	Login email
password_hash	TEXT	NOT NULL	Hashed password
created_at	TIMESTAMP	NOT NULL	Account creation time
updated_at	TIMESTAMP	NOT NULL	Last account update
Notes

Passwords must never be stored directly.

Only the password hash is stored in the database.

The email address is unique so that two accounts cannot use the same email.
4. Analyses

The analyses table stores every audio analysis requested by a user.
Table: analyses
Column	Type	Constraints	Description
id	UUID	PRIMARY KEY	Unique analysis ID
user_id	UUID	FOREIGN KEY, NOT NULL	User who started the analysis
filename	VARCHAR(255)	NOT NULL	Original audio filename
status	VARCHAR(30)	NOT NULL	Current analysis status
analysis_type	VARCHAR(40)	NOT NULL	Type of analysis
ai_probability	DECIMAL(5,4)	NULL	Probability that audio is AI-generated
authentic_probability	DECIMAL(5,4)	NULL	Probability that audio is authentic
speaker_similarity	DECIMAL(5,4)	NULL	Similarity to selected speaker
risk_score	DECIMAL(5,4)	NULL	Overall application risk score
risk_level	VARCHAR(20)	NULL	LOW, MEDIUM, HIGH or CRITICAL
model_version_id	UUID	FOREIGN KEY, NULL	Model used for analysis
created_at	TIMESTAMP	NOT NULL	Analysis creation time
completed_at	TIMESTAMP	NULL	Time analysis finished
Status values

An analysis can have one of these states:

queued
processing
completed
failed

Analysis types

full
deepfake_only
speaker_verification

The probability values should normally be between:

0.0000 and 1.0000

For example:

0.91 = 91%

5. Segments

The segments table stores specific portions of an audio recording that were analyzed or marked as suspicious.

This allows the frontend to show users where suspicious activity was detected.
Table: segments
Column	Type	Constraints	Description
id	UUID	PRIMARY KEY	Unique segment ID
analysis_id	UUID	FOREIGN KEY, NOT NULL	Related analysis
start_time	DECIMAL(10,3)	NOT NULL	Segment start time in seconds
end_time	DECIMAL(10,3)	NOT NULL	Segment end time in seconds
ai_probability	DECIMAL(5,4)	NOT NULL	AI probability for this segment
risk_level	VARCHAR(20)	NOT NULL	Risk level of the segment
created_at	TIMESTAMP	NOT NULL	Record creation time

Example:

Analysis: 123

Segment 1
Start: 8.000 sec
End:   12.000 sec
AI probability: 0.94
Risk: HIGH

The frontend can use this information to highlight the suspicious part of the audio.
6. Speakers

The speakers table stores speaker profiles created by users.

A speaker profile can be used as a reference when performing speaker verification.
Table: speakers
Column	Type	Constraints	Description
id	UUID	PRIMARY KEY	Unique speaker ID
user_id	UUID	FOREIGN KEY, NOT NULL	Owner of the speaker profile
name	VARCHAR(100)	NOT NULL	Speaker profile name
status	VARCHAR(30)	NOT NULL	Current speaker profile status
embedding_reference	TEXT	NULL	Reference to stored speaker representation
created_at	TIMESTAMP	NOT NULL	Profile creation time
updated_at	TIMESTAMP	NOT NULL	Last profile update
Speaker status

Initially:

processing
ready
failed

A speaker should only be used for verification when its status is:

ready

7. Model Versions

The model_versions table keeps track of the ML model used to produce an analysis.

This is useful because the VoiceShield model will probably improve over time.

For example:

v1.0
v1.1
v2.0

Old analysis results should still show which model produced them.
Table: model_versions
Column	Type	Constraints	Description
id	UUID	PRIMARY KEY	Unique model record
name	VARCHAR(100)	NOT NULL	Model name
version	VARCHAR(30)	NOT NULL	Model version
model_type	VARCHAR(50)	NOT NULL	Type of ML model
created_at	TIMESTAMP	NOT NULL	Model record creation time

Example:

Name: VoiceShield Detector
Version: v1.0
Type: deepfake_detection

8. Relationships
User → Analyses

One user can have many analyses.

users.id
   │
   │ 1 : N
   ▼
analyses.user_id

User → Speakers

One user can create multiple speaker profiles.

users.id
   │
   │ 1 : N
   ▼
speakers.user_id

Analysis → Segments

One analysis can contain multiple segments.

analyses.id
   │
   │ 1 : N
   ▼
segments.analysis_id

Model Version → Analyses

One model version can be used for many analyses.

model_versions.id
   │
   │ 1 : N
   ▼
analyses.model_version_id

9. Foreign Keys

The database should maintain the following foreign keys:

analyses.user_id
        → users.id

analyses.model_version_id
        → model_versions.id

segments.analysis_id
        → analyses.id

speakers.user_id
        → users.id

Foreign keys prevent records from referring to users, analyses, or models that do not exist.
10. Delete Behavior

User data should not be accidentally removed through unrelated operations.

Recommended behavior:
Deleting an analysis

When an analysis is deleted, its related segments can also be deleted.

Analysis
   ↓
Segments

Deleting a user

User deletion should be handled carefully by the backend because it may involve:

User
 ├── Analyses
 └── Speakers

The backend should ensure that associated data is handled according to the project's privacy and retention policy.
11. Indexes

Indexes should be added to fields that are frequently searched.

Initial indexes:

users.email
analyses.user_id
analyses.created_at
analyses.status
analyses.risk_level
segments.analysis_id
speakers.user_id
analyses.model_version_id

The database member can add additional indexes later if actual query performance shows a need.
12. UUIDs

VoiceShield will use UUIDs for primary keys instead of simple sequential integers.

Example:

550e8400-e29b-41d4-a716-446655440000

This makes IDs harder to guess and works well when different services generate records independently.
13. Timestamps

Tables should use timestamps for important records.

At minimum:

created_at

Tables that can be updated should also have:

updated_at

All application timestamps should be handled consistently, preferably using UTC.
14. Audio Storage

The database should not store the actual audio binary data.

Instead, the application stores audio separately and keeps only the required metadata/reference.

For example:

Audio file
    ↓
File/Object Storage

Database
    ↓
Analysis metadata

The actual storage approach can initially use the project's storage/ directory and later be replaced with object storage if required.
15. Speaker Embeddings

Speaker embeddings can become relatively large ML data structures.

For the first version, the database should store a reference rather than unnecessarily putting the entire embedding into a normal text field.

embedding_reference
        ↓
Stored embedding / representation

The exact embedding storage approach can be changed later without changing the rest of the database design.
16. Example Data

A simplified example of an analysis record:

id:
7b9c...

user_id:
1d42...

filename:
meeting_recording.wav

status:
completed

analysis_type:
full

ai_probability:
0.9100

authentic_probability:
0.0900

speaker_similarity:
0.8700

risk_score:
0.8900

risk_level:
HIGH

model_version:
v1.0

17. Database Security

The database must not be exposed directly to the frontend.

The correct flow is:

Frontend
   ↓
Backend API
   ↓
PostgreSQL

Database credentials must be stored in environment variables.

Example:

DATABASE_URL=postgresql://...

The actual .env file must not be committed to GitHub.

Use .env.example for documenting required variables.
18. Ownership and Access

A user should only be able to access their own data.

For example:

User A
  ↓
Only User A's analyses
Only User A's speakers

The backend is responsible for checking ownership before returning, updating, or deleting records.

The database schema supports this through the user_id relationships.
19. Initial Schema Summary

┌───────────────────┐
│       users       │
├───────────────────┤
│ id PK             │
│ name              │
│ email             │
│ password_hash     │
│ created_at        │
│ updated_at        │
└────────┬──────────┘
         │
         ├───────────────────┐
         │                   │
         ▼                   ▼
┌───────────────────┐ ┌───────────────────┐
│     analyses      │ │     speakers      │
├───────────────────┤ ├───────────────────┤
│ id PK             │ │ id PK             │
│ user_id FK        │ │ user_id FK        │
│ filename          │ │ name              │
│ status            │ │ status            │
│ analysis_type     │ │ embedding_ref     │
│ ai_probability    │ │ created_at        │
│ authentic_prob.   │ │ updated_at        │
│ speaker_similarity│ └───────────────────┘
│ risk_score        │
│ risk_level        │
│ model_version FK  │
│ created_at        │
│ completed_at      │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│     segments      │
├───────────────────┤
│ id PK             │
│ analysis_id FK    │
│ start_time        │
│ end_time          │
│ ai_probability    │
│ risk_level        │
│ created_at        │
└───────────────────┘

┌──────────────────────┐
│   model_versions     │
├──────────────────────┤
│ id PK                │
│ name                 │
│ version              │
│ model_type           │
│ created_at           │
└──────────────────────┘
          │
          │
          └──────→ analyses

20. Development Notes

This is the initial database design for VoiceShield.

The database member should implement the schema using the SQL files inside:

database/schema/

The backend member should create matching SQLAlchemy models.

If a change is required later, the database schema, backend models, and relevant API documentation should be updated together.

The goal is to keep the database simple enough for the first working version while leaving room for future features such as more detailed model tracking, additional analysis types, and improved speaker management.


### After replacing the file

Run:

```bash
git status

Then:

git add docs/DATABASE_SCHEMA.md
git commit -m "docs: define database schema"
git push origin main

After this, Task 5 is locked.

Your documentation chain will be:

PROJECT_SPECIFICATION.md
        ↓
FEATURES.md
        ↓
ARCHITECTURE.md
        ↓
API_CONTRACT.md
        ↓
DATABASE_SCHEMA.md
        ↓
ML_SPECIFICATION.md

Then we should stop adding documentation and start the actual implementation phase, beginning with the database SQL + backend models, while the other three members work in parallel.

but what part i have to copy paste in the md

Copy only the content inside the code block, starting from:

# VoiceShield — Database Schema

and ending with:

The goal is to keep the database simple enough for the first working version while leaving room for future features such as more detailed model tracking, additional analysis types, and improved speaker management.

Do NOT copy these parts:

    The opening explanation I wrote before the code block

    The line saying ```markdown

    The final ` ````

    The Git commands after the code block

So your docs/DATABASE_SCHEMA.md should look like:

# VoiceShield — Database Schema

## 1. Overview

...

## 20. Development Notes

...

Then save and push

git add docs/DATABASE_SCHEMA.md
git commit -m "docs: define database schema"
git push origin main

That's it. The Markdown code block itself is not part of your file; only what's inside it is.

no iam confused give me the doc file for this only no explian the file which i have to copy paste


VoiceShield — Database Schema
1. Overview

VoiceShield uses PostgreSQL to store user accounts, analysis results, speaker profiles, suspicious audio segments, and information about the ML models used for analysis.

The database is accessed only through the backend.

Frontend
   ↓
Backend
   ↓
PostgreSQL

The ML service does not directly modify the database. It sends its analysis result to the backend, and the backend stores the required information.
2. Main Tables

The initial database contains five main tables:

users
analyses
segments
speakers
model_versions

The basic relationship is:

users
  │
  ├───────────────┐
  │               │
  ▼               ▼
analyses        speakers
  │
  ▼
segments

analyses
  │
  ▼
model_versions

3. Users

The users table stores the accounts created in VoiceShield.
Table: users
Column	Type	Constraints	Description
id	UUID	PRIMARY KEY	Unique user ID
name	VARCHAR(100)	NOT NULL	User's display name
email	VARCHAR(255)	NOT NULL, UNIQUE	Login email
password_hash	TEXT	NOT NULL	Hashed password
created_at	TIMESTAMP	NOT NULL	Account creation time
updated_at	TIMESTAMP	NOT NULL	Last account update

Passwords must never be stored directly. Only the password hash is stored.

The email address is unique so that two accounts cannot use the same email.
4. Analyses

The analyses table stores every audio analysis requested by a user.
Table: analyses
Column	Type	Constraints	Description
id	UUID	PRIMARY KEY	Unique analysis ID
user_id	UUID	FOREIGN KEY, NOT NULL	User who started the analysis
filename	VARCHAR(255)	NOT NULL	Original audio filename
status	VARCHAR(30)	NOT NULL	Current analysis status
analysis_type	VARCHAR(40)	NOT NULL	Type of analysis
ai_probability	DECIMAL(5,4)	NULL	Probability that audio is AI-generated
authentic_probability	DECIMAL(5,4)	NULL	Probability that audio is authentic
speaker_similarity	DECIMAL(5,4)	NULL	Similarity to selected speaker
risk_score	DECIMAL(5,4)	NULL	Overall application risk score
risk_level	VARCHAR(20)	NULL	LOW, MEDIUM, HIGH or CRITICAL
model_version_id	UUID	FOREIGN KEY, NULL	Model used for analysis
created_at	TIMESTAMP	NOT NULL	Analysis creation time
completed_at	TIMESTAMP	NULL	Time analysis finished
Status values

queued
processing
completed
failed

Analysis types

full
deepfake_only
speaker_verification

The probability values should normally be between 0.0000 and 1.0000.

For example:

0.91 = 91%

5. Segments

The segments table stores specific portions of an audio recording that were analyzed or marked as suspicious.

This allows the frontend to show users where suspicious activity was detected.
Table: segments
Column	Type	Constraints	Description
id	UUID	PRIMARY KEY	Unique segment ID
analysis_id	UUID	FOREIGN KEY, NOT NULL	Related analysis
start_time	DECIMAL(10,3)	NOT NULL	Segment start time in seconds
end_time	DECIMAL(10,3)	NOT NULL	Segment end time in seconds
ai_probability	DECIMAL(5,4)	NOT NULL	AI probability for this segment
risk_level	VARCHAR(20)	NOT NULL	Risk level of the segment
created_at	TIMESTAMP	NOT NULL	Record creation time

Example:

Analysis: 123

Segment 1
Start: 8.000 sec
End:   12.000 sec
AI probability: 0.94
Risk: HIGH

The frontend can use this information to highlight the suspicious part of the audio.
6. Speakers

The speakers table stores speaker profiles created by users.

A speaker profile can be used as a reference when performing speaker verification.
Table: speakers
Column	Type	Constraints	Description
id	UUID	PRIMARY KEY	Unique speaker ID
user_id	UUID	FOREIGN KEY, NOT NULL	Owner of the speaker profile
name	VARCHAR(100)	NOT NULL	Speaker profile name
status	VARCHAR(30)	NOT NULL	Current speaker profile status
embedding_reference	TEXT	NULL	Reference to stored speaker representation
created_at	TIMESTAMP	NOT NULL	Profile creation time
updated_at	TIMESTAMP	NOT NULL	Last profile update
Speaker status

processing
ready
failed

A speaker should only be used for verification when its status is ready.
7. Model Versions

The model_versions table keeps track of the ML model used to produce an analysis.

This is useful because the VoiceShield model will probably improve over time.

For example:

v1.0
v1.1
v2.0

Old analysis results should still show which model produced them.
Table: model_versions
Column	Type	Constraints	Description
id	UUID	PRIMARY KEY	Unique model record
name	VARCHAR(100)	NOT NULL	Model name
version	VARCHAR(30)	NOT NULL	Model version
model_type	VARCHAR(50)	NOT NULL	Type of ML model
created_at	TIMESTAMP	NOT NULL	Model record creation time

Example:

Name: VoiceShield Detector
Version: v1.0
Type: deepfake_detection

8. Relationships
User → Analyses

One user can have many analyses.

users.id
   │
   │ 1 : N
   ▼
analyses.user_id

User → Speakers

One user can create multiple speaker profiles.

users.id
   │
   │ 1 : N
   ▼
speakers.user_id

Analysis → Segments

One analysis can contain multiple segments.

analyses.id
   │
   │ 1 : N
   ▼
segments.analysis_id

Model Version → Analyses

One model version can be used for many analyses.

model_versions.id
   │
   │ 1 : N
   ▼
analyses.model_version_id

9. Foreign Keys

The database should maintain the following foreign keys:

analyses.user_id
        → users.id

analyses.model_version_id
        → model_versions.id

segments.analysis_id
        → analyses.id

speakers.user_id
        → users.id

Foreign keys prevent records from referring to users, analyses, or models that do not exist.
10. Delete Behavior
Deleting an analysis

When an analysis is deleted, its related segments can also be deleted.

Analysis
   ↓
Segments

Deleting a user

User deletion should be handled carefully by the backend because it may involve:

User
 ├── Analyses
 └── Speakers

The backend should ensure that associated data is handled according to the project's privacy and retention policy.
11. Indexes

Indexes should be added to fields that are frequently searched.

Initial indexes:

users.email
analyses.user_id
analyses.created_at
analyses.status
analyses.risk_level
segments.analysis_id
speakers.user_id
analyses.model_version_id

Additional indexes can be added later if actual query performance shows a need.
12. UUIDs

VoiceShield will use UUIDs for primary keys instead of simple sequential integers.

Example:

550e8400-e29b-41d4-a716-446655440000

This makes IDs harder to guess and works well when different services generate records independently.
13. Timestamps

Tables should use timestamps for important records.

At minimum:

created_at

Tables that can be updated should also have:

updated_at

Application timestamps should be handled consistently, preferably using UTC.
14. Audio Storage

The database should not store the actual audio binary data.

Instead, the application stores audio separately and keeps only the required metadata or reference.

Audio file
    ↓
File/Object Storage

Database
    ↓
Analysis metadata

The first version can use the project's storage/ directory. This can later be replaced with object storage if required.
15. Speaker Embeddings

Speaker embeddings can become relatively large ML data structures.

For the first version, the database should store a reference rather than unnecessarily putting the entire embedding into a normal text field.

embedding_reference
        ↓
Stored embedding / representation

The exact embedding storage approach can be changed later without changing the rest of the database design.
16. Example Data

A simplified example of an analysis record:

id:
7b9c...

user_id:
1d42...

filename:
meeting_recording.wav

status:
completed

analysis_type:
full

ai_probability:
0.9100

authentic_probability:
0.0900

speaker_similarity:
0.8700

risk_score:
0.8900

risk_level:
HIGH

model_version:
v1.0

17. Database Security

The database must not be exposed directly to the frontend.

The correct flow is:

Frontend
   ↓
Backend API
   ↓
PostgreSQL

Database credentials must be stored in environment variables.

Example:

DATABASE_URL=postgresql://...

The actual .env file must not be committed to GitHub.

Use .env.example for documenting required variables.
18. Ownership and Access

A user should only be able to access their own data.

For example:

User A
  ↓
Only User A's analyses
Only User A's speakers

The backend is responsible for checking ownership before returning, updating, or deleting records.

The database schema supports this through the user_id relationships.
19. Initial Schema Summary

┌───────────────────┐
│       users       │
├───────────────────┤
│ id PK             │
│ name              │
│ email             │
│ password_hash     │
│ created_at        │
│ updated_at        │
└────────┬──────────┘
         │
         ├───────────────────┐
         │                   │
         ▼                   ▼
┌───────────────────┐ ┌───────────────────┐
│     analyses      │ │     speakers      │
├───────────────────┤ ├───────────────────┤
│ id PK             │ │ id PK             │
│ user_id FK        │ │ user_id FK        │
│ filename          │ │ name              │
│ status            │ │ status            │
│ analysis_type     │ │ embedding_ref     │
│ ai_probability    │ │ created_at        │
│ authentic_prob.   │ │ updated_at        │
│ speaker_similarity│ └───────────────────┘
│ risk_score        │
│ risk_level        │
│ model_version FK  │
│ created_at        │
│ completed_at      │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│     segments      │
├───────────────────┤
│ id PK             │
│ analysis_id FK    │
│ start_time        │
│ end_time          │
│ ai_probability    │
│ risk_level        │
│ created_at        │
└───────────────────┘

┌──────────────────────┐
│   model_versions     │
├──────────────────────┤
│ id PK                │
│ name                 │
│ version              │
│ model_type           │
│ created_at            │
└──────────────────────┘
          │
          └──────→ analyses

20. Development Notes

This is the initial database design for VoiceShield.

The database member should implement the schema using the SQL files inside:

database/schema/

The backend member should create matching SQLAlchemy models.

If a change is required later, the database schema, backend models, and relevant API documentation should be updated together.

The goal is to keep the database simple enough for the first working version while leaving room for future features such as more detailed model tracking, additional analysis types, and improved speaker management