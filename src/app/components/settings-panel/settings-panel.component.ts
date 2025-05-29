import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';
import { VoiceService } from '../../services/voice.service';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { SoundService } from '../../services/sound.service';
import { AuctionStateService } from '../../auction/auction-state.service';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.scss']
})
export class SettingsPanelComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  
  showShortcutsInUI = false;
  voiceEnabled = false;
  soundEnabled = true;
  simulatedBiddingEnabled = false;
  skipConfirmations = false;
  speechRecognitionSensitivity = 0.5;
  activeTab = 'general';
  availableVoices = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Daniel (UK Male)' },
    { id: 'AZnz4mQRbjc5FGsdAnNL', name: 'Sarah (UK Female)' }
  ]; 
  selectedVoice = '21m00Tcm4TlvDq8ikWAM';
  
  constructor(
    private keyboardShortcutService: KeyboardShortcutService,
    private voiceService: VoiceService,
    private speechRecognitionService: SpeechRecognitionService,
    private soundService: SoundService,
    private auctionState: AuctionStateService
  ) {
    this.keyboardShortcutService.getShowShortcutsInUI().subscribe(
      show => this.showShortcutsInUI = show
    );
    
    this.voiceService.getVoiceEnabled().subscribe(
      enabled => this.voiceEnabled = enabled
    );
    
    this.soundService.getSoundEnabled().subscribe(
      enabled => this.soundEnabled = enabled
    );
    
    this.auctionState.getSimulatedBiddingEnabledObservable().subscribe(
      enabled => this.simulatedBiddingEnabled = enabled
    );
    
    this.auctionState.getSkipConfirmationsObservable().subscribe(
      skip => this.skipConfirmations = skip
    );
  }
  
  onToggleShowShortcuts() {
    this.keyboardShortcutService.setShowShortcutsInUI(this.showShortcutsInUI);
  }
  
  onToggleVoice() {
    this.voiceService.toggleVoice();
  }
  
  onToggleSound() {
    this.soundService.setSoundEnabled(this.soundEnabled);
  }
  
  onToggleSimulatedBidding() {
    this.auctionState.setSimulatedBiddingEnabled(this.simulatedBiddingEnabled);
  }
  
  onToggleSkipConfirmations() {
    this.auctionState.setSkipConfirmations(this.skipConfirmations);
  }
  
  onSpeechRecognitionSensitivityChanged() {
    this.speechRecognitionService.setSensitivity(this.speechRecognitionSensitivity);
  }
  
  onSelectedVoiceChanged() {
    this.voiceService.setSelectedVoice(this.selectedVoice);
  }
  
  onClose() {
    this.close.emit();
  }
}