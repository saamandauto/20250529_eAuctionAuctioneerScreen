import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private static supabaseInstance: SupabaseClient | null = null;

  constructor() {}

  /**
   * Get the singleton Supabase client instance
   * This ensures only one client exists in the entire application
   */
  getClient(): SupabaseClient {
    if (!SupabaseService.supabaseInstance) {
      try {
        SupabaseService.supabaseInstance = createClient(
          environment.supabase.url,
          environment.supabase.anonKey,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
              flowType: 'implicit'
            },
            global: {
              headers: {
                'X-Client-Info': 'auction-app'
              }
            }
          }
        );
      } catch (error) {
        throw error;
      }
    }
    
    return SupabaseService.supabaseInstance;
  }
}