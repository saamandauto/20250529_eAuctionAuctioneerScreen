import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoiceService } from '../../services/voice.service';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() auctionTitle = '';
  @Input() currentDateTime: string = '';
  @Input() isAuctionStarted: boolean = false;
  @Input() isViewingLots: boolean = true;
  @Input() simulatedBiddingEnabled: boolean = false;

  @Output() startAuction = new EventEmitter<void>();
  @Output() endAuction = new EventEmitter<void>();
  @Output() toggleView = new EventEmitter<void>();
  @Output() toggleSimulatedBidding = new EventEmitter<boolean>();
  @Output() openSettings = new EventEmitter<void>();

  voiceEnabled = false;
  hasCreditsError = false;
  isListening = false;
  showShortcutsInUI = false;
  
  get isListeningValue(): boolean {
    return this.isListening;
  }
  
  private voiceSubscription: Subscription | null = null;
  private creditsErrorSubscription: Subscription | null = null;
  private isListeningSubscription: Subscription | null = null;
  private commandDetectedSubscription: Subscription | null = null;
  private shortcutsSubscription: Subscription | null = null;

  constructor(
    private voiceService: VoiceService,
    private speechRecognitionService: SpeechRecognitionService,
    private keyboardShortcutService: KeyboardShortcutService
  ) {}

  ngOnInit() {
    this.voiceSubscription = this.voiceService.getVoiceEnabled().subscribe(
      enabled => this.voiceEnabled = enabled
    );
    
    this.creditsErrorSubscription = this.voiceService.getHasCreditsError().subscribe(
      hasError => this.hasCreditsError = hasError
    );
    
    this.isListeningSubscription = this.speechRecognitionService.getIsListening().subscribe(
      isListening => this.isListening = isListening
    );
    
    this.commandDetectedSubscription = this.speechRecognitionService.getCommandDetected().subscribe(
      command => {
        if (command === 'start auction' && !this.isAuctionStarted) {
          this.onStartAuction();
        } else if (command === 'end auction' && this.isAuctionStarted) {
          this.onEndAuction();
        } else if (command === 'toggle simulation' || command === 'start simulation' || command === 'stop simulation') {
          this.onToggleSimulatedBidding();
        }
      }
    );

    this.shortcutsSubscription = this.keyboardShortcutService.getShowShortcutsInUI().subscribe(
      show => this.showShortcutsInUI = show
    );
  }

  ngOnDestroy() {
    if (this.voiceSubscription) {
      this.voiceSubscription.unsubscribe();
    }
    
    if (this.creditsErrorSubscription) {
      this.creditsErrorSubscription.unsubscribe();
    }
    
    if (this.isListeningSubscription) {
      this.isListeningSubscription.unsubscribe();
    }
    
    if (this.commandDetectedSubscription) {
      this.commandDetectedSubscription.unsubscribe();
    }

    if (this.shortcutsSubscription) {
      this.shortcutsSubscription.unsubscribe();
    }
  }

  onStartAuction() {
    this.startAuction.emit();
    if (this.voiceEnabled && !this.hasCreditsError) {
      this.voiceService.speak('Auction started.');
    }
  }

  onEndAuction() {
    this.endAuction.emit();
    if (this.voiceEnabled && !this.hasCreditsError) {
      this.voiceService.speak('Auction ended.');
    }
  }
  
  onToggleView() {
    console.log('Header component - toggle view called, current state:', this.isViewingLots);
    this.toggleView.emit();
    if (this.voiceEnabled && !this.hasCreditsError) {
      const message = this.isViewingLots ? 
        'Viewing auction interface.' : 
        'Viewing planned lots.';
      this.voiceService.speak(message);
    }
  }

  onToggleSimulatedBidding() {
    console.log('Header component - toggle simulated bidding called');
    console.log('Current simulatedBiddingEnabled state:', this.simulatedBiddingEnabled);
    
    // Emit the boolean value directly without double negation
    this.toggleSimulatedBidding.emit(this.simulatedBiddingEnabled);
    // Removed speech for simulation toggle
  }

  toggleVoice() {
    this.voiceService.toggleVoice();
  }
  
  toggleSpeechRecognition() {
    this.speechRecognitionService.toggleListening();
  }

  onToggleShowShortcuts() {
    this.keyboardShortcutService.setShowShortcutsInUI(this.showShortcutsInUI);
  }

  onOpenSettings() {
    this.openSettings.emit();
  }
}