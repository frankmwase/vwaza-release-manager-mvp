-- Add reject_reason column to releases table
ALTER TABLE releases ADD COLUMN IF NOT EXISTS reject_reason TEXT;
