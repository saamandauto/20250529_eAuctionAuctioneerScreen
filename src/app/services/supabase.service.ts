import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private static supabaseInstance: SupabaseClient | null = null;

  constructor() {
    console.log('SupabaseService initialized');
    console.log('Supabase URL:', environment.supabase.url);
    console.log('Supabase Anon Key (first 10 chars):', environment.supabase.anonKey.substring(0, 10) + '...');
  }

  /**
   * Get the singleton Supabase client instance
   * This ensures only one client exists in the entire application
   */
  getClient(): SupabaseClient {
    if (!SupabaseService.supabaseInstance) {
      console.log('Creating new Supabase client instance');
      
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
        console.log('Supabase client created successfully');
      } catch (error) {
        console.error('Error creating Supabase client:', error);
        throw error;
      }
    } else {
      console.log('Using existing Supabase client instance');
    }
    
    return SupabaseService.supabaseInstance;
  }
}