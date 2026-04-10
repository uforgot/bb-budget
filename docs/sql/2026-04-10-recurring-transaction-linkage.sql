alter table recurring_transactions
  add column if not exists source_transaction_id uuid references transactions(id) on delete set null;

alter table transactions
  add column if not exists recurring_transaction_id uuid references recurring_transactions(id) on delete set null,
  add column if not exists recurring_occurrence_date date;

update recurring_transactions rt
set source_transaction_id = t.id
from transactions t
where rt.source_transaction_id is null
  and t.type = rt.type
  and t.amount = rt.amount
  and t.category_id = rt.category_id
  and t.date = rt.anchor_date
  and coalesce(t.description, '') = coalesce(rt.description, '');

update transactions t
set recurring_transaction_id = rt.id,
    recurring_occurrence_date = coalesce(t.recurring_occurrence_date, t.date)
from recurring_transactions rt
where t.recurring_transaction_id is null
  and rt.source_transaction_id is distinct from t.id
  and t.type = rt.type
  and t.amount = rt.amount
  and t.category_id = rt.category_id
  and t.date >= rt.anchor_date
  and (rt.end_date is null or t.date <= rt.end_date)
  and (
    (rt.frequency = 'weekly' and extract(dow from t.date) = extract(dow from rt.anchor_date))
    or (rt.frequency = 'monthly' and extract(day from t.date) = extract(day from rt.anchor_date))
    or (
      rt.frequency = 'yearly'
      and extract(month from t.date) = extract(month from rt.anchor_date)
      and extract(day from t.date) = extract(day from rt.anchor_date)
    )
  );

create index if not exists recurring_transactions_source_transaction_id_idx
  on recurring_transactions (source_transaction_id);

create index if not exists transactions_recurring_transaction_id_idx
  on transactions (recurring_transaction_id, recurring_occurrence_date);
