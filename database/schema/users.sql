-- 0002_users.sql

create table users (
    id uuid primary key default gen_random_uuid(),
    name varchar(100) not null,
    email varchar(255) not null unique,
    password_hash text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_users_email on users (email);

create trigger trg_users_updated_at
before update on users
for each row execute function set_updated_at();