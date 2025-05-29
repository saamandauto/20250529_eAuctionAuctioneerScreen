import { Injectable } from '@angular/core';
import { Subject, Subscription, timer } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Dealer, Bid, LotDetails } from '../models/interfaces';
import { AuctionService } from './auction.service';
import { SoundService } from './sound.service';

@Injectable({
  providedIn: 'root'
})
export class BiddingService {
  private biddingEnabled = false;
  private currentBidding$: Subscription | null = null;
  private bidSubject = new Subject<Bid>();
  
  // Track current state
  private currentBidAmount = 0;
  private currentBidIncrement = 0;
  private currentReservePrice = 0;
  private currentAskingPrice = 0;
  private availableDealers: Dealer[] = [];
  private totalSimulatedBids = 0; // Track total simulated bids across all lots

  constructor(
    private auctionService: AuctionService,
    private soundService: SoundService
  ) {
    console.log('BiddingService initialized');
  }

  getBids() {
    return this.bidSubject.asObservable();
  }

  startSimulation(
    dealers: Dealer[],
    currentHighestBid: number,
    bidIncrement: number,
    reservePrice: number,
    askingPrice?: number
  ) {
    console.log('startSimulation called with:', {
      biddingEnabled: this.biddingEnabled,
      dealersCount: dealers.length,
      currentHighestBid,
      bidIncrement,
      reservePrice,
      askingPrice
    });
    
    if (!this.biddingEnabled) {
      console.log('Bidding not enabled, cannot start simulation');
      return;
    }
    
    // Stop any existing simulation
    this.stopSimulation();

    // Initialize state
    this.currentBidAmount = currentHighestBid;
    this.currentBidIncrement = bidIncrement;
    this.currentReservePrice = reservePrice;
    this.currentAskingPrice = askingPrice || currentHighestBid + bidIncrement;
    
    // Filter out bid users
    this.availableDealers = dealers.filter(d => d.TYPE !== 'Bid User 1' && d.TYPE !== 'Bid User 2');
    
    console.log(`Filtered dealers for simulation: ${this.availableDealers.length} available`);
    
    if (this.availableDealers.length === 0) {
      console.warn('No available dealers for bidding simulation!');
      return;
    }

    // Create a timer that starts immediately (0) and repeats every 1-3 seconds
    this.currentBidding$ = timer(0, this.getRandomInterval()).pipe(
      filter(() => {
        const shouldContinue = this.shouldContinueBidding();
        console.log(`Should continue bidding? ${shouldContinue}`, {
          enabled: this.biddingEnabled,
          currentBid: this.currentBidAmount,
          askingPrice: this.currentAskingPrice,
          reserveLimit: this.currentReservePrice * 1.1
        });
        return shouldContinue;
      })
    ).subscribe(() => {
      console.log('Generating a new bid');
      this.generateNewBid();
    });
    
    console.log('Bidding simulation started');
  }

  stopSimulation() {
    if (this.currentBidding$) {
      console.log('Stopping existing bid simulation');
      this.currentBidding$.unsubscribe();
      this.currentBidding$ = null;
    }
  }

  setEnabled(enabled: boolean) {
    console.log(`Setting bidding simulation enabled: ${enabled}`);
    this.biddingEnabled = enabled;
    if (!enabled) {
      this.stopSimulation();
    }
  }
  
  // Update the asking price for simulation
  updateAskingPrice(newAskingPrice: number) {
    console.log('Updating asking price for simulation:', newAskingPrice);
    this.currentAskingPrice = newAskingPrice;
  }

  private shouldContinueBidding(): boolean {
    // Continue bidding if enabled and current bid is less than 110% of reserve price
    return this.biddingEnabled && 
           this.currentBidAmount < (this.currentReservePrice * 1.1);
  }

  private getRandomInterval(): number {
    // Random interval between 250ms and 2000ms
    return Math.floor(Math.random() * 1750) + 250;
  }

  private generateNewBid() {
    if (!this.availableDealers.length) {
      console.warn('No available dealers to generate bids');
      return;
    }

    // Get a random dealer
    const randomIndex = Math.floor(Math.random() * this.availableDealers.length);
    const randomDealer = this.availableDealers[randomIndex];
    
    // Calculate new bid amount - ensure it's at least the asking price
    const newBidAmount = Math.max(
      this.currentBidAmount + this.currentBidIncrement,
      this.currentAskingPrice
    );
    
    // Get the dealer's name and ID
    const dealerName = `${randomDealer.FIRSTNAME || ''} ${randomDealer.LASTNAME || ''}`.trim();
    const dealerId = (randomDealer.USR_ID ? randomDealer.USR_ID.toString() : '') || 
                    (randomDealer.ID ? randomDealer.ID.toString() : '');
    const dealerType = randomDealer.TYPE ?? 'STANDARD';
    
    const bid: Bid = {
      bidder: dealerName,
      bidderId: dealerId,
      amount: newBidAmount,
      time: this.auctionService.getCurrentTime(),
      type: dealerType,
      bidType: 'SIMULATED',
      companyName: randomDealer.companyName,
      companyType: randomDealer.companyType,
      city: randomDealer.city,
      country: randomDealer.country
    };

    console.log(`Generated new bid: ${bid.bidder} - €${bid.amount}`);

    // Update current bid amount
    this.currentBidAmount = newBidAmount;
    
    // Increment total simulated bids counter
    this.totalSimulatedBids++;
    
    // Emit the new bid
    this.bidSubject.next(bid);
  }
}