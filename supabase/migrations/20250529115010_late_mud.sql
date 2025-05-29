/*
  # Add unique constraint to lot_number in lot_final_states table

  1. Schema Changes
    - Add unique constraint to `lot_number` column in `lot_final_states` table

  2. Purpose
    - Enables upsert operations using `lot_number` as the conflict target
    - Fixes the error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
*/

-- Add unique constraint to lot_number column in lot_final_states table
ALTER TABLE lot_final_states ADD CONSTRAINT unique_lot_number UNIQUE (lot_number);