alter table recurring_transactions
  add column if not exists source_transaction_id uuid null references transactions(id) on delete set null;

alter table transactions
  add column if not exists recurring_transaction_id uuid null references recurring_transactions(id) on delete set null,
  add column if not exists recurring_occurrence_date date null;

create index if not exists idx_recurring_transactions_source_transaction_id
  on recurring_transactions(source_transaction_id);

create index if not exists idx_transactions_recurring_transaction_occurrence
  on transactions(recurring_transaction_id, recurring_occurrence_date);

update transactions t
set recurring_transaction_id = rt.id,
    recurring_occurrence_date = t.date
from recurring_transactions rt
where rt.source_transaction_id = t.id
  and (t.recurring_transaction_id is distinct from rt.id or t.recurring_occurrence_date is distinct from t.date);
