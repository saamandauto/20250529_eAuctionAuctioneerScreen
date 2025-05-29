-- Set NOT VALID for constraints to allow creation with existing NULL values
-- First handle existing NULL values in lot_final_states

-- Add status to lot_final_states with a default value
ALTER TABLE lot_final_states ADD COLUMN IF NOT EXISTS status text;

-- Set default status values for existing records
UPDATE lot_final_states SET status = 'Sold' WHERE status IS NULL;

-- Now make it NOT NULL
ALTER TABLE lot_final_states ALTER COLUMN status SET NOT NULL;

-- Add lot_number column to lot_final_states, initially allowing NULL
ALTER TABLE lot_final_states ADD COLUMN IF NOT EXISTS lot_number integer;

-- Update existing lot_final_states with lot numbers from lots
UPDATE lot_final_states fs 
SET lot_number = l.lot_number
FROM lots l 
WHERE l.lot_final_state_id = fs.id;

-- Now make lot_number NOT NULL after updating all records
ALTER TABLE lot_final_states ALTER COLUMN lot_number SET NOT NULL;

-- Drop the foreign key constraint and indexes first
ALTER TABLE lots DROP CONSTRAINT IF EXISTS lots_lot_final_state_id_fkey;
DROP INDEX IF EXISTS idx_lots_final_state_id;

-- Add foreign key from lot_final_states to lots
ALTER TABLE lot_final_states ADD CONSTRAINT lot_final_states_lot_number_fkey
  FOREIGN KEY (lot_number) REFERENCES lots(lot_number) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lot_final_states_lot_number ON lot_final_states(lot_number);

-- Remove the lot_final_state_id and status columns from lots table
ALTER TABLE lots DROP COLUMN IF EXISTS lot_final_state_id;
ALTER TABLE lots DROP COLUMN IF EXISTS status;