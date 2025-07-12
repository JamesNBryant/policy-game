create extension if not exists "pgcrypto";

create table Teams (
  id uuid primary key default gen_random_uuid(),
  name text,
  createdAt timestamptz default now()
);

create table Rounds (
  id uuid primary key default gen_random_uuid(),
  number int check (number between 1 and 5),
  publicBrief text,
  publicResults text,
  dmNotes text,
  isOpen boolean default true,
  createdAt timestamptz default now()
);

create table Users (
  id uuid primary key references auth.users (id) on delete cascade,
  teamId uuid references Teams(id),
  displayName text
);

create table Moves (
  id uuid primary key default gen_random_uuid(),
  roundId uuid references Rounds(id) on delete cascade,
  userId uuid references Users(id) on delete cascade,
  role text,
  submission text,
  assistantsAllocated int,
  resources int,
  createdAt timestamptz default now(),
  unique (roundId, userId)
);

create table HiddenState (
  id uuid primary key default gen_random_uuid(),
  roundId uuid references Rounds(id) on delete cascade,
  variableName text,
  value jsonb
);

create table EventsDeck (
  id serial primary key,
  title text,
  description text,
  effectCode text
);

-- Row level security
alter table Rounds enable row level security;
alter table Moves enable row level security;
alter table HiddenState enable row level security;

create policy "rounds_participant_view"
  on Rounds
  for select
  using (isOpen OR createdAt < now());

create policy "moves_participant_view"
  on Moves
  for select
  using (auth.uid() = userId);

create policy "moves_participant_insert"
  on Moves
  for insert
  with check (auth.uid() = userId);

create or replace function export_moves_csv()
returns text
language plpgsql
security definer
as $$
declare
  csv text;
begin
  select string_agg(format('%s,%s,%s,%s,%s,%s',
    m.id, m.roundId, m.userId, m.role, m.submission, m.createdAt), E'\n')
  into csv
  from Moves m
  order by m.createdAt;
  return csv;
end $$;

grant execute on function export_moves_csv() to anon, authenticated;