-- Authorship for doctor-created fictional notes.
alter table public.encounters add column if not exists author_id uuid references public.profiles(id);
alter table public.encounters add column if not exists is_synthetic boolean not null default true;
create index if not exists encounters_patient_occurred_idx on public.encounters(patient_id,occurred_at desc);
-- No direct browser access to notes. All reads and writes pass through authenticated API.
