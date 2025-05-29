import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuctionDetailsComponent } from '../../components/auction-details/auction-details.component';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { AuctionStateService } from '../../state/auction.state.service';

@Component({
  selector: 'app-auction-details-feature',
  standalone: true,
  imports: [
    CommonModule,
    AuctionDetailsComponent
  ],
  templateUrl: './auction-details.component.html',
  styleUrls: ['./auction-details.component.scss']
})
export class AuctionDetailsFeatureComponent implements OnChanges {
  @Input() soldLots = 0;
  @Input() withdrawnLots = 0;
  @Input() totalBids = 0;
  @Input() auctioneerBids = 0;
  @Input() dealerBids = 0;
  @Input() totalSoldValue = 0;
  @Input() totalReserveValue = 0;
  
  // Stats observable for the template
  private stats$ = new BehaviorSubject<{
    soldLots: number;
    withdrawnLots: number;
    totalBids: number;
    auctioneerBids: number;
    dealerBids: number;
    totalSoldValue: number;
    totalReserveValue: number;
  }>({
    soldLots: 0,
    withdrawnLots: 0,
    totalBids: 0,
    auctioneerBids: 0,
    dealerBids: 0,
    totalSoldValue: 0,
    totalReserveValue: 0
  });

  // Performance observable for the template
  performance$ = this.stats$.pipe(
    map(stats => this.calculatePerformance(stats))
  );

  constructor(public auctionState: AuctionStateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Update stats when inputs change
    this.stats$.next({
      soldLots: this.soldLots,
      withdrawnLots: this.withdrawnLots,
      totalBids: this.totalBids,
      auctioneerBids: this.auctioneerBids,
      dealerBids: this.dealerBids,
      totalSoldValue: this.totalSoldValue,
      totalReserveValue: this.totalReserveValue
    });
  }

  private calculatePerformance(stats: any) {
    if (stats.soldLots === 0) {
      return { sum: '-', percentage: '-' };
    }

    const formattedSum = `£${stats.totalSoldValue.toLocaleString()}`;
    const percentage = ((stats.totalSoldValue / stats.totalReserveValue - 1) * 100).toFixed(2);
    
    return {
      sum: formattedSum,
      percentage: `${percentage}%`
    };
  }
}