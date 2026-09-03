# VoiceShield — ML Specification

## 1. Purpose

This document defines the Machine Learning requirements and interface for VoiceShield.

The ML system is responsible for analyzing voice/audio and providing structured information to the FastAPI backend.

The ML system must support the following major capabilities:

* Audio preprocessing
* Feature/representation extraction
* AI-generated/deepfake voice detection
* Segment-level analysis
* Speaker verification
* Model evaluation
* Robustness testing
* Inference
* Explainability/feature analysis

The ML component is independent from the frontend and database.

The backend is responsible for communicating with the ML system.

---

# 2. ML Architecture

The ML pipeline follows this general structure:

```text
                         AUDIO
                           │
                           ▼
                  Audio Preprocessing
                           │
                           ▼
              Feature / Representation
                    Extraction
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
        Deepfake Detection    Speaker Verification
                 │                   │
                 ▼                   ▼
          AI Probability       Similarity Score
                 │                   │
                 └─────────┬─────────┘
                           ▼
                       ML Result
                           │
                           ▼
                        Backend
```

The ML system must keep **deepfake detection** and **speaker verification** as separate ML tasks.

```text
Deepfake Detection
        ≠
Speaker Verification
```

A voice may be:

```text
Real + correct speaker
Real + wrong speaker
AI-generated + mimics speaker
AI-generated + does not mimic speaker
```

These two tasks should therefore not be treated as the same prediction.

---

# 3. ML Responsibilities

The ML component owns:

```text
ml/
```

The ML member is responsible for:

* Dataset preparation
* Audio preprocessing
* Feature extraction
* Representation generation
* Deepfake detection
* Segment analysis
* Speaker verification
* Model training
* Model evaluation
* Robustness testing
* Inference
* Explainability

The ML component does **not** own:

* Frontend UI
* FastAPI business logic
* User authentication
* PostgreSQL operations
* Supabase Storage management
* Application-level authorization
* Final API routing

Those responsibilities belong to other components.

---

# 4. Input

The ML system receives audio for analysis.

The audio may originate from:

```text
Audio Upload
Audio Recording
Live Audio Stream
```

The backend is responsible for receiving and validating application-level audio input before sending it to ML.

The ML system is responsible for verifying that the received audio can actually be processed.

The ML pipeline should handle the expected audio formats supported by the application.

The exact final supported-format list is an implementation decision and must be kept consistent with the backend upload contract.

---

# 5. Audio Processing Pipeline

The general ML processing pipeline is:

```text
Audio
  ↓
Audio Loading
  ↓
Validation
  ↓
Preprocessing
  ↓
Feature / Representation Extraction
  ↓
Deepfake Detection
  ↓
Segment Analysis
  ↓
Speaker Verification (if requested)
  ↓
Result Generation
```

---

# 6. Stage 1 — Audio Loading

The first ML stage loads the supplied audio.

Responsibilities:

* Open the audio input
* Confirm that the audio can be decoded
* Extract basic audio information
* Prepare the audio for preprocessing

If the audio cannot be loaded, ML must return an appropriate failure result to the backend.

The implementation belongs in:

```text
ml/preprocessing/audio_loader.py
```

---

# 7. Stage 2 — Preprocessing

Preprocessing prepares audio for the ML models.

Potential preprocessing operations include:

* Resampling
* Normalization
* Voice activity detection
* Noise handling
* Segmentation

The exact preprocessing pipeline should be determined by model requirements and evaluation.

Do not add preprocessing operations simply because they are common in other projects.

Each preprocessing operation must have a reason and should be testable.

Existing preprocessing responsibilities are organized under:

```text
ml/preprocessing/
```

with the current planned components:

```text
audio_loader.py
normalizer.py
resampler.py
segmenter.py
vad.py
```

---

# 8. Stage 3 — Feature / Representation Extraction

After preprocessing, the audio is converted into representations required by the selected ML model.

Possible representations include:

```text
MFCC
Mel Spectrogram
Speaker Embeddings
Other model-specific representations
```

The final representation must be selected based on model evaluation rather than assumption.

Current feature-related files are:

```text
ml/features/
├── embeddings.py
├── mel_spectrogram.py
└── mfcc.py
```

The feature extraction layer should remain modular so that the underlying ML model can be changed without rewriting the complete application pipeline.

---

# 9. Deepfake / AI Voice Detection

The primary ML task is to estimate whether the supplied audio contains characteristics associated with synthetic or manipulated speech.

The detector should produce a probability-like result representing the likelihood of AI-generated/manipulated speech.

Conceptually:

```text
Audio
  ↓
Preprocessing
  ↓
Representation
  ↓
Detection Model
  ↓
AI Probability
```

Example:

```text
AI probability: 0.92
Authentic probability: 0.08
```

The values above are examples only.

They are **not actual model performance claims**.

The final model and performance must be determined through training and evaluation.

---

# 10. Authentic Probability

Where the model supports complementary probabilities, the result may contain:

```text
ai_probability
authentic_probability
```

The values should represent the model's output consistently.

Example:

```json
{
  "ai_probability": 0.92,
  "authentic_probability": 0.08
}
```

The actual values must come from inference.

The backend must not fabricate these values.

---

# 11. Segment-Level Analysis

VoiceShield should be able to identify suspicious portions of an audio recording.

The general flow is:

```text
Complete Audio
      ↓
Segmentation
      ↓
Segment Analysis
      ↓
Per-Segment Prediction
      ↓
Suspicious Segments
```

Each segment may contain:

```text
start
end
ai_probability
risk_level
```

Example:

```json
{
  "start": 8.0,
  "end": 12.0,
  "ai_probability": 0.94
}
```

The values are examples only.

Segment-level analysis allows the frontend to identify where suspicious speech occurs.

---

# 12. Segment Representation

A segment should identify a time range within the source audio.

Conceptually:

```text
Audio
──────────────────────────────────────────────
0s        8s          12s                30s
          └────────────┘
           suspicious
             segment
```

The ML system should return time values that correspond to the original audio timeline.

Segment boundaries must be valid:

```text
start < end
```

The segment timestamps should use seconds.

---

# 13. Speaker Verification

Speaker verification is a separate ML task.

Its purpose is to compare a voice in analyzed audio with a registered/reference speaker.

General flow:

```text
Reference Voice
      ↓
Speaker Representation
      ↓
        Compare
           ↑
Analyzed Voice
      ↓
Speaker Representation
      ↓
Similarity Score
```

The output may contain:

```text
speaker_similarity
```

Example:

```text
speaker_similarity = 0.87
```

This is an example only.

The actual similarity value must come from the verification system.

---

# 14. Reference Speaker Processing

A speaker profile may have reference recordings.

The reference recordings are used to create the representation required for speaker verification.

Conceptually:

```text
Reference Audio 1 ──┐
Reference Audio 2 ──┼──→ Speaker Representation
Reference Audio 3 ──┘
```

The system should support multiple reference recordings for a speaker.

Reference audio is stored through the application's audio-storage system.

The ML component should receive the required reference information through the backend/ML interface.

ML must not directly manage Supabase Storage.

---

# 15. Speaker Verification Conditions

Speaker verification should only be performed when a valid speaker reference is available and the operation has been requested.

If no reference speaker is available:

```text
speaker_similarity = null
```

or the field should be omitted according to the agreed API contract.

Deepfake detection must remain independently usable.

Therefore:

```text
Deepfake Detection
        ↓
Can operate without speaker verification
```

---

# 16. Model Selection

The exact ML model is **not frozen yet**.

The project requires the model to be selected through evaluation.

The ML member should evaluate suitable models based on:

* Detection performance
* Generalization
* Robustness
* Inference requirements
* Computational requirements
* Compatibility with the available environment
* Suitability for VoiceShield's target use case

Do not hard-code a specific model into the architecture document before evaluation.

The backend must depend on the ML interface rather than on a specific model implementation.

---

# 17. Model Replaceability

The ML architecture must allow the model to be replaced.

Example:

```text
Model v1
   ↓
ML Interface
   ↓
Backend
```

Later:

```text
Model v2
   ↓
Same ML Interface
   ↓
Backend
```

The frontend should not need to know which internal ML model is being used.

The database stores the model version associated with an analysis.

---

# 18. Model Versioning

Every production analysis should be traceable to the model version that produced it.

The ML result should therefore provide:

```text
model_version
```

Example:

```json
{
  "model_version": "v1.0"
}
```

The value is an example.

The actual version should correspond to the deployed model.

The backend stores the model version information in the database.

---

# 19. ML Result Contract

The ML system must return a stable structured result to the backend.

The initial result contract is:

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

These values are **examples only**.

The actual model determines the final values.

The backend must not depend on the internal structure of the ML model.

It depends on this external result interface.

---

# 20. ML Result Fields

## `ai_probability`

Type:

```text
float
```

Expected conceptual range:

```text
0.0 → 1.0
```

Represents the model's estimated probability associated with AI-generated/manipulated speech.

---

## `authentic_probability`

Type:

```text
float
```

Expected conceptual range:

```text
0.0 → 1.0
```

Represents the model's estimated probability associated with authentic speech when supported.

---

## `speaker_similarity`

Type:

```text
float | null
```

Expected conceptual range:

```text
0.0 → 1.0
```

Represents similarity between the analyzed voice and the available reference speaker.

This value may be unavailable when speaker verification was not requested or no reference speaker exists.

---

## `segments`

Type:

```text
array
```

Each segment contains:

```text
start
end
ai_probability
```

Additional segment information may be added only when coordinated with the API contract.

---

## `confidence`

Type:

```text
float
```

Expected conceptual range:

```text
0.0 → 1.0
```

Represents confidence information supplied by the ML system.

The exact meaning must remain consistent with the selected model.

---

## `model_version`

Type:

```text
string
```

Identifies the model version that produced the result.

---

# 21. ML Failure Response

If the ML system cannot process the input, it must return a structured failure response.

Conceptually:

```json
{
  "success": false,
  "error": {
    "code": "ML_ANALYSIS_FAILED",
    "message": "Audio could not be analyzed."
  }
}
```

The backend is responsible for converting ML failures into the application's API response format where necessary.

The ML system must not expose internal stack traces to the user.

---

# 22. Confidence

Confidence must be treated separately from the application's final risk level.

Conceptually:

```text
ML Prediction
      ↓
Model Confidence
      ↓
Backend Risk Engine
      ↓
Application Risk
```

Do not assume:

```text
confidence = risk
```

They represent different concepts.

---

# 23. Risk Engine Boundary

The final application-level risk calculation belongs to the backend.

The ML system provides evidence such as:

```text
AI probability
Speaker similarity
Suspicious segments
Confidence
```

The backend may combine these inputs:

```text
AI Probability
      +
Speaker Similarity
      +
Segment Evidence
      +
Confidence
      ↓
Backend Risk Engine
      ↓
Overall Risk
```

Possible application risk levels are:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

The exact risk-scoring formula and thresholds are **not defined in this ML specification**.

They must be finalized after ML evaluation and coordinated with the backend.

---

# 24. Explainability

VoiceShield should provide information that helps explain why audio was considered suspicious.

The ML component may produce feature-level or analysis-level information.

Possible information includes:

```text
Feature analysis
Spectral indicators
Segment-level anomalies
Other model-supported indicators
```

The exact explanation method depends on the selected model.

The ML system must not claim a specific explanation technique unless it has actually been implemented and validated.

Current explainability components are:

```text
ml/explainability/
├── feature_analysis.py
└── visualization.py
```

---

# 25. Explainability Principle

Explainability should describe evidence supported by the model.

It should not invent human-readable reasons that are unrelated to model behavior.

For example, the system should not claim:

```text
"The speaker is definitely using a voice clone."
```

when the model only provides a probability.

Prefer information such as:

```text
Synthetic speech indicators detected
```

when such an indicator is actually supported by the analysis.

---

# 26. Dataset Preparation

The ML member is responsible for preparing the datasets used for training and evaluation.

The project structure provides:

```text
ml/data/
├── metadata/
├── processed/
├── raw/
└── splits/
```

The dataset pipeline should distinguish appropriate classes such as:

```text
Genuine / Real
Synthetic / AI-generated
```

where supported by the selected dataset.

The exact datasets are not frozen in this document.

The ML member must document dataset sources and usage conditions separately when selected.

---

# 27. Dataset Separation

Training and evaluation data must be separated appropriately.

The project contains:

```text
ml/data/splits/
```

for dataset split management.

The ML member must avoid evaluation leakage.

The same audio or effectively duplicated material must not unintentionally appear across training and evaluation sets.

---

# 28. Model Training

Training code belongs under:

```text
ml/training/
```

Current planned files:

```text
train.py
validate.py
config.yaml
```

Training should be reproducible through configuration.

The exact training procedure depends on the selected model.

Training code must not be required by the production inference path unless specifically necessary.

---

# 29. Model Storage

The project provides:

```text
ml/models/
├── checkpoints/
├── pretrained/
└── production/
```

Conceptually:

```text
checkpoints/
    ↓
Training checkpoints

pretrained/
    ↓
External/pretrained models

production/
    ↓
Model selected for production inference
```

Production inference should use the explicitly selected production model.

---

# 30. Inference

Inference belongs under:

```text
ml/detection/
```

and the complete pipeline is coordinated through:

```text
ml/pipeline/analyze.py
```

The inference path should be separate from training.

General production flow:

```text
Input Audio
     ↓
Preprocessing
     ↓
Representation
     ↓
Production Model
     ↓
Prediction
     ↓
Structured ML Result
```

---

# 31. ML Pipeline Orchestration

The complete analysis pipeline should follow:

```text
Receive Audio
     ↓
Load Audio
     ↓
Validate Audio
     ↓
Preprocess
     ↓
Extract Representation
     ↓
Deepfake Detection
     ↓
Segment Analysis
     ↓
Speaker Verification (if requested)
     ↓
Confidence / Supporting Information
     ↓
Create Structured Result
     ↓
Return Result
```

The pipeline should be implemented in a modular way.

---

# 32. Robustness Testing

The ML system must be evaluated for robustness.

The project provides:

```text
ml/evaluation/robustness.py
```

Robustness testing should examine whether performance changes under relevant audio variations.

Potential conditions may include:

* Noise
* Recording-quality changes
* Compression
* Other realistic transformations

The exact robustness test set must be determined during ML evaluation.

Do not claim robustness until it has been measured.

---

# 33. Evaluation

Model evaluation belongs under:

```text
ml/evaluation/
```

Current planned files:

```text
evaluate.py
metrics.py
robustness.py
```

The evaluation process should measure how well the selected model performs on data that was not used for training.

---

# 34. Evaluation Metrics

The ML member should report appropriate classification metrics.

Potential metrics include:

```text
Accuracy
Precision
Recall
F1-score
ROC-AUC
Confusion Matrix
```

The final set of metrics should depend on the model/task and dataset.

For a security-oriented detection system, evaluation should not rely on accuracy alone.

The selected metrics and results must be documented after actual evaluation.

---

# 35. Speaker Verification Evaluation

Speaker verification should be evaluated separately from deepfake detection.

The evaluation should measure whether the system can distinguish:

```text
Correct speaker
        vs
Incorrect speaker
```

The speaker-verification evaluation must not be confused with the deepfake classifier's accuracy.

---

# 36. Detection vs Verification

The system must preserve this distinction:

```text
Question 1:
"Is this audio likely AI-generated?"

        ↓
Deepfake Detection


Question 2:
"Does this voice match the reference speaker?"

        ↓
Speaker Verification
```

A high deepfake probability does not itself prove that the speaker is incorrect.

Likewise, a high speaker similarity does not prove that the audio is authentic.

---

# 37. Live Analysis

VoiceShield plans to support live analysis.

The intended architecture is:

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

The goal is to process smaller chunks instead of waiting for the complete recording.

---

# 38. Live ML Requirements

For live analysis, the ML system should support processing of smaller audio chunks when the selected model and implementation allow it.

The result should remain compatible with the application's ML result contract.

The live-analysis implementation must not silently introduce a completely different result schema.

If partial results require additional fields, those fields must be coordinated through the API/ML contract.

---

# 39. ML Service Communication

The initial communication direction is:

```text
Backend
   │
   │ audio + analysis parameters
   ▼
ML Service
   │
   │ structured result
   ▼
Backend
```

The project material identifies **HTTP REST** as the initial ML communication mechanism.

Conceptually:

```text
POST /predict
```

The exact service endpoint and deployment details must remain consistent with the backend implementation and deployment configuration.

---

# 40. Backend ↔ ML Boundary

The backend must treat ML as an external analysis component.

The backend should provide:

```text
Audio
Analysis parameters
Reference-speaker information when required
```

The ML service returns:

```text
Prediction
Segments
Speaker similarity when applicable
Confidence
Model version
```

The backend then:

```text
Stores the result
Calculates application risk
Returns the API response
```

---

# 41. ML Does Not Access the Database

The ML system must not directly modify:

```text
Supabase PostgreSQL
Supabase Storage
```

The intended flow is:

```text
Backend
   ↓
ML
   ↓
Result
   ↓
Backend
   ↓
Supabase PostgreSQL
```

This preserves the application's architecture and security boundaries.

---

# 42. ML Does Not Own User Data

The ML component does not own:

* User accounts
* Authentication
* Authorization
* User analysis history
* Database records
* Storage permissions

Those responsibilities belong to the backend/database layers.

---

# 43. Temporary Audio Processing

ML may require temporary local audio files during processing.

The temporary processing flow can be:

```text
Audio
  ↓
Temporary Processing
  ↓
ML
  ↓
Result
  ↓
Temporary Cleanup
```

Temporary audio files should be cleaned up when no longer required.

Long-term audio retention is controlled by the application/storage/privacy design, not by the ML model.

---

# 44. ML Directory Structure

The current ML structure is:

```text
ml/
├── configs/
│   └── model_config.yaml
│
├── data/
│   ├── metadata/
│   ├── processed/
│   ├── raw/
│   └── splits/
│
├── detection/
│   ├── inference.py
│   ├── model.py
│   └── postprocessing.py
│
├── evaluation/
│   ├── evaluate.py
│   ├── metrics.py
│   └── robustness.py
│
├── explainability/
│   ├── feature_analysis.py
│   └── visualization.py
│
├── features/
│   ├── embeddings.py
│   ├── mel_spectrogram.py
│   └── mfcc.py
│
├── models/
│   ├── checkpoints/
│   ├── pretrained/
│   └── production/
│
├── pipeline/
│   └── analyze.py
│
├── preprocessing/
│   ├── audio_loader.py
│   ├── normalizer.py
│   ├── resampler.py
│   ├── segmenter.py
│   └── vad.py
│
├── speaker_verification/
│   ├── embedding.py
│   ├── similarity.py
│   └── verification.py
│
├── tests/
│   ├── test_detection.py
│   ├── test_pipeline.py
│   ├── test_preprocessing.py
│   └── test_speaker.py
│
└── training/
    ├── config.yaml
    ├── train.py
    └── validate.py
```

This structure is the baseline.

Do not create a completely different ML directory structure unless there is a documented reason and the change is coordinated.

---

# 45. Module Responsibilities

## `preprocessing/`

Responsible for:

```text
Audio loading
Resampling
Normalization
Voice activity detection
Segmentation
```

---

## `features/`

Responsible for:

```text
Feature extraction
Audio representations
Speaker embeddings
```

---

## `detection/`

Responsible for:

```text
Deepfake model
Inference
Prediction postprocessing
```

---

## `speaker_verification/`

Responsible for:

```text
Speaker embedding
Similarity calculation
Speaker verification
```

---

## `pipeline/`

Responsible for:

```text
End-to-end ML analysis orchestration
```

---

## `evaluation/`

Responsible for:

```text
Model evaluation
Metrics
Robustness testing
```

---

## `explainability/`

Responsible for:

```text
Feature analysis
Explanation support
Visualization support
```

---

## `training/`

Responsible for:

```text
Training
Validation
Training configuration
```

---

## `models/`

Responsible for:

```text
Model checkpoints
Pretrained models
Production models
```

---

# 46. ML Tests

The ML component must contain tests for major processing stages.

Current planned tests:

```text
ml/tests/test_detection.py
ml/tests/test_pipeline.py
ml/tests/test_preprocessing.py
ml/tests/test_speaker.py
```

Tests should cover:

* Audio loading
* Preprocessing
* Feature generation
* Detection inference
* Speaker verification
* End-to-end ML pipeline
* Invalid inputs
* Result structure

---

# 47. Determinism and Reproducibility

Training and evaluation should be reproducible where practical.

The ML member should record relevant:

* Model version
* Configuration
* Dataset information
* Evaluation results
* Processing assumptions

The production inference result should identify the deployed model version.

---

# 48. Model Configuration

Model configuration should be kept separate from application source code where practical.

The current configuration location is:

```text
ml/configs/model_config.yaml
```

Training configuration is:

```text
ml/training/config.yaml
```

Configuration should control model-specific parameters rather than requiring source-code modification for every experiment.

---

# 49. No Fabricated Performance

The ML system must never report invented performance values.

Do not claim:

```text
95% accuracy
99% accuracy
92% detection rate
```

unless the value has actually been measured using the documented evaluation procedure.

Example outputs in documentation are placeholders.

Actual model performance must come from evaluation.

---

# 50. No Fabricated Detection

The application must not present example probabilities as actual predictions.

For example:

```text
AI-generated: 92%
```

is only valid when it is the actual output of the deployed model.

Example numbers in this document are illustrative only.

---

# 51. Limitations

The ML system may have limitations caused by:

* Dataset quality
* Dataset diversity
* Recording conditions
* Noise
* Compression
* Unseen voice-cloning methods
* Language/accent variation
* Model generalization
* Computational constraints

The system should not claim that it can detect every possible synthetic voice.

Evaluation results should determine the supported claims.

---

# 52. Security Considerations

The ML system should treat received audio as untrusted input.

It should:

* Validate input
* Avoid unsafe file handling
* Avoid executing content from uploaded files
* Limit processing resources where appropriate
* Return controlled errors
* Avoid exposing internal stack traces
* Avoid logging sensitive audio unnecessarily

Secrets must not be hard-coded into ML source code.

---

# 53. Privacy Considerations

Voice recordings may contain sensitive information.

The ML system should minimize unnecessary retention.

Temporary files should be removed when processing is complete unless retention is explicitly required by the application.

Logs should avoid unnecessary sensitive information.

The ML component must follow the project's overall privacy policy.

---

# 54. ML-to-Backend Contract Rules

The following rules are mandatory:

### Rule 1

Do not rename:

```text
ai_probability
```

without coordinating with the backend.

### Rule 2

Do not rename:

```text
authentic_probability
```

without coordinating with the backend.

### Rule 3

Do not change:

```text
speaker_similarity
```

into another field without updating the shared contract.

### Rule 4

Do not change segment field names without coordinating with the backend/frontend.

### Rule 5

Do not remove `model_version` without coordination.

### Rule 6

Do not introduce a new response format independently.

### Rule 7

Do not make the backend depend on internal model implementation details.

### Rule 8

Do not directly write ML results into PostgreSQL.

---

# 55. Definition of Done — ML MVP

The ML MVP is complete when:

```text
[ ] Audio can be loaded
[ ] Audio preprocessing works
[ ] Required representation/features can be generated
[ ] A selected detection model can perform inference
[ ] AI probability is returned
[ ] Authentic probability is returned when supported
[ ] Confidence is returned when supported
[ ] Model version is returned
[ ] Result follows the agreed ML result contract
[ ] Invalid audio is handled safely
[ ] Detection tests pass
[ ] Pipeline tests pass
[ ] Evaluation has been performed
[ ] Actual model performance is documented
```

Speaker verification and advanced segment/explainability capabilities may be completed according to the project's feature priorities.

---

# 56. Definition of Done — Speaker Verification

Speaker verification is complete when:

```text
[ ] Reference audio can be processed
[ ] Speaker representation can be generated
[ ] Input voice representation can be generated
[ ] Similarity can be calculated
[ ] Verification result is returned
[ ] Multiple reference recordings are supported where required
[ ] Speaker tests pass
[ ] Evaluation has been performed
[ ] Limitations are documented
```

---

# 57. Definition of Done — Segment Analysis

Segment analysis is complete when:

```text
[ ] Audio can be segmented
[ ] Each segment has valid timestamps
[ ] Segment-level prediction can be generated
[ ] Suspicious segments can be identified
[ ] Segment results follow the agreed structure
[ ] Pipeline tests pass
```

---

# 58. Definition of Done — Explainability

Explainability is complete when:

```text
[ ] Explanation information is generated from actual analysis
[ ] Explanation does not fabricate model reasoning
[ ] Explanation is compatible with the selected model
[ ] Explanation data can be returned through the backend
[ ] Visualization support can consume the result
```

---

# 59. Final ML Architecture

The final intended architecture is:

```text
                         AUDIO
                           │
                           ▼
                  ┌─────────────────┐
                  │  PREPROCESSING  │
                  │                 │
                  │ Load            │
                  │ Resample        │
                  │ Normalize       │
                  │ VAD             │
                  │ Segment         │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ REPRESENTATION  │
                  │   / FEATURES    │
                  └────────┬────────┘
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
          ┌───────────────┐  ┌─────────────────┐
          │   DEEPFAKE    │  │    SPEAKER      │
          │   DETECTION   │  │   VERIFICATION  │
          └───────┬───────┘  └────────┬────────┘
                  │                   │
                  ▼                   ▼
          AI Probability       Similarity Score
                  │                   │
                  └─────────┬─────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ SEGMENT ANALYSIS│
                   │ + EXPLANATION   │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   ML RESULT     │
                   │                 │
                   │ Probability     │
                   │ Similarity      │
                   │ Segments        │
                   │ Confidence      │
                   │ Model Version   │
                   └────────┬────────┘
                            │
                            ▼
                         BACKEND
```

---

# 60. Complete VoiceShield ML Flow

The complete system-level flow is:

```text
User
  ↓
Frontend
  ↓
FastAPI Backend
  ↓
Audio Validation
  ↓
ML Service
  ↓
Audio Loading
  ↓
Preprocessing
  ↓
Feature / Representation Extraction
  ↓
Deepfake Detection
  ↓
Segment Analysis
  ↓
Speaker Verification (if requested)
  ↓
ML Result
  ↓
FastAPI Backend
  ↓
Risk Calculation
  ↓
Supabase PostgreSQL
  ↓
Frontend
  ↓
Result
```

---

# 61. Final Contract

The most important ML contract is:

```text
Backend
   │
   │ Audio + Parameters
   ▼
ML
   │
   │ Structured Prediction
   ▼
Backend
```

The ML system must return information that the backend can reliably consume.

The backend must not need to know:

* Which neural-network architecture is being used
* Which feature extractor is being used internally
* How training was performed
* How model layers are structured

The backend only depends on the agreed ML interface.

---

# 62. Source of Truth

This document is the ML implementation baseline.

The following documents must remain consistent with it:

```text
docs/ARCHITECTURE.md
docs/API_CONTRACT.md
docs/DATABASE_SCHEMA.md
docs/TECH_STACK.md
docs/SECURITY.md
docs/PRIVACY.md
```

If an ML change affects the backend API, database fields, frontend behavior, or deployment architecture, the affected contract must also be updated.

No AI coding session should independently redesign the ML/backend interface.

---

# 63. Important Implementation Rule

Before implementing a specific ML model, the ML member must first determine:

```text
Dataset
   ↓
Preprocessing
   ↓
Candidate Models
   ↓
Training / Fine-tuning
   ↓
Evaluation
   ↓
Model Selection
   ↓
Production Model
```

The selected model must be based on measured evaluation rather than assumed performance.

Until that evaluation is complete, the architecture should remain model-agnostic.

---

# 64. Final ML Objective

The ML component's objective is to provide reliable, measurable, and structured voice-analysis results to VoiceShield.

The ML system should answer:

```text
1. How likely is this audio to be AI-generated/manipulated?

2. Which portions of the audio appear suspicious?

3. If a reference speaker exists, how similar is the analyzed voice?

4. How confident is the model?

5. Which model version produced the result?
```

The ML system provides the evidence.

The backend handles application-level orchestration, storage, authorization, and final risk presentation.
