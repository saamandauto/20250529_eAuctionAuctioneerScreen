import { createClient } from 'npm:@supabase/supabase-js@2.39.6';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Define the mock lots directly in the edge function
// This is the same data that was previously in src/app/data/mock-lots.ts
const MOCK_LOTS = [
  {
    lotNumber: 1,
    make: 'Tesla',
    model: 'Model Y Performance',
    year: 2023,
    transmission: 'Automatic',
    fuel: 'Electric',
    color: 'Pearl White',
    mileage: 5200,
    location: 'London',
    registration: 'AB23 XYZ',
    reservePrice: 45000,
    initialAskingPrice: 36000,
    lastAuctionBid: 42000,
    viewers: 12,
    watchers: 5,
    leadListUsers: 3,
    onlineUsers: 8,
    indicataMarketPrice: 49165
  },
  {
    lotNumber: 2,
    make: 'Porsche',
    model: '911 GT3',
    year: 2022,
    transmission: 'Manual',
    fuel: 'Petrol',
    color: 'Guards Red',
    mileage: 3500,
    location: 'Manchester',
    registration: 'CD22 ABC',
    reservePrice: 120000,
    initialAskingPrice: 96000,
    lastAuctionBid: 115000,
    viewers: 15,
    watchers: 8,
    leadListUsers: 4,
    onlineUsers: 10,
    indicataMarketPrice: 126090
  },
  {
    lotNumber: 3,
    make: 'BMW',
    model: 'M3 Competition',
    year: 2021,
    transmission: 'Automatic',
    fuel: 'Petrol',
    color: 'Brooklyn Grey',
    mileage: 8700,
    location: 'Birmingham',
    registration: 'EF21 MNO',
    reservePrice: 72000,
    initialAskingPrice: 69000,
    lastAuctionBid: 70000,
    viewers: 9,
    watchers: 4,
    leadListUsers: 2,
    onlineUsers: 6,
    indicataMarketPrice: 78618
  },
  {
    lotNumber: 4,
    make: 'Audi',
    model: 'RS5 Sportback',
    year: 2020,
    transmission: 'Automatic',
    fuel: 'Petrol',
    color: 'Mythos Black',
    mileage: 15000,
    location: 'Leeds',
    registration: 'GH20 PQR',
    reservePrice: 61000,
    initialAskingPrice: 58000,
    lastAuctionBid: 59000,
    viewers: 11,
    watchers: 6,
    leadListUsers: 3,
    onlineUsers: 7,
    indicataMarketPrice: 66361
  },
  {
    lotNumber: 5,
    make: 'Mercedes-Benz',
    model: 'C63 AMG',
    year: 2019,
    transmission: 'Automatic',
    fuel: 'Petrol',
    color: 'Selenite Grey',
    mileage: 23000,
    location: 'Edinburgh',
    registration: 'IJ19 STU',
    reservePrice: 54000,
    initialAskingPrice: 50000,
    lastAuctionBid: 52000,
    viewers: 8,
    watchers: 4,
    leadListUsers: 1,
    onlineUsers: 5,
    indicataMarketPrice: 57826
  },
  {
    lotNumber: 6,
    make: 'Volvo',
    model: 'XC90 Recharge',
    year: 2022,
    transmission: 'Automatic',
    fuel: 'Hybrid',
    color: 'Crystal White Pearl',
    mileage: 9000,
    location: 'Copenhagen',
    registration: 'DK22 VXC',
    reservePrice: 65000,
    initialAskingPrice: 61000,
    lastAuctionBid: 64000,
    viewers: 10,
    watchers: 3,
    leadListUsers: 2,
    onlineUsers: 6,
    indicataMarketPrice: 67744
  },
  {
    lotNumber: 7,
    make: 'Volkswagen',
    model: 'Golf R',
    year: 2021,
    transmission: 'DSG',
    fuel: 'Petrol',
    color: 'Lapiz Blue',
    mileage: 12000,
    location: 'Berlin',
    registration: 'DE21 RGT',
    reservePrice: 42000,
    initialAskingPrice: 40000,
    lastAuctionBid: 41500,
    viewers: 13,
    watchers: 5,
    leadListUsers: 3,
    onlineUsers: 8,
    indicataMarketPrice: 44771
  },
  {
    lotNumber: 8,
    make: 'Toyota',
    model: 'GR Yaris',
    year: 2022,
    transmission: 'Manual',
    fuel: 'Petrol',
    color: 'Scarlet Flare',
    mileage: 7000,
    location: 'Oslo',
    registration: 'NO22 GRY',
    reservePrice: 37000,
    initialAskingPrice: 34000,
    lastAuctionBid: 36500,
    viewers: 7,
    watchers: 2,
    leadListUsers: 2,
    onlineUsers: 4,
    indicataMarketPrice: 39165
  },
  {
    lotNumber: 9,
    make: 'Peugeot',
    model: 'e-208 GT',
    year: 2023,
    transmission: 'Automatic',
    fuel: 'Electric',
    color: 'Vertigo Blue',
    mileage: 4500,
    location: 'Paris',
    registration: 'FR23 EGT',
    reservePrice: 29000,
    initialAskingPrice: 26000,
    lastAuctionBid: 27500,
    viewers: 5,
    watchers: 3,
    leadListUsers: 1,
    onlineUsers: 3,
    indicataMarketPrice: 31000
  },
  {
    lotNumber: 10,
    make: 'Skoda',
    model: 'Enyaq iV',
    year: 2023,
    transmission: 'Automatic',
    fuel: 'Electric',
    color: 'Arctic Silver',
    mileage: 6100,
    location: 'Prague',
    registration: 'CZ23 ENQ',
    reservePrice: 37000,
    initialAskingPrice: 34000,
    lastAuctionBid: 36000,
    viewers: 6,
    watchers: 2,
    leadListUsers: 1,
    onlineUsers: 4,
    indicataMarketPrice: 40069
  },
  {
    lotNumber: 11,
    make: 'Ford',
    model: 'Mustang Mach-E',
    year: 2021,
    transmission: 'Automatic',
    fuel: 'Electric',
    color: 'Rapid Red',
    mileage: 11000,
    location: 'Amsterdam',
    registration: 'NL21 FME',
    reservePrice: 48000,
    initialAskingPrice: 44000,
    lastAuctionBid: 46500,
    viewers: 9,
    watchers: 4,
    leadListUsers: 2,
    onlineUsers: 5,
    indicataMarketPrice: 51351
  },
  {
    lotNumber: 12,
    make: 'Renault',
    model: 'Megane E-Tech',
    year: 2022,
    transmission: 'Automatic',
    fuel: 'Electric',
    color: 'Midnight Blue',
    mileage: 5500,
    location: 'Brussels',
    registration: 'BE22 MET',
    reservePrice: 34000,
    initialAskingPrice: 32000,
    lastAuctionBid: 33500,
    viewers: 4,
    watchers: 2,
    leadListUsers: 1,
    onlineUsers: 2,
    indicataMarketPrice: 35852
  },
  {
    lotNumber: 13,
    make: 'Jaguar',
    model: 'F-Type R',
    year: 2020,
    transmission: 'Automatic',
    fuel: 'Petrol',
    color: 'British Racing Green',
    mileage: 18000,
    location: 'Dublin',
    registration: 'IE20 JFR',
    reservePrice: 67000,
    initialAskingPrice: 63000,
    lastAuctionBid: 66000,
    viewers: 6,
    watchers: 4,
    leadListUsers: 2,
    onlineUsers: 4,
    indicataMarketPrice: 70589
  },
  {
    lotNumber: 14,
    make: 'Hyundai',
    model: 'Ioniq 5',
    year: 2023,
    transmission: 'Automatic',
    fuel: 'Electric',
    color: 'Cyber Grey',
    mileage: 3000,
    location: 'Stockholm',
    registration: 'SE23 I5E',
    reservePrice: 46000,
    initialAskingPrice: 43000,
    lastAuctionBid: 45500,
    viewers: 8,
    watchers: 3,
    leadListUsers: 1,
    onlineUsers: 5,
    indicataMarketPrice: 49536
  },
  {
    lotNumber: 15,
    make: 'Kia',
    model: 'EV6 GT-Line',
    year: 2023,
    transmission: 'Automatic',
    fuel: 'Electric',
    color: 'Runway Red',
    mileage: 4000,
    location: 'Helsinki',
    registration: 'FI23 KEV',
    reservePrice: 47000,
    initialAskingPrice: 44000,
    lastAuctionBid: 46000,
    viewers: 7,
    watchers: 3,
    leadListUsers: 2,
    onlineUsers: 4,
    indicataMarketPrice: 49320
  },
  {
    lotNumber: 16,
    make: 'Nissan',
    model: 'Ariya',
    year: 2022,
    transmission: 'Automatic',
    fuel: 'Electric',
    color: 'Warm Silver',
    mileage: 8500,
    location: 'Warsaw',
    registration: 'PL22 ARY',
    reservePrice: 41000,
    initialAskingPrice: 38000,
    lastAuctionBid: 40500,
    viewers: 5,
    watchers: 2,
    leadListUsers: 1,
    onlineUsers: 3,
    indicataMarketPrice: 43489
  },
  {
    lotNumber: 17,
    make: 'Mazda',
    model: 'MX-30',
    year: 2021,
    transmission: 'Automatic',
    fuel: 'Electric',
    color: 'Polymetal Grey',
    mileage: 10000,
    location: 'Vienna',
    registration: 'AT21 MXE',
    reservePrice: 30000,
    initialAskingPrice: 27000,
    lastAuctionBid: 29500,
    viewers: 3,
    watchers: 1,
    leadListUsers: 1,
    onlineUsers: 2,
    indicataMarketPrice: 32514
  },
  {
    lotNumber: 18,
    make: 'Seat',
    model: 'Cupra Born',
    year: 2023,
    transmission: 'Automatic',
    fuel: 'Electric',
    color: 'Aurora Blue',
    mileage: 3200,
    location: 'Barcelona',
    registration: 'ES23 CBN',
    reservePrice: 37000,
    initialAskingPrice: 34000,
    lastAuctionBid: 36000,
    viewers: 4,
    watchers: 2,
    leadListUsers: 1,
    onlineUsers: 3,
    indicataMarketPrice: 39939
  },
  {
    lotNumber: 19,
    make: 'Alfa Romeo',
    model: 'Giulia Quadrifoglio',
    year: 2019,
    transmission: 'Automatic',
    fuel: 'Petrol',
    color: 'Rosso Competizione',
    mileage: 22000,
    location: 'Rome',
    registration: 'IT19 ARQ',
    reservePrice: 59000,
    initialAskingPrice: 55000,
    lastAuctionBid: 58000,
    viewers: 6,
    watchers: 4,
    leadListUsers: 2,
    onlineUsers: 5,
    indicataMarketPrice: 63281
  },
  {
    lotNumber: 20,
    make: 'Land Rover',
    model: 'Defender 110',
    year: 2021,
    transmission: 'Automatic',
    fuel: 'Diesel',
    color: 'Eiger Grey',
    mileage: 14000,
    location: 'Zurich',
    registration: 'CH21 LRD',
    reservePrice: 68000,
    initialAskingPrice: 64000,
    lastAuctionBid: 67000,
    viewers: 9,
    watchers: 5,
    leadListUsers: 2,
    onlineUsers: 6,
    indicataMarketPrice: 72797
  }
];

// Function to insert or update a lot
async function upsertLot(supabase, lot) {
  // Convert camelCase to snake_case for database column names
  const dbLot = {
    lot_number: lot.lotNumber,
    make: lot.make,
    model: lot.model,
    year: lot.year,
    transmission: lot.transmission,
    fuel: lot.fuel,
    color: lot.color,
    mileage: lot.mileage,
    location: lot.location,
    registration: lot.registration,
    reserve_price: lot.reservePrice,
    initial_asking_price: lot.initialAskingPrice,
    last_auction_bid: lot.lastAuctionBid,
    indicata_market_price: lot.indicataMarketPrice,
    status: lot.status,
    viewers: lot.viewers,
    watchers: lot.watchers,
    lead_list_users: lot.leadListUsers,
    online_users: lot.onlineUsers
  };

  const { data, error } = await supabase
    .from('lots')
    .upsert(dbLot, { onConflict: 'lot_number' })
    .select();

  if (error) {
    throw new Error(`Error upserting lot ${lot.lotNumber}: ${error.message}`);
  }

  return data;
}

// Using the built-in Deno.serve instead of the imported serve
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get Supabase client using environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    console.log('Connecting to Supabase at:', SUPABASE_URL);
    
    // Create Supabase client using imported createClient
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY, // Use service role key for admin access
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Check if lots already exist in the database
    const { data: existingLots, error: countError } = await supabaseClient
      .from('lots')
      .select('lot_number')
      .limit(1);
      
    if (countError) {
      throw new Error(`Error checking for existing lots: ${countError.message}`);
    }
    
    if (existingLots && existingLots.length > 0) {
      console.log('Lots already exist in database, truncating table first');
      // Clear existing lots before inserting new ones
      const { error: truncateError } = await supabaseClient
        .from('lots')
        .delete()
        .neq('lot_number', -1); // This effectively deletes all records
        
      if (truncateError) {
        throw new Error(`Error truncating lots table: ${truncateError.message}`);
      }
    }
    
    // Process lots - insert or update each lot
    const results = [];
    const errors = [];
    
    for (const lot of MOCK_LOTS) {
      try {
        const result = await upsertLot(supabaseClient, lot);
        results.push({ lotNumber: lot.lotNumber, result });
      } catch (error) {
        console.error(`Error processing lot ${lot.lotNumber}:`, error);
        errors.push({ lotNumber: lot.lotNumber, error: error.message });
      }
    }
    
    // Return the results
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} lots`,
        results,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in seed-lots function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown error occurred while seeding lots'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});