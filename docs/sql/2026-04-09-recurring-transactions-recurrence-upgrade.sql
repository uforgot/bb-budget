alter table recurring_transactions
  add column if not exists frequency text not null default 'monthly',
  add column if not exists day_of_week integer,
  add column if not exists month_of_year integer,
  add column if not exists start_date date,
  add column if not exists end_date date;

update recurring_transactions
set
  frequency = coalesce(frequency, 'monthly'),
  start_date = coalesce(start_date, created_at::date)
where true;

alter table recurring_transactions
  add constraint recurring_transactions_frequency_check
    check (frequency in ('weekly', 'monthly', 'yearly'));

alter table recurring_transactions
  add constraint recurring_transactions_day_of_week_check
    check (day_of_week is null or day_of_week between 0 and 6);

alter table recurring_transactions
  add constraint recurring_transactions_day_of_month_check
    check (day_of_month is null or day_of_month between 1 and 31);

alter table recurring_transactions
  add constraint recurring_transactions_month_of_year_check
    check (month_of_year is null or month_of_year between 1 and 12);

alter table recurring_transactions
  add constraint recurring_transactions_end_date_check
    check (end_date is null or start_date is null or end_date >= start_date);

create index if not exists recurring_transactions_active_frequency_idx
  on recurring_transactions (active, frequency);
