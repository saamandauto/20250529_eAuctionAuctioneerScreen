import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuctionService } from '../services/auction.service';
import { BiddingService } from '../services/bidding.service';
import { VoiceService } from '../services/voice.service';
import { SoundService } from '../services/sound.service';
import { AuctionStateService } from './auction-state.service';
import { Bid, Dealer, LotDetails, Message } from '../models/interfaces';
import { LotStatus, HammerState } from '../models/enums';
import { updateDealerStatuses } from '../data/mock-dealer-status';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuctionEventService {
  // Track the last time a bid was announced
  private lastBidAnnouncementTime = 0;
  private bidAnnouncementCooldown = 5000; // 5 seconds cooldown between bid announcements
  private hasCreditsError = false;
  
  constructor(
    private auctionService: AuctionService,
    private biddingService: BiddingService,
    private voiceService: VoiceService,
    private soundService: SoundService,
    private toastr: ToastrService,
    private auctionState: AuctionStateService
  ) {
    this.biddingService.getBids().subscribe(bid => {
      this.onBidPlaced(bid);
    });
    
    this.voiceService.getHasCreditsError().subscribe(hasError => {
      this.hasCreditsError = hasError;
    });
    
    // Listen for changes to the simulated bidding setting
    this.auctionState.select('simulatedBiddingEnabled').subscribe(enabled => {
      this.handleSimulatedBiddingToggle(enabled);
    });
  }

  // Handle changes to the simulated bidding setting
  private handleSimulatedBiddingToggle(enabled: boolean) {
    // Tell the bidding service about the change
    this.biddingService.setEnabled(enabled);
    
    if (enabled && 
        this.auctionState.getValue('lotStatus') === LotStatus.ACTIVE && 
        this.auctionState.getValue('currentLot')) {
      
      this.biddingService.startSimulation(
        this.auctionState.getValue('dealers'),
        this.auctionState.getValue('currentHighestBid') || this.auctionState.getValue('startPrice'),
        this.auctionState.getValue('bidIncrement'),
        this.auctionState.getValue('currentLot')!.reservePrice,
        this.auctionState.getValue('askingPrice')
      );
    } else if (!enabled) {
      this.biddingService.stopSimulation();
    }
  }

  startAuction(): void {
    // Use startAuction method instead of setState directly
    this.auctionState.startAuction();
    this.toastr.success('Auction started successfully');
    
    // Enhanced welcome message with auction details
    const activeDealers = this.auctionState.getValue('dealers').filter((d: Dealer) => {
      const type = d.TYPE;
      return type !== 'Bid User 1' && type !== 'Bid User 2';
    });
    
    const welcomeMessage = `Welcome to the auction. We have ${this.auctionState.getValue('lots').length} lots available today and currently we have ${activeDealers.length} active dealers participating.`;
    
    if (!this.hasCreditsError) {
      this.voiceService.speak(welcomeMessage);
    }
  }

  endAuction(): void {
    // Use endAuction method instead of setState directly
    this.auctionState.endAuction();
    this.biddingService.stopSimulation();
    this.toastr.success('Auction ended successfully');
    
    // Enhanced end message with summary using speech-friendly price format
    const soldLots = this.auctionState.getValue('soldLots');
    const totalSoldValue = this.auctionState.getValue('totalSoldValue');
    const soldLotsMessage = soldLots ? 
      `${soldLots} lots were sold for a total of ${this.voiceService.formatPriceForSpeech(totalSoldValue)}.` : 
      'No lots were sold in this session.';
    
    if (!this.hasCreditsError) {
      this.voiceService.speak(`The auction has ended. ${soldLotsMessage} Thank you for participating.`);
    }
  }

  toggleView(): void {
    // Use toggleView method instead of setState directly
    this.auctionState.toggleView();
    
    const isViewingLots = this.auctionState.getValue('isViewingLots');
    if (isViewingLots) {
      this.toastr.info('Viewing planned lots');
    } else {
      this.toastr.info('Viewing auction interface');
    }
  }

  toggleSimulatedBidding(): void {
    const currentValue = this.auctionState.getValue('simulatedBiddingEnabled');
    const simulatedBiddingEnabled = !currentValue;
    
    if (simulatedBiddingEnabled) {
      this.toastr.info('Simulated bidding enabled');
    } else {
      this.toastr.info('Simulated bidding disabled');
    }
    
    this.auctionState.setState({ simulatedBiddingEnabled });
  }
  
  onLotUpdated(update: {lotNumber: number, field: string, value: number}): void {
    const lots = this.auctionState.getValue('lots');
    const lot = lots.find((l: LotDetails) => l.lotNumber === update.lotNumber);
    
    if (lot) {
      const updatedLot = { ...lot };
      
      if (update.field === 'reservePrice') {
        updatedLot.reservePrice = update.value;
        this.auctionState.updateLot(updatedLot);
        this.toastr.success(`Reserve price updated for Lot ${update.lotNumber}`);
        
        if (!this.hasCreditsError) {
          this.voiceService.speak(`Reserve price updated for Lot ${update.lotNumber} to ${this.voiceService.formatPriceForSpeech(update.value)}`);
        }
      } else if (update.field === 'initialAskingPrice') {
        updatedLot.initialAskingPrice = update.value;
        this.auctionState.updateLot(updatedLot);
        this.toastr.success(`Asking price updated for Lot ${update.lotNumber}`);
        
        if (!this.hasCreditsError) {
          this.voiceService.speak(`Asking price updated for Lot ${update.lotNumber} to ${this.voiceService.formatPriceForSpeech(update.value)}`);
        }
      }
    }
  }

  openViewersDialog(): void {
    this.auctionState.setState({ isViewersDialogOpen: true });
  }

  closeViewersDialog(): void {
    this.auctionState.setState({ isViewersDialogOpen: false });
  }

  openWatchersDialog(): void {
    this.auctionState.setState({ isWatchersDialogOpen: true });
  }

  closeWatchersDialog(): void {
    this.auctionState.setState({ isWatchersDialogOpen: false });
  }

  openLeadsDialog(): void {
    this.auctionState.setState({ isLeadsDialogOpen: true });
  }

  closeLeadsDialog(): void {
    this.auctionState.setState({ isLeadsDialogOpen: false });
  }

  openOnlineDialog(): void {
    this.auctionState.setState({ isOnlineDialogOpen: true });
  }

  closeOnlineDialog(): void {
    this.auctionState.setState({ isOnlineDialogOpen: false });
  }

  startLot(): void {
    this.auctionState.setState({
      lotStatus: LotStatus.ACTIVE,
      canUseHammer: false
    });
    
    const currentLot = this.auctionState.getValue('currentLot');
    if (!currentLot) return;
    
    const startPrice = this.auctionState.getValue('startPrice');
    
    // Enhanced lot details announcement with speech-friendly price
    const lotDetails = `Lot ${currentLot.lotNumber} is now active. ${currentLot.year} ${currentLot.make} ${currentLot.model}, ${currentLot.color}, with ${currentLot.mileage} kilometers. Starting price is ${this.voiceService.formatPriceForSpeech(startPrice)}.`;
    
    if (!this.hasCreditsError) {
      this.voiceService.speak(lotDetails);
    }

    // Start simulation if enabled
    if (this.auctionState.getValue('simulatedBiddingEnabled') && currentLot) {
      this.biddingService.startSimulation(
        this.auctionState.getValue('dealers'),
        this.auctionState.getValue('currentHighestBid') || this.auctionState.getValue('startPrice'),
        this.auctionState.getValue('bidIncrement'),
        currentLot.reservePrice,
        this.auctionState.getValue('askingPrice')
      );
    }
  }

  moveLot(): void {
    this.biddingService.stopSimulation();
    
    const lots = this.auctionState.getValue('lots');
    const currentLot = this.auctionState.getValue('currentLot');
    if (!currentLot) return;
    
    const currentIndex = lots.findIndex((lot: LotDetails) => lot.lotNumber === currentLot.lotNumber);
    if (currentIndex < lots.length - 1) {
      const nextLot = lots[currentIndex + 1];
      this.auctionState.setState({ currentLot: nextLot });
      this.auctionState.resetLotState();
      
      // Enhanced next lot announcement
      const nextLotMessage = `Moving to lot ${nextLot.lotNumber}, ${nextLot.year} ${nextLot.make} ${nextLot.model}. This vehicle has ${nextLot.watchers} watchers and ${nextLot.viewers} viewers.`;
      
      if (!this.hasCreditsError) {
        this.voiceService.speak(nextLotMessage);
      }
    }
  }

  noSale(): void {
    this.biddingService.stopSimulation();
    const currentLot = this.auctionState.getValue('currentLot');
    if (currentLot) {
      this.auctionState.setState({
        lotStatus: LotStatus.NO_SALE,
        canControlLot: false,
        canUseHammer: false
      });
      
      if (!this.hasCreditsError) {
        this.voiceService.speak(`Lot ${currentLot.lotNumber} is marked as no sale.`);
      }
    }
  }

  withdrawLot(): void {
    this.biddingService.stopSimulation();
    const currentLot = this.auctionState.getValue('currentLot');
    if (currentLot) {
      this.auctionState.setState({
        lotStatus: LotStatus.WITHDRAWN,
        canControlLot: false,
        canUseHammer: false
      });
      this.auctionState.incrementWithdrawnLots();
      
      if (!this.hasCreditsError) {
        this.voiceService.speak(`Lot ${currentLot.lotNumber} has been withdrawn.`);
      }
    }
  }

  markAsSold(): void {
    this.biddingService.stopSimulation();
    const currentLot = this.auctionState.getValue('currentLot');
    const currentHighestBid = this.auctionState.getValue('currentHighestBid');
    
    if (currentLot && currentHighestBid) {
      const bids = this.auctionState.getValue('bids');
      const winningBid = bids[0];
      
      // Update the lot with final state
      const updatedLot = { 
        ...currentLot, 
        status: LotStatus.SOLD,
        finalState: {
          soldPrice: currentHighestBid,
          reservePrice: currentLot.reservePrice,
          performance: this.getLotPerformance(),
          soldTime: winningBid.time,
          soldTo: winningBid.bidder,
          soldToId: winningBid.bidderId,
          bids: [...bids]
        }
      };
      
      this.auctionState.updateLot(updatedLot);
      this.auctionState.setState({
        lotStatus: LotStatus.SOLD,
        canControlLot: false,
        canUseHammer: false
      });
      this.auctionState.incrementSoldLots();
      this.auctionState.addToTotalSoldValue(currentHighestBid);
      this.auctionState.addToTotalReserveValue(currentLot.reservePrice);
      
      let performanceText = "";
      if (currentHighestBid >= currentLot.reservePrice) {
        const above = currentHighestBid - currentLot.reservePrice;
        performanceText = ` at ${this.voiceService.formatPriceForSpeech(currentHighestBid)}, which is ${this.voiceService.formatPriceForSpeech(above)} above reserve price`;
      } else {
        const below = currentLot.reservePrice - currentHighestBid;
        performanceText = ` at ${this.voiceService.formatPriceForSpeech(currentHighestBid)}, which is ${this.voiceService.formatPriceForSpeech(below)} below reserve price`;
      }
      
      // Enhanced sold announcement with properly formatted prices for speech
      const soldLotsValue = this.auctionState.getValue('soldLots');
      const soldMessage = `Lot ${currentLot.lotNumber}, ${currentLot.year} ${currentLot.make} ${currentLot.model}, sold to ${winningBid.bidder}${performanceText}. This is sale number ${soldLotsValue} today.`;
      
      if (!this.hasCreditsError) {
        this.voiceService.speak(soldMessage);
      }
    }
  }

  progressHammerState(): void {
    const currentHammerState = this.auctionState.getValue('hammerState');
    
    switch (currentHammerState) {
      case HammerState.ACCEPTING_BIDS:
        this.auctionState.setState({ hammerState: HammerState.GOING_ONCE });
        if (!this.hasCreditsError) {
          this.voiceService.speak("Going once!");
        }
        break;
      case HammerState.GOING_ONCE:
        this.auctionState.setState({ hammerState: HammerState.GOING_TWICE });
        if (!this.hasCreditsError) {
          this.voiceService.speak("Going twice!");
        }
        break;
      case HammerState.GOING_TWICE:
        this.auctionState.setState({ hammerState: HammerState.SOLD });
        this.markAsSold();
        break;
    }
  }

  getLotPerformance() {
    const currentLot = this.auctionState.getValue('currentLot');
    if (!currentLot) return { value: 0, text: '-' };
    
    return this.auctionService.calculateLotPerformance(
      this.auctionState.getValue('currentHighestBid'),
      currentLot.reservePrice
    );
  }

  setAskingPrice(newPrice: number): void {
    const currentHighestBid = this.auctionState.getValue('currentHighestBid');
    const currentLot = this.auctionState.getValue('currentLot');
    
    // Check if the bid is already above reserve price
    const isAboveReserve = !!currentHighestBid && 
                          !!currentLot?.reservePrice && 
                          currentHighestBid >= currentLot.reservePrice;
    
    // Don't allow setting asking price if above reserve
    if (isAboveReserve) {
      this.toastr.error('Cannot change asking price when the current bid is above reserve');
      return;
    }
    
    if (newPrice > (currentHighestBid || 0)) {
      this.auctionState.setState({
        askingPrice: newPrice,
        newBidAmount: newPrice
      });
      this.toastr.success('Asking price updated');
      
      // Update asking price in the bidding service for simulation
      if (this.auctionState.getValue('simulatedBiddingEnabled')) {
        this.biddingService.updateAskingPrice(newPrice);
      }
      
      if (!this.hasCreditsError) {
        this.voiceService.speak(`New asking price set to ${this.voiceService.formatPriceForSpeech(newPrice)}.`);
      }
    } else {
      this.toastr.error('New asking price must be higher than current highest bid');
    }
  }

  adjustBidIncrement(amount: number): void {
    const currentBidIncrement = this.auctionState.getValue('bidIncrement');
    const newBidIncrement = Math.max(100, currentBidIncrement + amount);
    this.auctionState.setState({ bidIncrement: newBidIncrement });
    
    if (!this.hasCreditsError) {
      this.voiceService.speak(`Bid increment adjusted to ${this.voiceService.formatPriceForSpeech(newBidIncrement)}.`);
    }
  }

  onBidPlaced(bid: Bid): void {
    // Check if we should continue the hammer sequence or reset it
    const hammerState = this.auctionState.getValue('hammerState');
    const continueHammer = hammerState !== HammerState.ACCEPTING_BIDS && 
                           bid.bidType === 'WAR'; // Only continue if it's a bid war
    
    // Reset hammer state if needed
    if (!continueHammer && hammerState !== HammerState.ACCEPTING_BIDS) {
      this.auctionState.setState({ hammerState: HammerState.ACCEPTING_BIDS });
    }
    
    // Add the bid
    this.auctionState.setState({
      bids: [bid, ...this.auctionState.getValue('bids')],
      currentHighestBid: bid.amount,
      highestBid: bid,
      askingPrice: bid.amount + this.auctionState.getValue('bidIncrement'),
      canUseHammer: true
    });
    
    // Get the lot control component and reset its hammer sequence and withdraw countdown
    const lotControlComponent = this.auctionState.getLotControlComponent();
    if (lotControlComponent) {
      lotControlComponent.resetHammerSequence();
      lotControlComponent.cancelWithdrawOnNewBid();
    }
    
    // Track dealer bids vs auctioneer bids
    if (bid.bidType === 'SIMULATED' || 
        (bid.bidType !== 'BID1' && bid.bidType !== 'BID2' && bid.bidType !== 'WAR')) {
      // This is a dealer bid, not from the auctioneer
      this.auctionState.incrementDealerBidsCount();
      
      // Play sound only for real user bids (not simulated or auctioneer bids)
      if (bid.bidType !== 'SIMULATED') {
        this.soundService.playBidNotification();
      }
    }
    
    // Update bid announcement time
    this.lastBidAnnouncementTime = Date.now();
  }

  onAuctioneerBidCountChanged(): void {
    this.auctionState.incrementAuctioneerBidsCount();
  }

  selectLot(lot: LotDetails): void {
    this.auctionState.setState({ currentLot: lot });
    updateDealerStatuses(lot.lotNumber, this.auctionState.getValue('dealers'));
    this.auctionState.resetLotState();
    
    // Enhanced lot selection announcement with more details
    const lotSelectionMessage = `Selected lot ${lot.lotNumber}, ${lot.year} ${lot.make} ${lot.model}. This vehicle has ${lot.watchers} watchers and ${lot.viewers} viewers interested.`;
    
    if (!this.hasCreditsError) {
      this.voiceService.speak(lotSelectionMessage);
    }
  }

  onDealerSelect(dealer: Dealer | null): void {
    this.auctionState.setSelectedDealer(dealer);
  }

  onSendMessage(messageData: { text: string, isGlobal: boolean }): void {
    const { text, isGlobal } = messageData;
    const time = this.auctionService.getCurrentTime();
    const messageId = Math.random().toString(36).substring(2);
    const selectedDealer = this.auctionState.getValue('selectedDealer');
    
    const message: Message = {
      id: messageId,
      text,
      time,
      alternate: true,
      dealer: 'You',
      dealerId: 'ADMIN',
      recipientId: selectedDealer ? 
                  (selectedDealer.USR_ID ? selectedDealer.USR_ID.toString() : undefined) : 
                  undefined,
      isGlobal,
      isRead: true
    };

    this.auctionState.addMessage(message);
  }
}