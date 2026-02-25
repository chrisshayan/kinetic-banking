-- Peer benchmarking features for Coach
-- Segment by life_stage; compute balance percentiles and peer averages
{{ config(materialized='view') }}

with customer_totals as (
  select
    c.customer_id,
    c.life_stage,
    coalesce(sum(a.balance), 0) as total_balance,
    coalesce(sum(case when a.product_type in ('TERM_DEPOSIT', 'SAVINGS') then a.balance else 0 end), 0) as savings_balance,
    count(*) filter (where a.status = 'ACTIVE') as account_count
  from {{ ref('stg_customers') }} c
  left join {{ ref('stg_accounts') }} a on a.customer_id = c.customer_id and a.status = 'ACTIVE'
  group by 1, 2
),
peer_medians as (
  select
    life_stage,
    percentile_cont(0.5) within group (order by total_balance) as peer_median_balance
  from customer_totals
  group by life_stage
),
with_peer_stats as (
  select
    ct.customer_id,
    ct.life_stage,
    ct.total_balance,
    ct.savings_balance,
    ct.account_count,
    count(*) over (partition by ct.life_stage) as peer_count,
    avg(ct.total_balance) over (partition by ct.life_stage) as peer_avg_balance,
    pm.peer_median_balance,
    percent_rank() over (partition by ct.life_stage order by ct.total_balance) as balance_percentile_rank,
    percent_rank() over (partition by ct.life_stage order by ct.savings_balance) as savings_percentile_rank
  from customer_totals ct
  left join peer_medians pm on pm.life_stage = ct.life_stage
)
select
  customer_id,
  life_stage,
  total_balance,
  savings_balance,
  account_count,
  peer_count,
  peer_avg_balance,
  peer_median_balance,
  round((balance_percentile_rank * 100)::numeric, 1) as balance_percentile,
  round((savings_percentile_rank * 100)::numeric, 1) as savings_percentile
from with_peer_stats
