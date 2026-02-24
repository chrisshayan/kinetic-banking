-- Add account_number for display (e.g. beautiful numbers like 932021)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_number TEXT;
