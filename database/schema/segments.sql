-- 0008_segments.sql

create table segments (
    id uuid primary key default gen_random_uuid(),
    analysis_id uuid not null references analyses (id) on delete cascade,
    start_time numeric not null,
    end_time numeric not null,
    ai_probability decimal(5,4) not null check (ai_probability >= 0 and ai_probability <= 1),
    risk_level varchar(20) not null check (risk_level in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    indicators jsonb null,
    created_at timestamptz not null default now(),
    constraint chk_segments_time_order check (end_time > start_time)
);

create index idx_segments_analysis_id on segments (analysis_id);