-- Staging: accounts from Customer Truth
{{ config(materialized='view') }}

select
  id as account_id,
  customer_id,
  product_type,
  status,
  balance,
  currency,
  account_number,
  created_at
from {{ source('kinetic', 'accounts') }}
