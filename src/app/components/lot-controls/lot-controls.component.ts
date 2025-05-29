import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotStatus, HammerState } from '../../models/enums';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';
import { Bid, LotDetails } from '../../models/interfaces';

enum HammerSequenceState {
  IDLE = 'IDLE',
  GOING_ONCE = 'GOING_ONCE',
  GOING_TWICE = 'GOING_TWICE',
  SOLD = 'SOLD'
}

@Component({
  selector: 'app-lot-controls',
  standalone: true,
  imports: [CommonModule, ConfirmationDialogComponent],
  templateUrl: './lot-controls.component.html',
  styleUrls: ['./lot-controls.component.scss']
})
export class LotControlsComponent {
  @Input() lotStatus: LotStatus = LotStatus.PENDING;
  @Input() hammerState: HammerState = HammerState.ACCEPTING_BIDS;
  @Input() canControlLot = false;
  @Input() canUseHammer = false;
  @Input() hasBids = false;
  @Input() skipConfirmations = false;
  @Input() currentLot: LotDetails | null = null;
  @Input() currentHighestBid: number | null = null;
  @Input() highestBid: Bid | null = null;

  @Output() startLot = new EventEmitter<void>();
  @Output() moveLot = new EventEmitter<void>();
  @Output() noSale = new EventEmitter<void>();
  @Output() withdrawLot = new EventEmitter<void>();
  @Output() markAsSold = new EventEmitter<void>();
  @Output() progressHammerState = new EventEmitter<void>();

  LotStatus = LotStatus;
  HammerState = HammerState;
  
  // Animation and status variables
  protected dots = '';
  private animationTimer: number | null = null;
  private hammerSequenceState: HammerSequenceState = HammerSequenceState.IDLE;
  
  // Withdraw countdown state
  withdrawCountdownActive = false;
  withdrawCountdownValue = 5;
  private withdrawCountdownTimer: number | null = null;
  
  // Confirmation dialog state
  showConfirmationDialog = false;
  confirmationDialogTitle = '';
  confirmationDialogMessage = '';
  confirmationDialogContext = '';
  confirmationAction: 'noSale' | 'withdrawLot' | 'markAsSold' | null = null;
  
  showShortcutsInUI = false;

  constructor(private keyboardShortcutService: KeyboardShortcutService) {
    this.keyboardShortcutService.getShowShortcutsInUI().subscribe(show => {
      this.showShortcutsInUI = show;
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // ALT+X - Start Lot (if pending) or Move Lot (if in sold state)
    if (this.keyboardShortcutService.isShortcutMatch(event, 'x')) {
      if (this.lotStatus === LotStatus.PENDING) {
        this.onStartLot();
      } else if (this.lotStatus === LotStatus.SOLD || 
                this.lotStatus === LotStatus.NO_SALE || 
                this.lotStatus === LotStatus.WITHDRAWN) {
        this.onMoveLot();
      }
      event.preventDefault();
    }

    // ALT+H - Hammer
    if (this.keyboardShortcutService.isShortcutMatch(event, 'h')) {
      if (this.canUseHammer && this.lotStatus === LotStatus.ACTIVE && !this.isHammerSequenceInProgress() && this.hasBids && !this.withdrawCountdownActive) {
        this.startHammerSequence();
        event.preventDefault();
      }
    }
  }

  get statusText(): string {
    if (this.lotStatus === LotStatus.SOLD) {
      return 'Lot has been sold';
    } else if (this.lotStatus === LotStatus.NO_SALE) {
      return 'Lot was not sold';
    } else if (this.lotStatus === LotStatus.WITHDRAWN) {
      return 'Lot has been withdrawn';
    } else if (this.lotStatus === LotStatus.ACTIVE) {
      if (this.withdrawCountdownActive) {
        return `Withdrawing lot in ${this.withdrawCountdownValue}`;
      }
      
      // During hammer sequence, show appropriate text
      if (this.hammerSequenceState === HammerSequenceState.GOING_ONCE) {
        return 'Going once';
      } else if (this.hammerSequenceState === HammerSequenceState.GOING_TWICE) {
        return 'Going twice';
      } else {
        return this.hammerState;
      }
    }
    return '';
  }

  get timerClass(): string {
    switch (this.lotStatus) {
      case LotStatus.ACTIVE:
        return this.withdrawCountdownActive ? 'withdrawn' : 'active';
      case LotStatus.SOLD:
        return 'sold';
      case LotStatus.NO_SALE:
        return 'no-sale';
      case LotStatus.WITHDRAWN:
        return 'withdrawn';
      default:
        return '';
    }
  }

  onStartLot() {
    this.startLot.emit();
  }

  onMoveLot() {
    this.moveLot.emit();
  }

  onNoSale() {
    if (this.skipConfirmations) {
      this.noSale.emit();
    } else {
      this.showConfirmation(
        'Confirm No Sale', 
        'Are you sure you want to mark this lot as No Sale?', 
        'noSale'
      );
    }
  }

  onWithdrawLot() {
    if (this.withdrawCountdownActive) {
      // Cancel the withdrawal if it's in progress
      this.cancelWithdrawalCountdown();
    } else {
      // Start withdrawal countdown
      this.startWithdrawalCountdown();
    }
  }

  startWithdrawalCountdown() {
    if (this.withdrawCountdownActive) return;
    this.withdrawCountdownActive = true;
    this.withdrawCountdownValue = 5;
    
    // Start animation
    this.startDotAnimation(true);

    // Start countdown
    this.withdrawCountdownTimer = window.setTimeout(() => this.updateWithdrawCountdown(), 1000);
  }

  private updateWithdrawCountdown() {
    if (this.withdrawCountdownValue > 1) {
      this.withdrawCountdownValue--;
      this.withdrawCountdownTimer = window.setTimeout(() => this.updateWithdrawCountdown(), 1000);
    } else {
      // When countdown reaches 0, execute withdrawal
      this.executeWithdrawal();
    }
  }

  cancelWithdrawalCountdown() {
    if (this.withdrawCountdownTimer !== null) {
      clearTimeout(this.withdrawCountdownTimer);
      this.withdrawCountdownTimer = null;
    }
    this.stopDotAnimation();
    this.withdrawCountdownActive = false;
  }

  executeWithdrawal() {
    this.cancelWithdrawalCountdown(); // Clean up timers
    this.withdrawLot.emit();
  }

  onMarkAsSold() {
    if (this.skipConfirmations) {
      this.markAsSold.emit();
    } else {
      this.showConfirmation(
        'Confirm Sale', 
        'Are you sure you want to mark this lot as Sold?', 
        'markAsSold'
      );
    }
  }

  showConfirmation(title: string, message: string, action: 'noSale' | 'withdrawLot' | 'markAsSold') {
    this.confirmationDialogTitle = title;
    this.confirmationDialogMessage = message;
    this.confirmationAction = action;
    
    // Add context information based on action
    this.confirmationDialogContext = this.getContextForAction(action);
    
    this.showConfirmationDialog = true;
  }
  
  private getContextForAction(action: 'noSale' | 'withdrawLot' | 'markAsSold'): string {
    if (!this.currentLot) return '';
    
    const reservePrice = this.currentLot.reservePrice;
    const bidderName = this.highestBid?.bidder || 'Unknown bidder';
    const bidAmount = this.currentHighestBid || 0;
    const difference = bidAmount - reservePrice;
    const diffText = difference >= 0 ? 
      `£${difference} above` : 
      `£${Math.abs(difference)} below`;
    
    switch (action) {
      case 'noSale':
        if (!this.hasBids) return 'No bids have been placed on this lot.';
        return `The current highest bid is from ${bidderName} with a bid of £${bidAmount}. That is ${diffText} the reserve price.`;
      
      case 'withdrawLot':
        return `This lot will be removed from the auction and marked as withdrawn.`;
      
      case 'markAsSold':
        return `This lot will be sold to ${bidderName} for £${bidAmount}, which is ${diffText} the reserve price of £${reservePrice}.`;
      
      default:
        return '';
    }
  }

  handleConfirm() {
    switch (this.confirmationAction) {
      case 'noSale':
        this.noSale.emit();
        break;
      case 'withdrawLot':
        this.withdrawLot.emit();
        break;
      case 'markAsSold':
        this.markAsSold.emit();
        break;
    }
    this.closeConfirmationDialog();
  }

  closeConfirmationDialog() {
    this.showConfirmationDialog = false;
    this.confirmationAction = null;
  }

  // Improved hammer sequence logic
  startHammerSequence() {
    if (this.isHammerSequenceInProgress()) return;
    
    // Set initial state
    this.hammerSequenceState = HammerSequenceState.GOING_ONCE;
    
    // Emit the event to change state
    this.progressHammerState.emit();
    
    // Start animation
    this.startDotAnimation();
    
    // Schedule the next state transition
    this.animationTimer = window.setTimeout(() => this.advanceHammerSequence(), 3000);
  }
  
  private advanceHammerSequence() {
    // Clear any existing timer
    this.stopDotAnimation();
    
    if (this.hammerSequenceState === HammerSequenceState.GOING_ONCE) {
      // Transition to "Going twice"
      this.hammerSequenceState = HammerSequenceState.GOING_TWICE;
      this.progressHammerState.emit();
      
      // Start animation for this state
      this.startDotAnimation();
      
      // Schedule the next state transition
      this.animationTimer = window.setTimeout(() => this.advanceHammerSequence(), 3000);
    } 
    else if (this.hammerSequenceState === HammerSequenceState.GOING_TWICE) {
      // Transition to "Sold"
      this.hammerSequenceState = HammerSequenceState.SOLD;
      this.progressHammerState.emit();
      
      // Reset state after completed
      this.resetHammerSequence();
    }
  }

  // Method to reset the hammer sequence when a new bid comes in
  resetHammerSequence() {
    this.stopDotAnimation();
    this.hammerSequenceState = HammerSequenceState.IDLE;
  }
  
  // Check if a hammer sequence is currently in progress
  isHammerSequenceInProgress(): boolean {
    return this.hammerSequenceState !== HammerSequenceState.IDLE;
  }

  // Method to also cancel withdraw countdown if new bids come in
  cancelWithdrawOnNewBid() {
    if (this.withdrawCountdownActive) {
      this.cancelWithdrawalCountdown();
    }
  }

  // Improved animation logic that handles both dots for hammer and withdraw
  private startDotAnimation(isWithdraw = false) {
    // Stop any existing animation first
    this.stopDotAnimation();
    
    // Reset dots
    this.dots = '';
    
    // Start a new animation timer that adds dots at 1-second intervals
    const addDot = () => {
      if (this.dots.length < 3) {
        this.dots += '.';
        this.animationTimer = window.setTimeout(addDot, 1000);
      }
    };
    
    // Start the animation
    addDot();
  }

  private stopDotAnimation() {
    if (this.animationTimer !== null) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
      this.dots = '';
    }
  }

  ngOnDestroy() {
    // Clean up all timers
    this.stopDotAnimation();
    this.cancelWithdrawalCountdown();
  }
}