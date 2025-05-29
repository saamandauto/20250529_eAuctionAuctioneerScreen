import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auction-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auction-details.component.html',
  styleUrls: ['./auction-details.component.scss']
})
export class AuctionDetailsComponent {
  @Input() soldLots = 0;
  @Input() withdrawnLots = 0;
  @Input() totalBids = 0;
  @Input() auctioneerBids = 0;
  @Input() dealerBids = 0; // New input for dealer bids
  @Input() totalSoldValue = 0;
  @Input() totalReserveValue = 0;
  @Input() performance: { sum: string, percentage: string } = { sum: '-', percentage: '-' };
}