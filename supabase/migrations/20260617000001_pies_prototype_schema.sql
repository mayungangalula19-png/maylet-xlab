-- Prototype Intelligence & Execution System (PIES) Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Prototypes table
create table prototypes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  current_stage text not null check (current_stage in ('ideation', 'build', 'testing', 'validation', 'funding_ready')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null
);

-- Prototype stage history
create table prototype_stage_history (
  id uuid primary key default uuid_generate_v4(),
  prototype_id uuid references prototypes on delete cascade not null,
  stage text not null check (stage in ('ideation', 'build', 'testing', 'validation', 'funding_ready')),
  entered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  exited_at timestamp with time zone
);

-- AI evaluations table
create table ai_evaluations (
  id uuid primary key default uuid_generate_v4(),
  prototype_id uuid references prototypes on delete cascade not null,
  feasibility integer check (feasibility between 0 and 100),
  market integer check (market between 0 and 100),
  innovation integer check (innovation between 0 and 100),
  test_results integer check (test_results between 0 and 100),
  risk_score integer check (risk_score between 0 and 100),
  final_score integer check (final_score between 0 and 100),
  recommendation text check (recommendation in ('CONTINUE_BUILD', 'PIVOT', 'STOP', 'FUNDING_READY', 'REQUEST_MENTORSHIP')),
  evaluated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  evaluated_by uuid references auth.users
);

-- Test results table
create table test_results (
  id uuid primary key default uuid_generate_v4(),
  prototype_id uuid references prototypes on delete cascade not null,
  test_name text not null,
  test_result text not null,
  tested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  tested_by uuid references auth.users
);

-- Collaboration table (comments, mentorship requests, etc.)
create table collaborations (
  id uuid primary key default uuid_generate_v4(),
  prototype_id uuid references prototypes on delete cascade not null,
  user_id uuid references auth.users not null,
  content text not null,
  type text not null check (type in ('comment', 'mentorship_request', 'feedback', 'update')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Funding integration table
create table funding_integration (
  id uuid primary key default uuid_generate_v4(),
  prototype_id uuid references prototypes on delete cascade not null,
  funding_ready boolean default false,
  funding_amount_requested decimal(15,2),
  funding_amount_approved decimal(15,2),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_prototypes_user_id on prototypes(user_id);
create index idx_prototypes_current_stage on prototypes(current_stage);
create index idx_prototype_stage_history_prototype_id on prototype_stage_history(prototype_id);
create index idx_ai_evaluations_prototype_id on ai_evaluations(prototype_id);
create index idx_test_results_prototype_id on test_results(prototype_id);
create index idx_collaborations_prototype_id on collaborations(prototype_id);
create index idx_funding_integration_prototype_id on funding_integration(prototype_id);

-- Enable Row Level Security
alter table prototypes enable row level security;
alter table prototype_stage_history enable row level security;
alter table ai_evaluations enable row level security;
alter table test_results enable row level security;
alter table collaborations enable row level security;
alter table funding_integration enable row level security;

-- Policies for prototypes
create policy "Users can view their own prototypes"
  on prototypes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own prototypes"
  on prototypes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own prototypes"
  on prototypes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own prototypes"
  on prototypes for delete
  using (auth.uid() = user_id);

-- Policies for prototype_stage_history
create policy "Users can view stage history of their prototypes"
  on prototype_stage_history for select
  using (exists (select 1 from prototypes where prototypes.id = prototype_stage_history.prototype_id and prototypes.user_id = auth.uid()));

create policy "Users can insert stage history for their prototypes"
  on prototype_stage_history for insert
  with check (exists (select 1 from prototypes where prototypes.id = prototype_stage_history.prototype_id and prototypes.user_id = auth.uid()));

-- Policies for ai_evaluations
create policy "Users can view AI evaluations of their prototypes"
  on ai_evaluations for select
  using (exists (select 1 from prototypes where prototypes.id = ai_evaluations.prototype_id and prototypes.user_id = auth.uid()));

create policy "Users can insert AI evaluations for their prototypes"
  on ai_evaluations for insert
  with check (exists (select 1 from prototypes where prototypes.id = ai_evaluations.prototype_id and prototypes.user_id = auth.uid()));

-- Policies for test_results
create policy "Users can view test results of their prototypes"
  on test_results for select
  using (exists (select 1 from prototypes where prototypes.id = test_results.prototype_id and prototypes.user_id = auth.uid()));

create policy "Users can insert test results for their prototypes"
  on test_results for insert
  with check (exists (select 1 from prototypes where prototypes.id = test_results.prototype_id and prototypes.user_id = auth.uid()));

-- Policies for collaborations
create policy "Users can view collaborations on their prototypes"
  on collaborations for select
  using (exists (select 1 from prototypes where prototypes.id = collaborations.prototype_id and prototypes.user_id = auth.uid()));

create policy "Users can insert collaborations on their prototypes"
  on collaborations for insert
  with check (exists (select 1 from prototypes where prototypes.id = collaborations.prototype_id and prototypes.user_id = auth.uid()));

-- Policies for funding_integration
create policy "Users can view funding integration of their prototypes"
  on funding_integration for select
  using (exists (select 1 from prototypes where prototypes.id = funding_integration.prototype_id and prototypes.user_id = auth.uid()));

create policy "Users can update funding integration of their prototypes"
  on funding_integration for update
  using (exists (select 1 from prototypes where prototypes.id = funding_integration.prototype_id and prototypes.user_id = auth.uid()));

-- Trigger to update updated_at column
create trigger update_prototypes_updated_at
  before update on prototypes
  for each row
  execute procedure moddatetime (updated_at);

create trigger update_funding_integration_updated_at
  before update on funding_integration
  for each row
  execute procedure moddatetime (updated_at);

-- Create moddatetime function if it doesn't exist
create or replace function moddatetime()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language 'plpgsql';