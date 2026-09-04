-- 0010_storage.sql
-- Supabase Storage config for audio files (DATABASE_SCHEMA.md §14, SECURITY.md §31-32).
-- Bucket is private; only the backend (service role) reads/writes objects.
-- Path convention: <user_id>/<audio_id or filename>

insert into storage.buckets (id, name, public)
values ('audio-files', 'audio-files', false)
on conflict (id) do nothing;

-- No policies for anon/authenticated: RLS on storage.objects is on by default
-- and no policy is granted here, so only the service role can access this bucket.