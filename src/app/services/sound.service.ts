import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioContext: AudioContext | null = null;
  private soundEnabled = new BehaviorSubject<boolean>(true);
  
  constructor() {
    console.log('SoundService initialized');
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('AudioContext initialized successfully');
    } catch (error) {
      console.error('Web Audio API is not supported in this browser', error);
    }
  }

  /**
   * Play a notification sound for new bids
   */
  playBidNotification(): void {
    console.log('playBidNotification called, soundEnabled:', this.soundEnabled.value);
    if (!this.soundEnabled.value) {
      console.log('Sound is disabled, not playing notification');
      return;
    }
    
    if (!this.audioContext) {
      console.error('AudioContext not available, cannot play sound');
      return;
    }
    
    try {
      console.log('Creating oscillator for bid notification sound');
      // Create oscillator for a simple "ding" sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // Connect oscillator to gain node and gain node to destination
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Set oscillator type and frequency
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5 note
      
      // Set gain (volume)
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime); // Lower volume (0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
      
      console.log('Starting oscillator for bid notification sound');
      // Start and stop oscillator
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.3);
      
      console.log('Bid notification sound played');
    } catch (error) {
      console.error('Error playing bid notification sound:', error);
    }
  }
  
  /**
   * Enable or disable sounds
   */
  setSoundEnabled(enabled: boolean): void {
    console.log('Setting sound enabled:', enabled);
    this.soundEnabled.next(enabled);
  }
  
  /**
   * Get the current sound enabled state
   */
  getSoundEnabled(): Observable<boolean> {
    return this.soundEnabled.asObservable();
  }
  
  /**
   * Get the current sound enabled state value
   */
  getSoundEnabledValue(): boolean {
    return this.soundEnabled.value;
  }
}