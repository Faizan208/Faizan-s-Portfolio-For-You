-- Run ONCE in Supabase SQL Editor, as the project owner.
-- No plaintext password or audio bytes should ever be put in the SQL editor.
-- The encrypted blob is uploaded separately to the private Storage bucket.

create table if not exists public.private_voice_config (
  id text primary key check (id = 'inside-of-me'),
  verifier_salt text not null,
  verifier_hash text not null,
  encryption_salt text not null,
  encryption_iv text not null,
  kdf_iterations integer not null check (kdf_iterations = 600000),
  storage_path text not null check (storage_path = 'inside-of-me.enc'),
  media_type text not null check (media_type in ('audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm','audio/aac')),
  updated_at timestamptz not null default now()
);

alter table public.private_voice_config enable row level security;
revoke all on public.private_voice_config from PUBLIC, anon, authenticated;
grant select on public.private_voice_config to service_role;

create table if not exists public.voice_note_attempts (
  fingerprint text primary key,
  started_at timestamptz not null default now(),
  attempts integer not null default 0
);
alter table public.voice_note_attempts enable row level security;
revoke all on public.voice_note_attempts from PUBLIC, anon, authenticated;
-- Only the privileged rate-limit function can write these counters.

create or replace function public.voice_note_rate_limit(
  p_fingerprint text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer;
begin
  if p_fingerprint is null or p_fingerprint !~ '^[0-9a-f]{64}$'
     or p_limit < 1 or p_limit > 1000
     or p_window_seconds < 60 or p_window_seconds > 86400 then
    return false;
  end if;

  insert into public.voice_note_attempts (fingerprint, started_at, attempts)
  values (p_fingerprint, now(), 1)
  on conflict (fingerprint) do update
  set attempts = case
      when public.voice_note_attempts.started_at <= now() - (p_window_seconds || ' seconds')::interval then 1
      else public.voice_note_attempts.attempts + 1
    end,
    started_at = case
      when public.voice_note_attempts.started_at <= now() - (p_window_seconds || ' seconds')::interval then now()
      else public.voice_note_attempts.started_at
    end
  returning attempts into v_attempts;

  return v_attempts <= p_limit;
end;
$$;

revoke all on function public.voice_note_rate_limit(text,integer,integer) from PUBLIC, anon, authenticated;
grant execute on function public.voice_note_rate_limit(text,integer,integer) to service_role;

-- Create a PRIVATE bucket. Do not create public read policies on storage.objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inside-of-me-private','inside-of-me-private',false,31457280,array['application/octet-stream']::text[])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Hard requirement: leave the bucket PRIVATE and upload only .enc, not the original audio.
