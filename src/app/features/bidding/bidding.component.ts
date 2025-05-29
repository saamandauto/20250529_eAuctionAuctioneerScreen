import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BidControlsComponent } from '../../components/bid-controls/bid-controls.component';
import { AuctionService } from '../../services/auction.service';
import { Bid, Dealer, LotDetails } from '../../models/interfaces';
import { getDealerName, getDealerId } from '../../utils/dealer-utils';
import { LotStatus } from '../../models/enums';

@Component({
  selector: 'app-bidding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BidControlsComponent
  ],
  templateUrl: './bidding.component.html',
  styleUrls: ['./bidding.component.scss']
})
export class BiddingComponent {
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

  @Output() bidPlaced = new EventEmitter<Bid>();
  @Output() askingPriceChanged = new EventEmitter<number>();
  @Output() bidIncrementChanged = new EventEmitter<number>();
  @Output() auctioneerBidCountChanged = new EventEmitter<void>();

  constructor(private auctionService: AuctionService) {}

  onSetAskingPrice(newPrice: number) {
    if (newPrice > (this.currentHighestBid || 0)) {
      this.askingPriceChanged.emit(newPrice);
    }
  }

  onAdjustBidIncrement(amount: number) {
    this.bidIncrementChanged.emit(amount);
  }

  onMakeNewHighBid() {
    // Ensure newBidAmount is at least the asking price
    if (this.newBidAmount >= this.askingPrice) {
      this.onPlaceBid('high');
      this.auctioneerBidCountChanged.emit();
    }
  }

  onPlaceBid(type: string) {
    let dealer: Dealer;
    let bidType: string;
    let isAuctioneerBid = false;
    
    if (type === 'user1') {
      dealer = this.dealers.find(d => d.TYPE === 'Bid User 1')!;
      bidType = 'BID1';
      isAuctioneerBid = true;
    } else if (type === 'user2') {
      dealer = this.dealers.find(d => d.TYPE === 'Bid User 2')!;
      bidType = 'BID2';
      isAuctioneerBid = true;
    } else if (type === 'random') {
      const availableDealers = this.dealers.filter(d => d.TYPE !== 'Bid User 1' && d.TYPE !== 'Bid User 2');
      dealer = availableDealers[Math.floor(Math.random() * availableDealers.length)];
      bidType = 'BID1'; // Mark random bids as user bids to highlight them
      isAuctioneerBid = true;
    } else if (type === 'high') {
      dealer = this.dealers.find(d => d.TYPE === 'Bid User 1')!;
      bidType = 'BID1';
      isAuctioneerBid = true;
    } else {
      const availableDealers = this.dealers.filter(d => d.TYPE !== 'Bid User 1' && d.TYPE !== 'Bid User 2');
      dealer = availableDealers[Math.floor(Math.random() * availableDealers.length)];
      bidType = 'STANDARD';
    }
    
    const time = this.auctionService.getCurrentTime();
    
    let amount: number;
    switch (type) {
      case 'high':
        // Ensure bid amount is at least the asking price
        amount = Math.max(this.newBidAmount, this.askingPrice);
        break;
      default:
        // Use the asking price or increment from highest bid (whichever is higher)
        amount = Math.max(
          (this.currentHighestBid || 0) + this.bidIncrement, 
          this.askingPrice
        );
    }

    // Get dealer name and ID in format compatible with Bid interface
    const dealerName = getDealerName(dealer);
    const dealerId = getDealerId(dealer);
    const dealerType = dealer.TYPE ?? 'STANDARD';

    const bid: Bid = {
      bidder: dealerName,
      bidderId: dealerId,
      amount,
      time,
      type: dealerType,
      bidType,
      companyName: dealer.companyName,
      companyType: dealer.companyType,
      city: dealer.city,
      country: dealer.country
    };

    this.bidPlaced.emit(bid);

    if (isAuctioneerBid) {
      this.auctioneerBidCountChanged.emit();
    }
  }

  onStartBidWar() {
    const bidUser1 = this.dealers.find(d => d.TYPE === 'Bid User 1')!;
    const bidUser2 = this.dealers.find(d => d.TYPE === 'Bid User 2')!;
    
    // Calculate first bid amount - use asking price as minimum
    const amount1 = Math.max(
      (this.currentHighestBid || 0) + this.bidIncrement,
      this.askingPrice
    );
    
    const time1 = this.auctionService.getCurrentTime();
    
    // Get bidUser1 data in format compatible with Bid interface
    const bidUser1Name = getDealerName(bidUser1);
    const bidUser1Id = getDealerId(bidUser1);
    const bidUser1Type = bidUser1.TYPE ?? 'STANDARD';
    
    const bid1: Bid = {
      bidder: bidUser1Name,
      bidderId: bidUser1Id,
      amount: amount1,
      time: time1,
      type: bidUser1Type,
      bidType: 'WAR',
      companyName: bidUser1.companyName,
      companyType: bidUser1.companyType,
      city: bidUser1.city,
      country: bidUser1.country
    };
    
    this.bidPlaced.emit(bid1);
    this.auctioneerBidCountChanged.emit();
    
    setTimeout(() => {
      const time2 = this.auctionService.getCurrentTime();
      const amount2 = amount1 + this.bidIncrement;
      
      // Get bidUser2 data in format compatible with Bid interface
      const bidUser2Name = getDealerName(bidUser2);
      const bidUser2Id = getDealerId(bidUser2);
      const bidUser2Type = bidUser2.TYPE ?? 'STANDARD';
      
      const bid2: Bid = {
        bidder: bidUser2Name,
        bidderId: bidUser2Id,
        amount: amount2,
        time: time2,
        type: bidUser2Type,
        bidType: 'WAR',
        companyName: bidUser2.companyName,
        companyType: bidUser2.companyType,
        city: bidUser2.city,
        country: bidUser2.country
      };
      
      this.bidPlaced.emit(bid2);
      this.auctioneerBidCountChanged.emit();
    }, 1000);
  }

}