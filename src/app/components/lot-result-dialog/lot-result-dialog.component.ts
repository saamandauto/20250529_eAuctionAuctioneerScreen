import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotDetails, Bid } from '../../models/interfaces';
import { LotStatus } from '../../models/enums';

@Component({
  selector: 'app-lot-result-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lot-result-dialog.component.html',
  styleUrls: ['./lot-result-dialog.component.scss']
})
export class LotResultDialogComponent {
  @Input() isOpen = false;
  @Input() lot: LotDetails | null = null;
  @Input() onClose: () => void = () => {};

  LotStatus = LotStatus; // Make enum available in template

  get finalState() {
    return this.lot?.finalState;
  }

  get bids() {
    return this.finalState?.bids || [];
  }

  getBidderTooltip(bid: Bid): string {
    return `
Bidder: ${bid.bidder}
Company: ${bid.companyName || 'N/A'}
Type: ${bid.companyType || 'N/A'}
Location: ${bid.city || 'N/A'}, ${bid.country || 'N/A'}
ID: ${bid.bidderId}
    `.trim();
  }

  // Helper methods to determine lot status
  isSold(): boolean {
    return this.finalState?.status === LotStatus.SOLD;
  }

  isWithdrawn(): boolean {
    return this.finalState?.status === LotStatus.WITHDRAWN;
  }

  isNoSale(): boolean {
    return this.finalState?.status === LotStatus.NO_SALE;
  }

  // Get highest bid with formatting
  getHighestBid(): string {
    if (this.bids.length === 0) {
      return 'No bids';
    }
    return `£${this.bids[0].amount.toLocaleString()}`;
  }

  // Get CSS class based on status
  getStatusClass(): string {
    if (!this.finalState?.status) return '';
    
    return this.finalState.status.toLowerCase().replace(' ', '_');
  }
}