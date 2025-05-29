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
import { AuctionState, AuctionStateKey } from '../models/state.interface';

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

  // Type-safe mapping of state keys to their BehaviorSubject observables
  private stateSubjects: { [K in AuctionStateKey]?: BehaviorSubject<AuctionState[K]> } = {};

  constructor(
    private dealerService: DealerService,
    private lotService: LotService
  ) {
    // Initialize the state subjects mapping
    this.initStateSubjects();
    
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
  
  // Initialize the mapping between state keys and BehaviorSubjects
  private initStateSubjects(): void {
    this.stateSubjects = {
      auctionTitle: new BehaviorSubject<string>(this.auctionTitle),
      currentDateTime: this.currentDateTime$,
      isAuctionStarted: this.isAuctionStarted$,
      isViewingLots: this.isViewingLots$,
      simulatedBiddingEnabled: this.simulatedBiddingEnabled$,
      skipConfirmations: this.skipConfirmations$,
      currentLot: this.currentLot$,
      lots: this.lots$,
      dealers: this.dealers$,
      messages: this.messages$,
      bids: this.bids$,
      viewers: this.viewers$,
      watchers: this.watchers$,
      leads: this.leads$,
      onlineUsers: this.onlineUsers$,
      isViewersDialogOpen: this.isViewersDialogOpen$,
      isWatchersDialogOpen: this.isWatchersDialogOpen$,
      isLeadsDialogOpen: this.isLeadsDialogOpen$,
      isOnlineDialogOpen: this.isOnlineDialogOpen$,
      lotStatus: this.lotStatus$,
      hammerState: this.hammerState$,
      canControlLot: this.canControlLot$,
      canUseHammer: this.canUseHammer$,
      currentHighestBid: this.currentHighestBid$,
      askingPrice: this.askingPrice$,
      startPrice: this.startPrice$,
      bidIncrement: this.bidIncrement$,
      newBidAmount: this.newBidAmount$,
      highestBid: this.highestBid$,
      soldLots: this.soldLots$,
      withdrawnLots: this.withdrawnLots$,
      totalSoldValue: this.totalSoldValue$,
      totalReserveValue: this.totalReserveValue$,
      auctioneerBidsCount: this.auctioneerBidsCount$,
      dealerBidsCount: this.dealerBidsCount$,
      selectedDealer: this.selectedDealer$
    };
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
        this.dealers$.next(dealers);
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  // Private method to load lots from Supabase
  private loadLots(): void {
    this.lotService.getLots().pipe(
      tap(lots => {
        this.processLoadedLots(lots);
      }),
      catchError(error => {
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

  // Type-safe method to get a specific value from state
  getValue<K extends AuctionStateKey>(key: K): AuctionState[K] {
    const subject = this.stateSubjects[key] as BehaviorSubject<AuctionState[K]>;
    if (subject) {
      return subject.value;
    }
    
    // Fallback to specific getters for any keys not in the mapping
    switch(key) {
      case 'auctionTitle':
        return this.auctionTitle as AuctionState[K];
      default:
        return null as unknown as AuctionState[K];
    }
  }

  // Type-safe method to get an observable of a specific state value
  select<K extends AuctionStateKey>(key: K): Observable<AuctionState[K]> {
    const subject = this.stateSubjects[key] as BehaviorSubject<AuctionState[K]>;
    if (subject) {
      return subject.asObservable();
    }
    
    // Fallback to specific observables for any keys not in the mapping
    return of(null as unknown as AuctionState[K]);
  }

  // Type-safe method to update state
  public setState<K extends AuctionStateKey>(updates: Partial<Pick<AuctionState, K>>): void {
    // Update each property from the provided updates object
    (Object.keys(updates) as K[]).forEach(key => {
      const subject = this.stateSubjects[key] as BehaviorSubject<AuctionState[K]>;
      if (subject) {
        subject.next(updates[key] as AuctionState[K]);
        
        // Special case for currentLot - update related data
        if (key === 'currentLot' && updates[key]) {
          this.updateViewers();
          this.updateWatchers();
          this.updateLeads();
          this.updateOnlineUsers();
        }
      }
    });
  }

  // All the other methods remain the same, just keeping them for backward compatibility
  
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
    this.isAuctionStarted$.next(value);
  }

  setIsViewingLots(value: boolean): void {
    this.isViewingLots$.next(value);
  }

  setSimulatedBiddingEnabled(value: boolean): void {
    this.simulatedBiddingEnabled$.next(value);
    
    // Trigger the bidding service to reflect this change
    if (this.simulatedBiddingEnabled$.value && 
        this.lotStatus$.value === LotStatus.ACTIVE && 
        this.currentLot$.value) {
      // Note: The actual simulation start happens in the auction-event.service
      // which should be listening to this state change
    } else if (!this.simulatedBiddingEnabled$.value) {
      // Note: The actual simulation stop happens in the auction-event.service
      // which should be listening to this state change
    }
  }

  setSkipConfirmations(value: boolean): void {
    this.skipConfirmations$.next(value);
  }

  setCurrentLot(lot: LotDetails | null): void {
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
        // Lot updated in Supabase
      },
      error => {
        // Error updating lot in Supabase
      }
    );
  }

  setLots(lots: LotDetails[]): void {
    this.lots$.next(lots);
    
    // Update related data after reordering
    updateMockViewers(lots, this.dealers$.value);
    updateMockWatchers(lots, this.dealers$.value);
    updateMockLeads(lots, this.dealers$.value);
    updateMockOnline(lots, this.dealers$.value);
  }

  setLotStatus(status: LotStatus): void {
    this.lotStatus$.next(status);
    
    if (this.currentLot$.value) {
      const updatedLot = { ...this.currentLot$.value, status };
      this.updateLot(updatedLot);
    }
  }

  setHammerState(state: HammerState): void {
    this.hammerState$.next(state);
  }

  setCanControlLot(value: boolean): void {
    this.canControlLot$.next(value);
  }

  setCanUseHammer(value: boolean): void {
    this.canUseHammer$.next(value);
  }

  setCurrentHighestBid(value: number | null): void {
    this.currentHighestBid$.next(value);
  }

  setAskingPrice(value: number): void {
    this.askingPrice$.next(value);
  }

  setStartPrice(value: number): void {
    this.startPrice$.next(value);
  }

  setBidIncrement(value: number): void {
    this.bidIncrement$.next(value);
  }

  setNewBidAmount(value: number): void {
    this.newBidAmount$.next(value);
  }

  incrementSoldLots(): void {
    const newValue = this.soldLots$.value + 1;
    this.soldLots$.next(newValue);
  }

  incrementWithdrawnLots(): void {
    const newValue = this.withdrawnLots$.value + 1;
    this.withdrawnLots$.next(newValue);
  }

  addToTotalSoldValue(value: number): void {
    const newValue = this.totalSoldValue$.value + value;
    this.totalSoldValue$.next(newValue);
  }

  addToTotalReserveValue(value: number): void {
    const newValue = this.totalReserveValue$.value + value;
    this.totalReserveValue$.next(newValue);
  }

  incrementAuctioneerBidsCount(): void {
    const newValue = this.auctioneerBidsCount$.value + 1;
    this.auctioneerBidsCount$.next(newValue);
  }

  incrementDealerBidsCount(): void {
    const newValue = this.dealerBidsCount$.value + 1;
    this.dealerBidsCount$.next(newValue);
  }

  setSelectedDealer(dealer: Dealer | null): void {
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
    this.bids$.next([bid, ...this.bids$.value]);
    this.currentHighestBid$.next(bid.amount);
    this.highestBid$.next(bid);
    this.askingPrice$.next(bid.amount + this.bidIncrement$.value);
    this.canUseHammer$.next(true);
  }

  addMessage(message: Message): void {
    this.messages$.next([message, ...this.messages$.value]);
  }

  resetLotState(): void {
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

  // Support methods for legacy to new state management transition
  startAuction(): void {
    this.setState({ isAuctionStarted: true, isViewingLots: false });
  }

  endAuction(): void {
    this.setState({ isAuctionStarted: false, isViewingLots: true });
  }

  toggleView(): void {
    this.setState({ isViewingLots: !this.isViewingLots$.value });
  }
}