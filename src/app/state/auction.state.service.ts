import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, catchError, of, tap, map, switchMap } from 'rxjs';
import { Bid, Dealer, LotDetails, Message, ViewerInfo } from '../models/interfaces';
import { LotStatus, HammerState } from '../models/enums';
import { INITIAL_MESSAGES } from '../data/mock-messages';
import { AUCTION_TITLE } from '../data/mock-data';
import { MOCK_VIEWERS, updateMockViewers } from '../data/mock-viewers';
import { MOCK_WATCHERS, updateMockWatchers } from '../data/mock-watchers';
import { MOCK_LEADS, updateMockLeads } from '../data/mock-leads';
import { MOCK_ONLINE, updateMockOnline } from '../data/mock-online';
import { updateDealerStatuses } from '../data/mock-dealer-status';
import { DealerService } from '../services/dealer.service';
import { LotService } from '../services/lot.service';
import { LotControlsComponent } from '../components/lot-controls/lot-controls.component';

@Injectable({
  providedIn: 'root'
})
export class AuctionStateService {
  // Reference to the lot control component for hammer/withdraw control
  private lotControlComponent: LotControlsComponent | null = null;
  
  // Auction meta info
  private auctionTitle = AUCTION_TITLE;
  private currentDateTime$ = new BehaviorSubject<string>(new Date().toLocaleString('en-GB'));
  
  // Auction state
  private isAuctionStarted$ = new BehaviorSubject<boolean>(false);
  private isViewingLots$ = new BehaviorSubject<boolean>(true);
  private simulatedBiddingEnabled$ = new BehaviorSubject<boolean>(false);
  private skipConfirmations$ = new BehaviorSubject<boolean>(false);

  // Lots and dealers
  private currentLot$ = new BehaviorSubject<LotDetails | null>(null);
  private lots$ = new BehaviorSubject<LotDetails[]>([]);
  private dealers$ = new BehaviorSubject<Dealer[]>([]);
  private messages$ = new BehaviorSubject<Message[]>(INITIAL_MESSAGES);
  private bids$ = new BehaviorSubject<Bid[]>([]);

  // User info
  private viewers$ = new BehaviorSubject<ViewerInfo[]>([]);
  private watchers$ = new BehaviorSubject<ViewerInfo[]>([]);
  private leads$ = new BehaviorSubject<ViewerInfo[]>([]);
  private onlineUsers$ = new BehaviorSubject<ViewerInfo[]>([]);
  
  // Dialog states
  private isViewersDialogOpen$ = new BehaviorSubject<boolean>(false);
  private isWatchersDialogOpen$ = new BehaviorSubject<boolean>(false);
  private isLeadsDialogOpen$ = new BehaviorSubject<boolean>(false);
  private isOnlineDialogOpen$ = new BehaviorSubject<boolean>(false);

  // Lot status
  private lotStatus$ = new BehaviorSubject<LotStatus>(LotStatus.PENDING);
  private hammerState$ = new BehaviorSubject<HammerState>(HammerState.ACCEPTING_BIDS);
  private canControlLot$ = new BehaviorSubject<boolean>(true);
  private canUseHammer$ = new BehaviorSubject<boolean>(false);

  // Bidding state
  private currentHighestBid$ = new BehaviorSubject<number | null>(null);
  private askingPrice$ = new BehaviorSubject<number>(0);
  private startPrice$ = new BehaviorSubject<number>(0);
  private bidIncrement$ = new BehaviorSubject<number>(500);
  private newBidAmount$ = new BehaviorSubject<number>(0);
  private highestBid$ = new BehaviorSubject<Bid | null>(null);

  // Auction stats
  private soldLots$ = new BehaviorSubject<number>(0);
  private withdrawnLots$ = new BehaviorSubject<number>(0);
  private totalSoldValue$ = new BehaviorSubject<number>(0);
  private totalReserveValue$ = new BehaviorSubject<number>(0);
  private auctioneerBidsCount$ = new BehaviorSubject<number>(0);
  private dealerBidsCount$ = new BehaviorSubject<number>(0);

  // Selected dealer
  private selectedDealer$ = new BehaviorSubject<Dealer | null>(null);

  constructor(
    private dealerService: DealerService,
    private lotService: LotService
  ) {
    console.log('AuctionStateService initialized');
    
    // Load dealers first
    this.loadDealers().subscribe(dealers => {
      // After dealers are loaded, load lots
      this.loadLots();
    });

    // Set up timer for current date-time
    setInterval(() => {
      this.currentDateTime$.next(new Date().toLocaleString('en-GB'));
    }, 1000);
  }
  
  // Store a reference to the lot control component
  setLotControlComponent(component: LotControlsComponent | undefined) {
    this.lotControlComponent = component || null;
  }
  
  // Get reference to lot control component
  getLotControlComponent(): LotControlsComponent | null {
    return this.lotControlComponent;
  }

  // Private method to load dealers
  private loadDealers(): Observable<Dealer[]> {
    return this.dealerService.getDealers().pipe(
      tap(dealers => {
        console.log('Dealers loaded successfully:', dealers.length);
        this.dealers$.next(dealers);
      }),
      catchError(error => {
        console.error('Error fetching dealers:', error);
        return of([]);
      })
    );
  }

  // Private method to load lots from Supabase
  private loadLots(): void {
    this.lotService.getLots().pipe(
      tap(lots => {
        console.log('Lots loaded successfully from Supabase:', lots.length);
        this.processLoadedLots(lots);
      }),
      catchError(error => {
        console.error('Error fetching lots:', error);
        return of([]);
      })
    ).subscribe();
  }
  
  // Helper method to process loaded lots
  private processLoadedLots(lots: LotDetails[]): void {
    this.lots$.next(lots);
    
    // Initialize mock data based on loaded lots
    updateMockViewers(lots, this.dealers$.value);
    updateMockWatchers(lots, this.dealers$.value);
    updateMockLeads(lots, this.dealers$.value);
    updateMockOnline(lots, this.dealers$.value);
    updateDealerStatuses(this.currentLot$.value?.lotNumber || 1, this.dealers$.value);
    
    // Initialize currentLot
    if (lots.length > 0) {
      const initialLot = lots[0];
      this.currentLot$.next(initialLot);
      this.startPrice$.next(initialLot.initialAskingPrice);
      this.askingPrice$.next(initialLot.initialAskingPrice);
      this.updateViewers();
      this.updateWatchers();
      this.updateLeads();
      this.updateOnlineUsers();
    }
  }

  // ADDED: New method to get a specific value from state
  getValue(key: string): any {
    switch(key) {
      case 'auctionTitle':
        return this.auctionTitle;
      case 'simulatedBiddingEnabled':
        return this.simulatedBiddingEnabled$.value;
      case 'skipConfirmations':
        return this.skipConfirmations$.value;
      case 'currentLot':
        return this.currentLot$.value;
      case 'lots':
        return this.lots$.value;
      case 'dealers':
        return this.dealers$.value;
      case 'messages':
        return this.messages$.value;
      case 'bids':
        return this.bids$.value;
      case 'lotStatus':
        return this.lotStatus$.value;
      case 'isViewingLots':
        return this.isViewingLots$.value;
      case 'isAuctionStarted':
        return this.isAuctionStarted$.value;
      default:
        console.warn(`getValue called with unknown key: ${key}`);
        return null;
    }
  }

  // ADDED: New method to get an observable of a specific state value
  select(key: string): Observable<any> {
    switch(key) {
      case 'currentDateTime':
        return this.currentDateTime$.asObservable();
      case 'isAuctionStarted':
        return this.isAuctionStarted$.asObservable();
      case 'isViewingLots':
        return this.isViewingLots$.asObservable();
      case 'simulatedBiddingEnabled':
        return this.simulatedBiddingEnabled$.asObservable();
      case 'currentLot':
        return this.currentLot$.asObservable();
      case 'lots':
        return this.lots$.asObservable();
      case 'dealers':
        return this.dealers$.asObservable();
      case 'messages':
        return this.messages$.asObservable();
      case 'bids':
        return this.bids$.asObservable();
      case 'viewers':
        return this.viewers$.asObservable();
      case 'watchers':
        return this.watchers$.asObservable();
      case 'leads':
        return this.leads$.asObservable();
      case 'onlineUsers':
        return this.onlineUsers$.asObservable();
      case 'isViewersDialogOpen':
        return this.isViewersDialogOpen$.asObservable();
      case 'isWatchersDialogOpen':
        return this.isWatchersDialogOpen$.asObservable();
      case 'isLeadsDialogOpen':
        return this.isLeadsDialogOpen$.asObservable();
      case 'isOnlineDialogOpen':
        return this.isOnlineDialogOpen$.asObservable();
      case 'lotStatus':
        return this.lotStatus$.asObservable();
      case 'hammerState':
        return this.hammerState$.asObservable();
      case 'canControlLot':
        return this.canControlLot$.asObservable();
      case 'canUseHammer':
        return this.canUseHammer$.asObservable();
      case 'currentHighestBid':
        return this.currentHighestBid$.asObservable();
      case 'askingPrice':
        return this.askingPrice$.asObservable();
      case 'startPrice':
        return this.startPrice$.asObservable();
      case 'bidIncrement':
        return this.bidIncrement$.asObservable();
      case 'newBidAmount':
        return this.newBidAmount$.asObservable();
      case 'highestBid':
        return this.highestBid$.asObservable();
      case 'soldLots':
        return this.soldLots$.asObservable();
      case 'withdrawnLots':
        return this.withdrawnLots$.asObservable();
      case 'totalSoldValue':
        return this.totalSoldValue$.asObservable();
      case 'totalReserveValue':
        return this.totalReserveValue$.asObservable();
      case 'auctioneerBidsCount':
        return this.auctioneerBidsCount$.asObservable();
      case 'dealerBidsCount':
        return this.dealerBidsCount$.asObservable();
      case 'selectedDealer':
        return this.selectedDealer$.asObservable();
      default:
        console.warn(`select called with unknown key: ${key}`);
        return of(null);
    }
  }

  // CHANGED: Made setState public instead of private
  public setState(state: Partial<any>): void {
    console.log('Setting state:', state);
    
    // Update each property from the provided state object
    Object.keys(state).forEach(key => {
      switch(key) {
        case 'isAuctionStarted':
          this.isAuctionStarted$.next(state[key]);
          break;
        case 'isViewingLots':
          this.isViewingLots$.next(state[key]);
          break;
        case 'simulatedBiddingEnabled':
          this.simulatedBiddingEnabled$.next(state[key]);
          break;
        case 'skipConfirmations':
          this.skipConfirmations$.next(state[key]);
          break;
        case 'currentLot':
          this.currentLot$.next(state[key]);
          if (state[key]) {
            this.updateViewers();
            this.updateWatchers();
            this.updateLeads();
            this.updateOnlineUsers();
          }
          break;
        case 'lots':
          this.lots$.next(state[key]);
          break;
        case 'lotStatus':
          this.lotStatus$.next(state[key]);
          break;
        case 'hammerState':
          this.hammerState$.next(state[key]);
          break;
        case 'canControlLot':
          this.canControlLot$.next(state[key]);
          break;
        case 'canUseHammer':
          this.canUseHammer$.next(state[key]);
          break;
        case 'currentHighestBid':
          this.currentHighestBid$.next(state[key]);
          break;
        case 'askingPrice':
          this.askingPrice$.next(state[key]);
          break;
        case 'newBidAmount':
          this.newBidAmount$.next(state[key]);
          break;
        case 'isViewersDialogOpen':
          this.isViewersDialogOpen$.next(state[key]);
          break;
        case 'isWatchersDialogOpen':
          this.isWatchersDialogOpen$.next(state[key]);
          break;
        case 'isLeadsDialogOpen':
          this.isLeadsDialogOpen$.next(state[key]);
          break;
        case 'isOnlineDialogOpen':
          this.isOnlineDialogOpen$.next(state[key]);
          break;
        default:
          console.warn(`setState called with unknown key: ${key}`);
      }
    });
  }

  // Getters
  getAuctionTitle(): string {
    return this.auctionTitle;
  }

  getCurrentDateTime(): Observable<string> {
    return this.currentDateTime$.asObservable();
  }

  getIsAuctionStarted(): Observable<boolean> {
    return this.isAuctionStarted$.asObservable();
  }

  getIsAuctionStartedValue(): boolean {
    return this.isAuctionStarted$.value;
  }

  getIsViewingLots(): Observable<boolean> {
    return this.isViewingLots$.asObservable();
  }

  getIsViewingLotsValue(): boolean {
    return this.isViewingLots$.value;
  }

  getSimulatedBiddingEnabled(): boolean {
    return this.simulatedBiddingEnabled$.value;
  }
  
  getSimulatedBiddingEnabledObservable(): Observable<boolean> {
    return this.simulatedBiddingEnabled$.asObservable();
  }

  getSkipConfirmations(): boolean {
    return this.skipConfirmations$.value;
  }
  
  getSkipConfirmationsObservable(): Observable<boolean> {
    return this.skipConfirmations$.asObservable();
  }

  getCurrentLot(): Observable<LotDetails | null> {
    return this.currentLot$.asObservable();
  }

  getCurrentLotValue(): LotDetails | null {
    return this.currentLot$.value;
  }

  getLots(): Observable<LotDetails[]> {
    return this.lots$.asObservable();
  }

  getLotsValue(): LotDetails[] {
    return this.lots$.value;
  }

  getDealers(): Observable<Dealer[]> {
    return this.dealers$.asObservable();
  }

  getDealersValue(): Dealer[] {
    return this.dealers$.value;
  }

  getMessages(): Observable<Message[]> {
    return this.messages$.asObservable();
  }

  getMessagesValue(): Message[] {
    return this.messages$.value;
  }

  getBids(): Observable<Bid[]> {
    return this.bids$.asObservable();
  }

  getBidsValue(): Bid[] {
    return this.bids$.value;
  }

  getHighestBid(): Observable<Bid | null> {
    return this.highestBid$.asObservable();
  }

  getHighestBidValue(): Bid | null {
    return this.highestBid$.value;
  }

  getViewers(): Observable<ViewerInfo[]> {
    return this.viewers$.asObservable();
  }

  getWatchers(): Observable<ViewerInfo[]> {
    return this.watchers$.asObservable();
  }

  getLeads(): Observable<ViewerInfo[]> {
    return this.leads$.asObservable();
  }

  getOnlineUsers(): Observable<ViewerInfo[]> {
    return this.onlineUsers$.asObservable();
  }

  getIsViewersDialogOpen(): Observable<boolean> {
    return this.isViewersDialogOpen$.asObservable();
  }

  getIsWatchersDialogOpen(): Observable<boolean> {
    return this.isWatchersDialogOpen$.asObservable();
  }

  getIsLeadsDialogOpen(): Observable<boolean> {
    return this.isLeadsDialogOpen$.asObservable();
  }

  getIsOnlineDialogOpen(): Observable<boolean> {
    return this.isOnlineDialogOpen$.asObservable();
  }

  getLotStatus(): Observable<LotStatus> {
    return this.lotStatus$.asObservable();
  }

  getLotStatusValue(): LotStatus {
    return this.lotStatus$.value;
  }

  getHammerState(): Observable<HammerState> {
    return this.hammerState$.asObservable();
  }

  getHammerStateValue(): HammerState {
    return this.hammerState$.value;
  }

  getCanControlLot(): Observable<boolean> {
    return this.canControlLot$.asObservable();
  }

  getCanUseHammer(): Observable<boolean> {
    return this.canUseHammer$.asObservable();
  }

  getCurrentHighestBid(): Observable<number | null> {
    return this.currentHighestBid$.asObservable();
  }

  getCurrentHighestBidValue(): number | null {
    return this.currentHighestBid$.value;
  }

  getAskingPrice(): Observable<number> {
    return this.askingPrice$.asObservable();
  }

  getAskingPriceValue(): number {
    return this.askingPrice$.value;
  }

  getStartPrice(): Observable<number> {
    return this.startPrice$.asObservable();
  }

  getStartPriceValue(): number {
    return this.startPrice$.value;
  }

  getBidIncrement(): Observable<number> {
    return this.bidIncrement$.asObservable();
  }

  getBidIncrementValue(): number {
    return this.bidIncrement$.value;
  }

  getNewBidAmount(): Observable<number> {
    return this.newBidAmount$.asObservable();
  }

  getNewBidAmountValue(): number {
    return this.newBidAmount$.value;
  }

  getSoldLots(): Observable<number> {
    return this.soldLots$.asObservable();
  }

  getSoldLotsValue(): number {
    return this.soldLots$.value;
  }

  getWithdrawnLots(): Observable<number> {
    return this.withdrawnLots$.asObservable();
  }

  getWithdrawnLotsValue(): number {
    return this.withdrawnLots$.value;
  }

  getTotalSoldValue(): Observable<number> {
    return this.totalSoldValue$.asObservable();
  }

  getTotalSoldValueValue(): number {
    return this.totalSoldValue$.value;
  }

  getTotalReserveValue(): Observable<number> {
    return this.totalReserveValue$.asObservable();
  }

  getTotalReserveValueValue(): number {
    return this.totalReserveValue$.value;
  }

  getAuctioneerBidsCount(): Observable<number> {
    return this.auctioneerBidsCount$.asObservable();
  }

  getDealerBidsCount(): Observable<number> {
    return this.dealerBidsCount$.asObservable();
  }

  getSelectedDealer(): Observable<Dealer | null> {
    return this.selectedDealer$.asObservable();
  }

  getSelectedDealerValue(): Dealer | null {
    return this.selectedDealer$.value;
  }

  // Setters
  setIsAuctionStarted(value: boolean): void {
    console.log('Setting isAuctionStarted:', value);
    this.isAuctionStarted$.next(value);
  }

  setIsViewingLots(value: boolean): void {
    console.log('Setting isViewingLots:', value);
    this.isViewingLots$.next(value);
  }

  setSimulatedBiddingEnabled(value: boolean): void {
    console.log('Setting simulatedBiddingEnabled:', value);
    this.simulatedBiddingEnabled$.next(value);
    
    // Trigger the bidding service to reflect this change
    if (this.simulatedBiddingEnabled$.value && 
        this.lotStatus$.value === LotStatus.ACTIVE && 
        this.currentLot$.value) {
      console.log('Starting bidding simulation due to setting enabled');
      // Note: The actual simulation start happens in the auction-event.service
      // which should be listening to this state change
    } else if (!this.simulatedBiddingEnabled$.value) {
      console.log('Stopping bidding simulation due to setting disabled');
      // Note: The actual simulation stop happens in the auction-event.service
      // which should be listening to this state change
    }
  }

  setSkipConfirmations(value: boolean): void {
    console.log('Setting skipConfirmations:', value);
    this.skipConfirmations$.next(value);
  }

  setCurrentLot(lot: LotDetails | null): void {
    console.log('Setting currentLot:', lot?.lotNumber);
    this.currentLot$.next(lot);
    if (lot) {
      this.updateViewers();
      this.updateWatchers();
      this.updateLeads();
      this.updateOnlineUsers();
    }
  }

  updateLot(updatedLot: LotDetails): void {
    // First update the local state
    const lots = this.lots$.value.map(lot => 
      lot.lotNumber === updatedLot.lotNumber ? updatedLot : lot
    );
    this.lots$.next(lots);
    
    // If this is the current lot, update it
    if (this.currentLot$.value?.lotNumber === updatedLot.lotNumber) {
      this.currentLot$.next(updatedLot);
    }
    
    // Then update in Supabase
    this.lotService.updateLot(updatedLot).subscribe(
      updatedLotFromDb => {
        console.log('Lot updated in Supabase:', updatedLotFromDb);
      },
      error => {
        console.error('Error updating lot in Supabase:', error);
      }
    );
  }

  setLots(lots: LotDetails[]): void {
    console.log('Setting lots:', lots.length);
    this.lots$.next(lots);
    
    // Update related data after reordering
    updateMockViewers(lots, this.dealers$.value);
    updateMockWatchers(lots, this.dealers$.value);
    updateMockLeads(lots, this.dealers$.value);
    updateMockOnline(lots, this.dealers$.value);
  }

  setLotStatus(status: LotStatus): void {
    console.log('Setting lotStatus:', status);
    this.lotStatus$.next(status);
    
    if (this.currentLot$.value) {
      const updatedLot = { ...this.currentLot$.value, status };
      this.updateLot(updatedLot);
    }
  }

  setHammerState(state: HammerState): void {
    console.log('Setting hammerState:', state);
    this.hammerState$.next(state);
  }

  setCanControlLot(value: boolean): void {
    console.log('Setting canControlLot:', value);
    this.canControlLot$.next(value);
  }

  setCanUseHammer(value: boolean): void {
    console.log('Setting canUseHammer:', value);
    this.canUseHammer$.next(value);
  }

  setCurrentHighestBid(value: number | null): void {
    console.log('Setting currentHighestBid:', value);
    this.currentHighestBid$.next(value);
  }

  setAskingPrice(value: number): void {
    console.log('Setting askingPrice:', value);
    this.askingPrice$.next(value);
  }

  setStartPrice(value: number): void {
    console.log('Setting startPrice:', value);
    this.startPrice$.next(value);
  }

  setBidIncrement(value: number): void {
    console.log('Setting bidIncrement:', value);
    this.bidIncrement$.next(value);
  }

  setNewBidAmount(value: number): void {
    this.newBidAmount$.next(value);
  }

  incrementSoldLots(): void {
    const newValue = this.soldLots$.value + 1;
    console.log('Incrementing soldLots to:', newValue);
    this.soldLots$.next(newValue);
  }

  incrementWithdrawnLots(): void {
    const newValue = this.withdrawnLots$.value + 1;
    console.log('Incrementing withdrawnLots to:', newValue);
    this.withdrawnLots$.next(newValue);
  }

  addToTotalSoldValue(value: number): void {
    const newValue = this.totalSoldValue$.value + value;
    console.log('Adding to totalSoldValue:', value, 'New total:', newValue);
    this.totalSoldValue$.next(newValue);
  }

  addToTotalReserveValue(value: number): void {
    const newValue = this.totalReserveValue$.value + value;
    console.log('Adding to totalReserveValue:', value, 'New total:', newValue);
    this.totalReserveValue$.next(newValue);
  }

  incrementAuctioneerBidsCount(): void {
    const newValue = this.auctioneerBidsCount$.value + 1;
    console.log('Incrementing auctioneerBidsCount to:', newValue);
    this.auctioneerBidsCount$.next(newValue);
  }

  incrementDealerBidsCount(): void {
    const newValue = this.dealerBidsCount$.value + 1;
    console.log('Incrementing dealerBidsCount to:', newValue);
    this.dealerBidsCount$.next(newValue);
  }

  setSelectedDealer(dealer: Dealer | null): void {
    console.log('Setting selectedDealer:', dealer?.USR_ID || dealer?.ID || null);
    this.selectedDealer$.next(dealer);
    
    // Mark messages as read
    if (dealer) {
      const dealerId = (dealer.USR_ID ? dealer.USR_ID.toString() : '') || 
                     (dealer.ID ? dealer.ID.toString() : '');
      
      const updatedMessages = this.messages$.value.map(msg => 
        msg.dealerId === dealerId ? { ...msg, isRead: true } : msg
      );
      this.messages$.next(updatedMessages);
    }
  }

  addBid(bid: Bid): void {
    console.log('Adding new bid:', bid.bidder, bid.amount, bid.bidType);
    this.bids$.next([bid, ...this.bids$.value]);
    this.currentHighestBid$.next(bid.amount);
    this.highestBid$.next(bid);
    this.askingPrice$.next(bid.amount + this.bidIncrement$.value);
    this.canUseHammer$.next(true);
  }

  addMessage(message: Message): void {
    this.messages$.next([message, ...this.messages$.value]);
  }

  setViewersDialogOpen(value: boolean): void {
    this.isViewersDialogOpen$.next(value);
    if (value) {
      this.updateViewers();
    }
  }

  setWatchersDialogOpen(value: boolean): void {
    this.isWatchersDialogOpen$.next(value);
    if (value) {
      this.updateWatchers();
    }
  }

  setLeadsDialogOpen(value: boolean): void {
    this.isLeadsDialogOpen$.next(value);
    if (value) {
      this.updateLeads();
    }
  }

  setOnlineDialogOpen(value: boolean): void {
    this.isOnlineDialogOpen$.next(value);
    if (value) {
      this.updateOnlineUsers();
    }
  }

  resetLotState(): void {
    console.log('Resetting lot state');
    this.lotStatus$.next(LotStatus.PENDING);
    this.hammerState$.next(HammerState.ACCEPTING_BIDS);
    this.canControlLot$.next(true);
    this.canUseHammer$.next(false);
    this.currentHighestBid$.next(null);
    this.highestBid$.next(null);
    this.startPrice$.next(this.currentLot$.value?.initialAskingPrice || 0);
    this.askingPrice$.next(this.startPrice$.value);
    this.bids$.next([]);
    this.newBidAmount$.next(0);
    // Reset bid increment to default 500
    this.bidIncrement$.next(500);
  }

  private updateViewers(): void {
    if (this.currentLot$.value) {
      this.viewers$.next(MOCK_VIEWERS.get(this.currentLot$.value.lotNumber) || []);
    }
  }

  private updateWatchers(): void {
    if (this.currentLot$.value) {
      this.watchers$.next(MOCK_WATCHERS.get(this.currentLot$.value.lotNumber) || []);
    }
  }

  private updateLeads(): void {
    if (this.currentLot$.value) {
      this.leads$.next(MOCK_LEADS.get(this.currentLot$.value.lotNumber) || []);
    }
  }

  private updateOnlineUsers(): void {
    if (this.currentLot$.value) {
      this.onlineUsers$.next(MOCK_ONLINE.get(this.currentLot$.value.lotNumber) || []);
    }
  }
}