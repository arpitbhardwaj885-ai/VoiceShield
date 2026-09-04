-- 0007_analyses.sql

create table analyses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users (id) on delete cascade,
    audio_id uuid not null references audio_files (id) on delete cascade,
    speaker_id uuid null references speakers (id) on delete set null,
    model_version_id uuid null references model_versions (id) on delete set null,
    status varchar(30) not null check (status in ('queued', 'processing', 'completed', 'failed')),
    analysis_type varchar(40) not null check (analysis_type in ('full', 'deepfake_only', 'speaker_verification')),
    ai_probability decimal(5,4) null check (ai_probability >= 0 and ai_probability <= 1),
    authentic_probability decimal(5,4) null check (authentic_probability >= 0 and authentic_probability <= 1),
    speaker_similarity decimal(5,4) null check (speaker_similarity >= 0 and speaker_similarity <= 1),
    risk_score decimal(5,4) null check (risk_score >= 0 and risk_score <= 1),
    risk_level varchar(20) null check (risk_level in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    confidence decimal(5,4) null check (confidence >= 0 and confidence <= 1),
    explanation jsonb null,
    created_at timestamptz not null default now(),
    completed_at timestamptz null
);

create index idx_analyses_user_id on analyses (user_id);
create index idx_analyses_audio_id on analyses (audio_id);
create index idx_analyses_speaker_id on analyses (speaker_id);
create index idx_analyses_model_version_id on analyses (model_version_id);
create index idx_analyses_created_at on analyses (created_at);
create index idx_analyses_status on analyses (status);
create index idx_analyses_risk_level on analyses (risk_level);