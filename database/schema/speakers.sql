-- 0004_speakers.sql

create table speakers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users (id) on delete cascade,
    name varchar(100) not null,
    status varchar(30) not null check (status in ('processing', 'ready', 'failed')),
    embedding_reference text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_speakers_user_id on speakers (user_id);

create trigger trg_speakers_updated_at
before update on speakers
for each row execute function set_updated_at();