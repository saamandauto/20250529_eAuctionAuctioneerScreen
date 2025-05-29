import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioContext: AudioContext | null = null;
  private soundEnabled = new BehaviorSubject<boolean>(true);
  
  constructor() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      // Web Audio API is not supported in this browser
    }
  }

  /**
   * Play a notification sound for new bids
   */
  playBidNotification(): void {
    if (!this.soundEnabled.value) {
      return;
    }
    
    if (!this.audioContext) {
      return;
    }
    
    try {
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
      
      // Start and stop oscillator
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      // Error playing bid notification sound
    }
  }
  
  /**
   * Enable or disable sounds
   */
  setSoundEnabled(enabled: boolean): void {
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