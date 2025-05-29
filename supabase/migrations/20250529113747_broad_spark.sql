-- Drop the column if it exists
ALTER TABLE lots DROP COLUMN IF EXISTS status;

-- Ensure lot_final_states has a status column
ALTER TABLE lot_final_states ADD COLUMN IF NOT EXISTS status text;

-- Set a default value for existing records
UPDATE lot_final_states SET status = 'Sold' WHERE status IS NULL;

-- Make the status NOT NULL now that we've populated existing records
ALTER TABLE lot_final_states ALTER COLUMN status SET NOT NULL;

-- Ensure lot_final_states has a lot_number column
ALTER TABLE lot_final_states ADD COLUMN IF NOT EXISTS lot_number integer;

-- Add the foreign key constraint if it doesn't exist
-- Using IF NOT EXISTS to avoid errors if the constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lot_final_states_lot_number_fkey'
  ) THEN
    ALTER TABLE lot_final_states 
    ADD CONSTRAINT lot_final_states_lot_number_fkey
    FOREIGN KEY (lot_number) REFERENCES lots(lot_number) ON DELETE CASCADE;
  END IF;
END
$$;

-- Create index for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_lot_final_states_lot_number ON lot_final_states(lot_number);