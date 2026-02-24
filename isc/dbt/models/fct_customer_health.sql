-- Semantic layer: customer health score features for Coach
-- Used by Feast + MLflow health model
{{ config(materialized='view') }}

with customer_balances as (
  select
    a.customer_id,
    sum(case when a.product_type = 'CURRENT' then a.balance else 0 end) as current_balance,
    sum(case when a.product_type in ('TERM_DEPOSIT', 'SAVINGS') then a.balance else 0 end) as savings_balance,
    sum(case when a.product_type = 'CREDIT_CARD' then abs(a.balance) else 0 end) as credit_utilization,
    count(*) filter (where a.product_type = 'CURRENT') as has_current_account,
    count(*) filter (where a.product_type in ('TERM_DEPOSIT', 'SAVINGS')) as has_savings
  from {{ ref('stg_accounts') }} a
  where a.status = 'ACTIVE'
  group by 1
),
txn_activity as (
  select
    a.customer_id,
    count(t.transaction_id) as txn_count_30d,
    sum(case when t.type = 'CREDIT' then t.amount else 0 end) as total_credits_30d,
    sum(case when t.type = 'DEBIT' then abs(t.amount) else 0 end) as total_debits_30d
  from {{ ref('stg_accounts') }} a
  join {{ ref('stg_transactions') }} t on t.account_id = a.account_id
  where t.created_at >= current_date - interval '30 days'
  group by 1
)
select
  c.customer_id,
  c.display_name,
  c.life_stage,
  coalesce(cb.current_balance, 0) as current_balance,
  coalesce(cb.savings_balance, 0) as savings_balance,
  coalesce(cb.credit_utilization, 0) as credit_utilization,
  coalesce(cb.has_current_account, 0)::int as has_current_account,
  coalesce(cb.has_savings, 0)::int as has_savings,
  coalesce(ta.txn_count_30d, 0) as txn_count_30d,
  coalesce(ta.total_credits_30d, 0) as total_credits_30d,
  coalesce(ta.total_debits_30d, 0) as total_debits_30d
from {{ ref('stg_customers') }} c
left join customer_balances cb on cb.customer_id = c.customer_id
left join txn_activity ta on ta.customer_id = c.customer_id
