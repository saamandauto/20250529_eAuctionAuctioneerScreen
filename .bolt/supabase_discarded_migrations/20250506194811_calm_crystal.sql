/*
  # Create loggedInDealers table with correct schema

  1. New Tables
    - `loggedInDealers`
      - `ID` (bigint, primary key)
      - `USR_ID` (bigint)
      - `FIRSTNAME` (character varying)
      - `LASTNAME` (character varying)
      - `PHONE` (character varying)
      - `MOBILEPHONE` (character varying)
      - `NOTE` (character varying)
      - `LASTLOGIN` (timestamp with time zone)
      - `LASTBIDDATE` (timestamp with time zone)
      - `LASTBUY` (timestamp with time zone)
      - `TYPE` (character varying)
  
  2. Security
    - Enable RLS on `loggedInDealers` table
    - Add policy for authenticated users to read all data
*/

-- Create the loggedInDealers table with ID as primary key
CREATE TABLE IF NOT EXISTS loggedInDealers (
  ID bigint PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  USR_ID bigint,
  FIRSTNAME character varying,
  LASTNAME character varying,
  PHONE character varying,
  MOBILEPHONE character varying,
  NOTE character varying,
  LASTLOGIN timestamp with time zone,
  LASTBIDDATE timestamp with time zone,
  LASTBUY timestamp with time zone,
  TYPE character varying
);

-- Enable Row Level Security
ALTER TABLE loggedInDealers ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read
CREATE POLICY "Users can read all dealers"
  ON loggedInDealers
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample data
INSERT INTO loggedInDealers (ID, USR_ID, FIRSTNAME, LASTNAME, PHONE, MOBILEPHONE, NOTE, LASTLOGIN, LASTBIDDATE, LASTBUY, TYPE)
VALUES
  (12345678, 12345678, 'KAM', 'Demo Account', '123456789', '987654321', 'Demo account for testing', NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '10 days', 'Standard'),
  (45678901, 45678901, 'Michael', 'Brown', '123123123', '321321321', 'VIP customer', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days', NOW() - INTERVAL '15 days', 'VIP'),
  (56789012, 56789012, 'Sarah', 'Wilson', '456456456', '654654654', 'Premium customer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '20 days', 'Premium'),
  (67890123, 67890123, 'David', 'Taylor', '789789789', '987987987', 'Standard customer', NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '30 days', 'Standard'),
  (78901234, 78901234, 'Lisa', 'Anderson', '321321321', '123123123', 'Premium customer', NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '25 days', 'Premium'),
  (89012345, 89012345, 'James', 'Wilson', '654654654', '456456456', 'Standard customer', NOW() - INTERVAL '4 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '35 days', 'Standard'),
  (90123456, 90123456, 'Sophie', 'Martinez', '987987987', '789789789', 'VIP customer', NOW() - INTERVAL '1 day', NOW() - INTERVAL '7 days', NOW() - INTERVAL '18 days', 'VIP'),
  (13456789, 13456789, 'Thomas', 'Lee', '111222333', '333222111', 'Standard customer', NOW() - INTERVAL '6 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '40 days', 'Standard'),
  (27890123, 27890123, 'Robert', 'Chen', '444555666', '666555444', 'Premium customer', NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '22 days', 'Premium'),
  (53456789, 53456789, 'Isabella', 'Garcia', '777888999', '999888777', 'VIP customer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '28 days', 'VIP')
ON CONFLICT (ID) DO NOTHING;