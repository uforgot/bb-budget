alter table recurring_transactions
  add column if not exists frequency text not null default 'monthly',
  add column if not exists anchor_date date,
  add column if not exists end_date date;

update recurring_transactions
set frequency = coalesce(frequency, 'monthly')
where true;

update recurring_transactions
set anchor_date = case
  when anchor_date is not null then anchor_date
  when frequency = 'weekly' then (
    coalesce(start_date, created_at::date)
    + (((coalesce(day_of_week, extract(dow from coalesce(start_date, created_at::date))::int) - extract(dow from coalesce(start_date, created_at::date))::int + 7) % 7) * interval '1 day')
  )::date
  when frequency = 'yearly' then make_date(
    extract(year from coalesce(start_date, created_at::date))::int,
    greatest(1, least(coalesce(month_of_year, extract(month from coalesce(start_date, created_at::date))::int), 12)),
    greatest(
      1,
      least(
        coalesce(day_of_month, extract(day from coalesce(start_date, created_at::date))::int),
        extract(day from (
          date_trunc('month', make_date(
            extract(year from coalesce(start_date, created_at::date))::int,
            greatest(1, least(coalesce(month_of_year, extract(month from coalesce(start_date, created_at::date))::int), 12)),
            1
          ) + interval '1 month - 1 day'
        ))::date)::int
      )
    )
  )
  else make_date(
    extract(year from coalesce(start_date, created_at::date))::int,
    extract(month from coalesce(start_date, created_at::date))::int,
    greatest(
      1,
      least(
        coalesce(day_of_month, extract(day from coalesce(start_date, created_at::date))::int),
        extract(day from (
          date_trunc('month', coalesce(start_date, created_at::date)) + interval '1 month - 1 day'
        )::date)::int
      )
    )
  )
end
where anchor_date is null;

alter table recurring_transactions
  alter column anchor_date set not null;

alter table recurring_transactions
  drop constraint if exists recurring_transactions_frequency_check,
  drop constraint if exists recurring_transactions_day_of_week_check,
  drop constraint if exists recurring_transactions_day_of_month_check,
  drop constraint if exists recurring_transactions_month_of_year_check,
  drop constraint if exists recurring_transactions_end_date_check;

alter table recurring_transactions
  add constraint recurring_transactions_frequency_check
    check (frequency in ('weekly', 'monthly', 'yearly')),
  add constraint recurring_transactions_end_date_check
    check (end_date is null or end_date >= anchor_date);

create index if not exists recurring_transactions_active_frequency_idx
  on recurring_transactions (active, frequency);

create index if not exists recurring_transactions_active_anchor_date_idx
  on recurring_transactions (active, anchor_date);

alter table recurring_transactions
  drop column if exists day_of_week,
  drop column if exists day_of_month,
  drop column if exists month_of_year,
  drop column if exists start_date;
