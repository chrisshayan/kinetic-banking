-- Staging: transactions from Customer Truth
{{ config(materialized='view') }}

select
  id as transaction_id,
  account_id,
  type,
  amount,
  balance_after,
  description,
  created_at
from {{ source('kinetic', 'transactions') }}
