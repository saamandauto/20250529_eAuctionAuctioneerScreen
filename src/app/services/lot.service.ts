import { Injectable } from '@angular/core';
import { Observable, from, catchError, of, tap, map, throwError } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { LotDetails, LotStatus } from '../models/interfaces';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LotService {
  constructor(private supabaseService: SupabaseService) {
    console.log('LotService initialized');
  }

  /**
   * Fetches all lots from the Supabase database
   * @returns Observable with array of LotDetails
   */
  getLots(): Observable<LotDetails[]> {
    console.log('LotService - Getting lots from Supabase');
    return from(
      this.supabaseService.getClient()
        .from('lots')
        .select('*')
        .order('lot_number', { ascending: true })
    ).pipe(
      tap(response => {
        console.log('LotService - Supabase response received for getLots');
        if (response.error) {
          console.error('LotService - Error in Supabase response:', response.error);
        } else {
          console.log('LotService - Number of lots returned:', response.data?.length || 0);
        }
      }),
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching lots from Supabase:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.warn('No lots returned from Supabase');
          return [];
        }

        // Map the database field names (snake_case) to the interface field names (camelCase)
        return data.map(lot => this.mapDbLotToLotDetails(lot));
      }),
      catchError(err => {
        console.error('Failed to fetch lots from Supabase:', err);
        if (err.message) console.error('Error message:', err.message);
        if (err.stack) console.error('Error stack:', err.stack);
        
        // Return an empty array on error
        return of([]);
      }),
      tap(lots => {
        console.log(`LotService - Final lots array ready, count: ${lots.length}`);
      })
    );
  }

  /**
   * Updates a lot in the Supabase database
   * @param lot The lot to update
   * @returns Observable with the updated lot
   */
  updateLot(lot: LotDetails): Observable<LotDetails> {
    console.log('LotService - Updating lot in Supabase:', lot.lotNumber);
    
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
      online_users: lot.onlineUsers,
      updated_at: new Date().toISOString()
    };
    
    // If the lot has a final state, handle that separately
    if (lot.finalState) {
      // This would be handled in a separate method to create or update the final state
      // and associate it with the lot
    }
    
    return from(
      this.supabaseService.getClient()
        .from('lots')
        .update(dbLot)
        .eq('lot_number', lot.lotNumber)
        .select()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error updating lot in Supabase:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          throw new Error(`No lot found with lot number ${lot.lotNumber}`);
        }
        
        return this.mapDbLotToLotDetails(data[0]);
      }),
      catchError(err => {
        console.error('Failed to update lot in Supabase:', err);
        return throwError(() => new Error(`Failed to update lot in Supabase: ${err.message}`));
      })
    );
  }

  /**
   * Calls the seed-lots Supabase function to populate the database with initial lot data
   * @returns Observable with the result of the operation
   */
  seedLots(): Observable<any> {
    console.log('LotService - Seeding lots in Supabase');
    
    const anon_key = environment.supabase.anonKey;
    const supabase_url = environment.supabase.url;
    
    console.log('Using Supabase URL:', supabase_url);
    
    return from(
      fetch(
        `${supabase_url}/functions/v1/seed-lots`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anon_key}`,
            'Content-Type': 'application/json'
          }
        }
      )
      .then(async response => {
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            // Try to parse the error response as JSON
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) {
              errorMessage += ` - ${errorJson.error}`;
            }
          } catch {
            // If parsing fails, just use the raw text
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          }
          throw new Error(errorMessage);
        }
        return response.json();
      })
    ).pipe(
      tap(result => {
        console.log('LotService - Seed lots result:', result);
        
        if (!result.success) {
          throw new Error(`Failed to seed lots: ${result.error || 'Unknown error'}`);
        }
      }),
      catchError(err => {
        console.error('Failed to seed lots in Supabase:', err);
        // Return a proper error instead of a fake success object
        return throwError(() => new Error(`Failed to seed lots in Supabase: ${err.message}`));
      })
    );
  }
  
  /**
   * Maps a database lot object (snake_case) to a LotDetails object (camelCase)
   * @param dbLot The database lot object
   * @returns A LotDetails object
   */
  private mapDbLotToLotDetails(dbLot: any): LotDetails {
    return {
      lotNumber: dbLot.lot_number,
      make: dbLot.make,
      model: dbLot.model,
      year: dbLot.year,
      transmission: dbLot.transmission,
      fuel: dbLot.fuel,
      color: dbLot.color,
      mileage: dbLot.mileage,
      location: dbLot.location,
      registration: dbLot.registration,
      reservePrice: dbLot.reserve_price,
      initialAskingPrice: dbLot.initial_asking_price,
      lastAuctionBid: dbLot.last_auction_bid,
      indicataMarketPrice: dbLot.indicata_market_price,
      status: dbLot.status as LotStatus,
      viewers: dbLot.viewers,
      watchers: dbLot.watchers,
      leadListUsers: dbLot.lead_list_users,
      onlineUsers: dbLot.online_users,
      // finalState will be fetched separately if needed
      finalState: undefined
    };
  }
}