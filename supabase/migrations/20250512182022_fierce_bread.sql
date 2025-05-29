/*
  # Create lots and lot_final_states tables

  1. New Tables
    - `lots` - Stores the vehicle lot information for auctions
      - `lot_number` (integer, primary key) - Unique identifier for each lot
      - `make` (text) - Vehicle manufacturer
      - `model` (text) - Vehicle model
      - `year` (integer) - Vehicle manufacturing year
      - `transmission` (text) - Vehicle transmission type
      - `fuel` (text) - Vehicle fuel type
      - `color` (text) - Vehicle color
      - `mileage` (integer) - Vehicle mileage in kilometers
      - `location` (text) - Location of the vehicle
      - `registration` (text) - Vehicle registration number
      - `reserve_price` (integer) - Minimum price the seller is willing to accept
      - `initial_asking_price` (integer) - Starting asking price
      - `last_auction_bid` (integer, nullable) - Last bid in a previous auction
      - `indicata_market_price` (integer, nullable) - Indicative market price
      - `status` (text, nullable) - Current status of the lot (Pending, Active, Sold, No Sale, Withdrawn)
      - `viewers` (integer) - Number of viewers
      - `watchers` (integer) - Number of watchers
      - `lead_list_users` (integer) - Number of lead list users
      - `online_users` (integer) - Number of online users
      - `lot_final_state_id` (uuid, nullable) - Reference to final state if sold

    - `lot_final_states` - Stores the final state of a lot after it's sold
      - `id` (uuid, primary key) - Unique identifier
      - `sold_price` (integer) - Price the lot was sold for
      - `reserve_price` (integer) - Reserve price at time of sale
      - `performance_value` (integer) - Numerical performance value
      - `performance_text` (text) - Human-readable performance text
      - `sold_time` (text) - Time when the lot was sold
      - `sold_to` (text) - Name of the buyer
      - `sold_to_id` (text) - ID of the buyer

  2. Security
    - Enable RLS on `lots` table
    - Add policy for authenticated users to read all lots
    - Enable RLS on `lot_final_states` table
    - Add policy for authenticated users to read all lot final states
*/

-- Create the lot_final_states table
CREATE TABLE IF NOT EXISTS lot_final_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sold_price integer NOT NULL,
  reserve_price integer NOT NULL,
  performance_value integer NOT NULL,
  performance_text text NOT NULL,
  sold_time text NOT NULL,
  sold_to text NOT NULL,
  sold_to_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create the bids table to store individual bids for a lot
CREATE TABLE IF NOT EXISTS lot_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_final_state_id uuid REFERENCES lot_final_states(id) ON DELETE CASCADE,
  bidder text NOT NULL,
  bidder_id text NOT NULL,
  amount integer NOT NULL,
  time text NOT NULL,
  type text NOT NULL,
  bid_type text NOT NULL,
  company_name text,
  company_type text,
  city text,
  country text,
  created_at timestamptz DEFAULT now()
);

-- Create the lots table
CREATE TABLE IF NOT EXISTS lots (
  lot_number integer PRIMARY KEY,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  transmission text NOT NULL,
  fuel text NOT NULL,
  color text NOT NULL,
  mileage integer NOT NULL,
  location text NOT NULL,
  registration text NOT NULL,
  reserve_price integer NOT NULL,
  initial_asking_price integer NOT NULL,
  last_auction_bid integer,
  indicata_market_price integer,
  status text,
  viewers integer NOT NULL,
  watchers integer NOT NULL,
  lead_list_users integer NOT NULL,
  online_users integer NOT NULL,
  lot_final_state_id uuid REFERENCES lot_final_states(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_final_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_bids ENABLE ROW LEVEL SECURITY;

-- Create policy for lots
CREATE POLICY "Allow read access for all authenticated users" 
ON lots 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy for lot_final_states
CREATE POLICY "Allow read access for all authenticated users" 
ON lot_final_states 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy for lot_bids
CREATE POLICY "Allow read access for all authenticated users" 
ON lot_bids 
FOR SELECT 
TO authenticated 
USING (true);

-- Create index on lot_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_lots_lot_number ON lots(lot_number);

-- Create index on lot_final_state_id for faster joins
CREATE INDEX IF NOT EXISTS idx_lots_final_state_id ON lots(lot_final_state_id);
CREATE INDEX IF NOT EXISTS idx_lot_bids_final_state_id ON lot_bids(lot_final_state_id);