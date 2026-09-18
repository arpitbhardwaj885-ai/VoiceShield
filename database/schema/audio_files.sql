-- 0003_audio_files.sql

create table audio_files (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users (id) on delete cascade,
    filename varchar(255) not null,
    storage_path text not null,
    mime_type varchar(100) not null,
    file_size bigint not null,
    duration numeric null,
    status varchar(30) not null,
    created_at timestamptz not null default now()
);

create index idx_audio_files_user_id on audio_files (user_id);
create index idx_audio_files_created_at on audio_files (created_at);