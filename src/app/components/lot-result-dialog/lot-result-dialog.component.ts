import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotDetails, Bid } from '../../models/interfaces';

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
}