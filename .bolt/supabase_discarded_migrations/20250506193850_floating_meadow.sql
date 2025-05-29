/*
  # Create loggedInDealers table

  1. New Tables
    - `loggedInDealers`
      - `USR_ID` (integer, primary key)
      - `FIRSTNAME` (text)
      - `LASTNAME` (text)
      - `PHONE` (text)
      - `MOBILEPHONE` (text)
      - `NOTE` (text)
      - `LASTLOGIN` (timestamp)
      - `LASTBIDDATE` (timestamp)
      - `LASTBUY` (timestamp)
      - `TYPE` (text)
  
  2. Security
    - Enable RLS on `loggedInDealers` table
    - Add policy for authenticated users to read all data
*/

-- Create the loggedInDealers table
CREATE TABLE IF NOT EXISTS loggedInDealers (
  USR_ID integer PRIMARY KEY,
  FIRSTNAME text,
  LASTNAME text,
  PHONE text,
  MOBILEPHONE text,
  NOTE text,
  LASTLOGIN timestamp with time zone,
  LASTBIDDATE timestamp with time zone,
  LASTBUY timestamp with time zone,
  TYPE text
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
INSERT INTO loggedInDealers (USR_ID, FIRSTNAME, LASTNAME, PHONE, MOBILEPHONE, NOTE, LASTLOGIN, LASTBIDDATE, LASTBUY, TYPE)
VALUES
  (12345678, 'KAM', 'Demo Account', '123456789', '987654321', 'Demo account for testing', NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '10 days', 'Standard'),
  (45678901, 'Michael', 'Brown', '123123123', '321321321', 'VIP customer', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days', NOW() - INTERVAL '15 days', 'VIP'),
  (56789012, 'Sarah', 'Wilson', '456456456', '654654654', 'Premium customer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '20 days', 'Premium'),
  (67890123, 'David', 'Taylor', '789789789', '987987987', 'Standard customer', NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '30 days', 'Standard'),
  (78901234, 'Lisa', 'Anderson', '321321321', '123123123', 'Premium customer', NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '25 days', 'Premium'),
  (89012345, 'James', 'Wilson', '654654654', '456456456', 'Standard customer', NOW() - INTERVAL '4 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '35 days', 'Standard'),
  (90123456, 'Sophie', 'Martinez', '987987987', '789789789', 'VIP customer', NOW() - INTERVAL '1 day', NOW() - INTERVAL '7 days', NOW() - INTERVAL '18 days', 'VIP'),
  (1234567, 'Thomas', 'Lee', '111222333', '333222111', 'Standard customer', NOW() - INTERVAL '6 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '40 days', 'Standard'),
  (7890123, 'Robert', 'Chen', '444555666', '666555444', 'Premium customer', NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '22 days', 'Premium'),
  (3456789, 'Isabella', 'Garcia', '777888999', '999888777', 'VIP customer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '28 days', 'VIP'),
  (9012345, 'William', 'Turner', '000111222', '222111000', 'Standard customer', NOW() - INTERVAL '7 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '45 days', 'Standard'),
  (5678901, 'Olivia', 'Parker', '333444555', '555444333', 'Premium customer', NOW() - INTERVAL '4 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '32 days', 'Premium'),
  (1234567, 'Daniel', 'Kim', '666777888', '888777666', 'VIP customer', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days', NOW() - INTERVAL '25 days', 'VIP'),
  (2345678, 'Alexandra', 'White', '999000111', '111000999', 'Standard customer', NOW() - INTERVAL '5 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '38 days', 'Standard'),
  (4567890, 'Marcus', 'Rodriguez', '222333444', '444333222', 'Premium customer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '30 days', 'Premium'),
  (8901234, 'Victoria', 'Chang', '555666777', '777666555', 'Standard customer', NOW() - INTERVAL '6 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '42 days', 'Standard'),
  (5678912, 'Christopher', 'Hall', '888999000', '000999888', 'VIP customer', NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '27 days', 'VIP'),
  (2348910, 'Natalie', 'Foster', '111222333', '333222111', 'Premium customer', NOW() - INTERVAL '4 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '36 days', 'Premium');