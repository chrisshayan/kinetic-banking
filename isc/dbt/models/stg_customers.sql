-- Staging: customers from Customer Truth
{{ config(materialized='view') }}

select
  id as customer_id,
  display_name,
  status,
  life_stage,
  created_at,
  updated_at
from {{ source('kinetic', 'customers') }}
