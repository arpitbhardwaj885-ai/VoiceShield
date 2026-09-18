-- 0005_speaker_reference_audio.sql

create table speaker_reference_audio (
    id uuid primary key default gen_random_uuid(),
    speaker_id uuid not null references speakers (id) on delete cascade,
    audio_id uuid not null references audio_files (id) on delete cascade,
    status varchar(30) not null,
    duration numeric null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_speaker_reference_audio_speaker_id on speaker_reference_audio (speaker_id);
create index idx_speaker_reference_audio_audio_id on speaker_reference_audio (audio_id);

create trigger trg_speaker_reference_audio_updated_at
before update on speaker_reference_audio
for each row execute function set_updated_at();