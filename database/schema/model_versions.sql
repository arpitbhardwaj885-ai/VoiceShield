-- 0006_model_versions.sql

create table model_versions (
    id uuid primary key default gen_random_uuid(),
    model_name varchar(100) not null,
    version varchar(30) not null,
    model_type varchar(50) not null,
    description text null,
    created_at timestamptz not null default now()
);

create index idx_model_versions_model_name on model_versions (model_name);
create index idx_model_versions_version on model_versions (version);