-- Makes the marking scheme configurable per interview type instead of a
-- fixed set of 4 columns.

alter table interview_types
  add column if not exists marking_criteria jsonb not null
    default '["Communication","Technical Knowledge","Problem Solving","Confidence & Attitude"]'::jsonb;

alter table interviews
  add column if not exists marking_scores jsonb not null default '[]'::jsonb;

alter table interviews
  drop column if exists communication_score,
  drop column if exists technical_score,
  drop column if exists problem_solving_score,
  drop column if exists confidence_score;
