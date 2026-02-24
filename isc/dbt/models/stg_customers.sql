-- Staging: customers from Mifos mock (will be replaced by Kafka ingestion)
{{ config(materialized='view') }}

select
  id,
  display_name,
  status as life_stage,
  created_at,
  updated_at
from {{ source('mifos', 'clients') }}
