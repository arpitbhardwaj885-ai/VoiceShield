-- 0009_rls_policies.sql
-- Auth is custom JWT enforced in FastAPI (API_CONTRACT.md), not Supabase Auth.
-- Frontend never talks to Postgres directly (DATABASE_SCHEMA.md §24); only the
-- backend, using the service-role key, reads/writes these tables.
-- RLS is enabled on every table as defense-in-depth with no anon/authenticated
-- policies, so only the service role (which bypasses RLS) can access them.

alter table users enable row level security;
alter table audio_files enable row level security;
alter table speakers enable row level security;
alter table speaker_reference_audio enable row level security;
alter table model_versions enable row level security;
alter table analyses enable row level security;
alter table segments enable row level security;