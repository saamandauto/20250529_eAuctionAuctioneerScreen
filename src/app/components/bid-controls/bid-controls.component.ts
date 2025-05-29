import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotStatus } from '../../models/enums';
import { Bid, Dealer, LotDetails } from '../../models/interfaces';
import { KeyboardShortcutService } from '../../services/keyboard-shortcut.service';

@Component({
  selector: 'app-bid-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bid-controls.component.html',
  styleUrls: ['./bid-controls.component.scss']
})
export class BidControlsComponent {
  @Input() canControlLot = false;
  @Input() startPrice = 0;
  @Input() currentHighestBid: number | null = null;
  @Input() askingPrice = 0;
  @Input() bidIncrement = 500;
  @Input() newBidAmount = 0;
  @Input() lotStatus: LotStatus = LotStatus.PENDING;
  @Input() currentLot: LotDetails | null = null;
  @Input() dealers: Dealer[] = [];
  @Input() bids: Bid[] = [];
  @Input() simulatedBiddingEnabled = false;

  @Output() setAskingPrice = new EventEmitter<number>();
  @Output() adjustBidIncrement = new EventEmitter<number>();
  @Output() makeNewHighBid = new EventEmitter<void>();
  @Output() placeBid = new EventEmitter<string>();
  @Output() startBidWar = new EventEmitter<void>();

  LotStatus = LotStatus;
  userInputModified = false;
  localAskingPrice = 0;
  showShortcutsInUI = false;

  constructor(private keyboardShortcutService: KeyboardShortcutService) {
    this.keyboardShortcutService.getShowShortcutsInUI().subscribe(show => {
      this.showShortcutsInUI = show;
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Only process shortcuts if lot is active and control is enabled
    if (this.isActive && this.canControlLot) {
      // ALT+1 - Bid User 1
      if (this.keyboardShortcutService.isShortcutMatch(event, '1')) {
        this.onPlaceBid('user1');
        event.preventDefault();
      }
      
      // ALT+2 - Bid User 2
      else if (this.keyboardShortcutService.isShortcutMatch(event, '2')) {
        this.onPlaceBid('user2');
        event.preventDefault();
      }
      
      // ALT+R - Random Bid
      else if (this.keyboardShortcutService.isShortcutMatch(event, 'r')) {
        this.onPlaceBid('random');
        event.preventDefault();
      }
      
      // ALT+W - Bid War
      else if (this.keyboardShortcutService.isShortcutMatch(event, 'w')) {
        this.onStartBidWar();
        event.preventDefault();
      }
    }
  }

  get isActive(): boolean {
    return this.lotStatus === LotStatus.ACTIVE;
  }

  get isAboveReserve(): boolean {
    return !!this.currentHighestBid && 
          !!this.currentLot?.reservePrice && 
          this.currentHighestBid >= this.currentLot.reservePrice;
  }

  get minBidAmount(): number {
    // Use asking price as the minimum bid amount
    return this.askingPrice;
  }

  ngOnChanges() {
    // Initialize localAskingPrice when askingPrice changes
    if (!this.userInputModified) {
      this.localAskingPrice = this.askingPrice;
      this.newBidAmount = this.askingPrice;
    }
  }

  onSetAskingPrice() {
    if (this.localAskingPrice > (this.currentHighestBid || 0)) {
      this.setAskingPrice.emit(this.localAskingPrice);
      this.userInputModified = false;
    }
  }

  onAskingPriceInput() {
    this.userInputModified = true;
  }

  onAdjustBidIncrement(amount: number) {
    this.adjustBidIncrement.emit(amount > 0 ? 100 : -100);
  }

  onMakeNewHighBid() {
    if (this.newBidAmount >= this.askingPrice) {
      this.makeNewHighBid.emit();
      this.userInputModified = false;
    }
  }

  onPlaceBid(type: string) {
    this.placeBid.emit(type);
    this.userInputModified = false;
  }

  onStartBidWar() {
    this.startBidWar.emit();
  }

  onBidAmountInput() {
    this.userInputModified = true;
  }

  onBidAmountKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      
      const direction = event.key === 'ArrowUp' ? 1 : -1;
      const newAmount = this.newBidAmount + (this.bidIncrement * direction);
      
      if (newAmount >= this.minBidAmount) {
        this.newBidAmount = newAmount;
        this.userInputModified = true;
      }
    }
  }
}