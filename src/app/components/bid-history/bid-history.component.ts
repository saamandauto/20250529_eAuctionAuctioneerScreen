import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Bid } from '../../models/interfaces';

@Component({
  selector: 'app-bid-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bid-history.component.html',
  styleUrls: ['./bid-history.component.scss']
})
export class BidHistoryComponent {
  @Input() bids: Bid[] = [];
  expanded = false;

  get displayedBids(): Bid[] {
    return this.expanded ? this.bids : this.bids.slice(0, 10);
  }

  get emptyRows(): number[] {
    const currentRows = this.displayedBids.length;
    const minRows = this.expanded ? 0 : 10;
    return currentRows < minRows ? Array(minRows - currentRows).fill(0) : [];
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
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