import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private audioContext: AudioContext | null = null;
  private voiceEnabled = new BehaviorSubject<boolean>(false);
  private hasCreditsError = new BehaviorSubject<boolean>(false);
  private audioQueue: Array<{ text: string, playAfter?: string }> = [];
  private isPlaying = false;
  private maxRetries = 2;
  private lastSpokenMessage = '';
  private lastSpeakTime = 0;
  private throttleTimeMs = 1000; // Don't repeat the same message within 1 second
  private lastBidAnnounceTime = 0;
  private bidAnnounceCooldown = 5000; // 5 second cooldown between bid announcements
  private hasShownActivationToast = false;
  private selectedVoice = new BehaviorSubject<string>('21m00Tcm4TlvDq8ikWAM');

  constructor(
    private toastr: ToastrService,
    private supabaseService: SupabaseService
  ) {
    // Initialize AudioContext when service is created
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Web Audio API is not supported in this browser', error);
    }
  }

  // Helper function to format prices for speech
  public formatPriceForSpeech(price: number): string {
    if (price >= 1000000) {
      const millions = Math.floor(price / 1000000);
      const thousands = Math.floor((price % 1000000) / 1000);
      const remainder = price % 1000;
      
      let result = `${millions} million`;
      if (thousands > 0) {
        result += ` ${thousands} thousand`;
      }
      if (remainder > 0) {
        result += ` ${remainder}`;
      }
      return result + ' pounds';
    } 
    else if (price >= 1000) {
      const thousands = Math.floor(price / 1000);
      const remainder = price % 1000;
      
      if (remainder === 0) {
        return `${thousands} thousand pounds`;
      } else {
        return `${thousands} thousand ${remainder} pounds`;
      }
    } 
    else {
      return `${price} pounds`;
    }
  }

  public toggleVoice(): void {
    const newState = !this.voiceEnabled.value;
    this.voiceEnabled.next(newState);
    
    if (newState) {
      // Reset credits error state when enabling
      this.hasCreditsError.next(false);
      
      // Only show activation toast the first time
      if (!this.hasShownActivationToast) {
        this.toastr.success('Audio assistant enabled');
        this.hasShownActivationToast = true;
        // Speak welcome message
        this.speak('Audio assistant enabled. I will announce important events during the auction.');
      }
    } else {
      // Clear the audio queue when disabled
      this.audioQueue = [];
    }
  }

  public getVoiceEnabled(): Observable<boolean> {
    return this.voiceEnabled.asObservable();
  }
  
  public getVoiceEnabledValue(): boolean {
    return this.voiceEnabled.value;
  }
  
  public getHasCreditsError(): Observable<boolean> {
    return this.hasCreditsError.asObservable();
  }

  public speak(text: string, playAfter?: string): void {
    if (!this.voiceEnabled.value) return;
    
    // If we've already detected a credits error, don't try to speak
    if (this.hasCreditsError.value) {
      console.log('Skipping speech due to credits error');
      return;
    }
    
    // Process text to better format price mentions for speech
    text = this.processPriceTextForSpeech(text);
    
    // Limit text length to avoid potential issues
    const maxTextLength = 500;
    const truncatedText = text.length > maxTextLength ? 
      text.substring(0, maxTextLength) + "..." : 
      text;
    
    // Check if this is a bid announcement (contains "New bid of")
    const isBidAnnouncement = text.includes("New bid of");
    
    // For bid announcements, check the cooldown period
    if (isBidAnnouncement) {
      const now = Date.now();
      if (now - this.lastBidAnnounceTime < this.bidAnnounceCooldown) {
        console.log('Skipping bid announcement due to cooldown:', truncatedText);
        return;
      }
      this.lastBidAnnounceTime = now;
    }
    
    // Throttle repeated messages
    const now = Date.now();
    if (truncatedText === this.lastSpokenMessage && now - this.lastSpeakTime < this.throttleTimeMs) {
      console.log('Skipping repeated message:', truncatedText);
      return;
    }
    
    // Update tracking variables
    this.lastSpokenMessage = truncatedText;
    this.lastSpeakTime = now;
    
    // Add to queue
    this.audioQueue.push({ text: truncatedText, playAfter });
    
    // If nothing is playing, start playing
    if (!this.isPlaying) {
      this.playNextInQueue();
    }
  }

  // Helper to convert price text for better speech synthesis
  private processPriceTextForSpeech(text: string): string {
    // Replace price patterns with speech-friendly versions
    // Pattern for £X,XXX or £XX,XXX etc.
    return text.replace(/£(\d{1,3}(,\d{3})*|\d+)/g, (match, priceStr) => {
      // Remove commas to get the numeric value
      const price = parseInt(priceStr.replace(/,/g, ''));
      if (!isNaN(price)) {
        return this.formatPriceForSpeech(price);
      }
      return match; // Return unchanged if parse fails
    });
  }

  private async playNextInQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }
    
    this.isPlaying = true;
    const item = this.audioQueue.shift();
    
    if (!item) {
      this.isPlaying = false;
      return;
    }
    
    try {
      await this.playAudio(item.text);
      // Continue with next item in queue
      this.playNextInQueue();
    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
      
      // Check if this is a credits error (401)
      if (this.isCreditsError(error)) {
        this.hasCreditsError.next(true);
        this.audioQueue = []; // Clear the queue
        this.showCreditsErrorMessage();
      }
    }
  }
  
  private isCreditsError(error: any): boolean {
    const errorMsg = this.getErrorMessage(error);
    return errorMsg.includes('authentication failed') || 
           errorMsg.includes('API key') || 
           errorMsg.includes('401');
  }
  
  private showCreditsErrorMessage(): void {
    this.toastr.error(
      'Your ElevenLabs API credits have been exhausted or the API key is invalid. Voice announcements are now disabled.',
      'Voice Assistant Unavailable', 
      { 
        timeOut: 10000, // 10 seconds
        closeButton: true
      }
    );
  }

  private async playAudio(text: string, retryCount = 0): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }
    
    try {
      // Build full URL for edge function call
      const functionUrl = `${environment.supabase.url}/functions/v1/voice-agent`;
      
      // Call the Supabase Edge Function for text-to-speech
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${environment.supabase.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voiceId: this.selectedVoice.value })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage;
        try {
          const parsed = JSON.parse(errorData);
          errorMessage = parsed.error || 'Unknown error';
        } catch (e) {
          errorMessage = errorData || `HTTP error ${response.status}`;
        }
        throw new Error(`Edge function error: ${errorMessage}`);
      }
      
      const responseData = await response.json();
      
      if (!responseData || !responseData.data) {
        throw new Error('No audio data received from the voice service');
      }
      
      // Convert data to array buffer and play it
      const arrayBuffer = this.base64ToArrayBuffer(responseData.data);
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      return new Promise<void>((resolve, reject) => {
        const source = this.audioContext!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext!.destination);
        source.onended = () => resolve();
        
        // Handle errors with a try-catch instead of onerror
        try {
          source.start(0);
        } catch (error: unknown) {
          reject(new Error('Failed to play audio: ' + this.getErrorMessage(error)));
        }
      });
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      
      // Don't retry if the error is a stack overflow or contains "Maximum call stack size exceeded"
      // Also don't retry authentication errors
      const errorMessage = this.getErrorMessage(error);
      if (errorMessage.includes('Maximum call stack size exceeded') || 
          errorMessage.includes('stack') || 
          retryCount >= this.maxRetries ||
          errorMessage.includes('authentication failed') ||
          errorMessage.includes('401')) {
        throw error;
      }
      
      // Only retry for specific errors that might be transient
      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('NetworkError') || 
          errorMessage.includes('timeout')) {
        console.log(`Retrying playAudio (attempt ${retryCount + 1} of ${this.maxRetries})...`);
        return this.playAudio(text, retryCount + 1);
      }
      
      // For other errors, don't retry to avoid potential recursion
      throw error;
    }
  }
  
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  }
  
  private getUserFriendlyErrorMessage(error: unknown): string {
    const errorMsg = this.getErrorMessage(error);
    
    // Check for specific error patterns and provide user-friendly messages
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
      return 'Unable to connect to the audio service. Please check your internet connection.';
    }
    
    if (errorMsg.includes('authentication failed') || errorMsg.includes('API key') || errorMsg.includes('401')) {
      return 'Your ElevenLabs API credits have been exhausted or the API key is invalid.';
    }
    
    if (errorMsg.includes('Edge function')) {
      return 'The audio assistant service is currently unavailable. Please try again later.';
    }
    
    if (errorMsg.includes('AudioContext')) {
      return 'Your browser does not support audio playback required for the audio assistant.';
    }
    
    if (errorMsg.includes('Maximum call stack size exceeded')) {
      return 'The audio service is experiencing technical difficulties. Please try again later.';
    }
    
    // Default message for unknown errors
    return 'Audio assistant encountered an issue. Please try again later.';
  }
  
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
  
  setSelectedVoice(voiceId: string): void {
    this.selectedVoice.next(voiceId);
  }
  
  getSelectedVoice(): Observable<string> {
    return this.selectedVoice.asObservable();
  }
}