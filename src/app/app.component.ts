import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { VehicleDetailsFeatureComponent } from './features/vehicle-details/vehicle-details.component';
import { BiddingComponent } from './features/bidding/bidding.component';
import { MessagingComponent } from './features/messaging/messaging.component';
import { LotControlComponent } from './features/lot-control/lot-control.component';
import { BidHistoryComponent } from './components/bid-history/bid-history.component';
import { LotsListComponent } from './components/lots-list/lots-list.component';
import { UserListDialogComponent } from './components/shared/user-list-dialog/user-list-dialog.component';
import { CurrentStatusComponent } from './components/current-status/current-status.component';
import { AuctionDetailsFeatureComponent } from './features/auction-details/auction-details.component';
import { DealersListComponent } from './components/dealers-list/dealers-list.component';
import { PlannedLotsComponent } from './components/planned-lots/planned-lots.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { AuctionEventService } from './auction/auction-event.service';
import { AuctionStateService } from './auction/auction-state.service';
import { LotStatus, HammerState } from './models/enums';
import { LotService } from './services/lot.service';
import { KeyboardShortcutService } from './services/keyboard-shortcut.service';
import { ToastrService } from 'ngx-toastr';
import { LotDetails } from './models/interfaces';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    VehicleDetailsFeatureComponent,
    BiddingComponent,
    MessagingComponent,
    LotControlComponent,
    BidHistoryComponent,
    LotsListComponent,
    UserListDialogComponent,
    CurrentStatusComponent,
    AuctionDetailsFeatureComponent,
    DealersListComponent,
    PlannedLotsComponent,
    SettingsPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  // Expose enums to the template
  protected readonly LotStatus = LotStatus;
  protected readonly HammerState = HammerState;
  
  // Settings panel state
  isSettingsPanelOpen = false;
  
  // Subscriptions to clean up
  private subscriptions: Subscription[] = [];
  
  constructor(
    public auctionState: AuctionStateService,
    private auctionEventService: AuctionEventService,
    private lotService: LotService,
    private toastr: ToastrService,
    private keyboardShortcutService: KeyboardShortcutService
  ) {}

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyboardEvent(event: KeyboardEvent) {
    // Global keyboard shortcuts that apply regardless of component focus
    // Only handle global shortcuts here - specific ones are in their respective components
    
    // ALT + S to open settings panel
    if (this.keyboardShortcutService.isShortcutMatch(event, 's')) {
      this.toggleSettingsPanel();
      event.preventDefault();
    }
    
    // ALT + Q to toggle simulated bidding
    if (this.keyboardShortcutService.isShortcutMatch(event, 'q')) {
      this.toggleSimulatedBidding();
      event.preventDefault();
    }
  }

  ngOnInit(): void {
    // Initialize auction state if needed
    console.log('App component initialized');
  }
  
  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
  
  // Settings panel methods
  toggleSettingsPanel(): void {
    this.isSettingsPanelOpen = !this.isSettingsPanelOpen;
  }
  
  closeSettingsPanel(): void {
    this.isSettingsPanelOpen = false;
  }
  
  // Header event handlers
  startAuction(): void {
    this.auctionEventService.startAuction();
  }
  
  endAuction(): void {
    this.auctionEventService.endAuction();
  }
  
  toggleView(): void {
    this.auctionEventService.toggleView();
  }
  
  toggleSimulatedBidding(): void {
    console.log('App component - toggleSimulatedBidding called');
    this.auctionEventService.toggleSimulatedBidding();
  }
  
  // Lot management
  onLotUpdated(update: {lotNumber: number, field: string, value: number}): void {
    this.auctionEventService.onLotUpdated(update);
  }

  onLotsReordered(reorderedLots: LotDetails[]): void {
    // Update the state with the new lot order
    this.auctionState.setLots(reorderedLots);
    this.toastr.success('Lot order updated successfully');
  }
  
  // User list dialog handlers
  openViewersDialog(): void {
    this.auctionEventService.openViewersDialog();
  }
  
  closeViewersDialog(): void {
    this.auctionEventService.closeViewersDialog();
  }
  
  openWatchersDialog(): void {
    this.auctionEventService.openWatchersDialog();
  }
  
  closeWatchersDialog(): void {
    this.auctionEventService.closeWatchersDialog();
  }
  
  openLeadsDialog(): void {
    this.auctionEventService.openLeadsDialog();
  }
  
  closeLeadsDialog(): void {
    this.auctionEventService.closeLeadsDialog();
  }
  
  openOnlineDialog(): void {
    this.auctionEventService.openOnlineDialog();
  }
  
  closeOnlineDialog(): void {
    this.auctionEventService.closeOnlineDialog();
  }
  
  // Lot control
  startLot(): void {
    this.auctionEventService.startLot();
  }
  
  moveLot(): void {
    this.auctionEventService.moveLot();
  }
  
  noSale(): void {
    this.auctionEventService.noSale();
  }
  
  withdrawLot(): void {
    this.auctionEventService.withdrawLot();
  }
  
  markAsSold(): void {
    this.auctionEventService.markAsSold();
  }
  
  progressHammerState(): void {
    this.auctionEventService.progressHammerState();
  }
  
  // Bidding handlers
  getLotPerformance() {
    return this.auctionEventService.getLotPerformance();
  }
  
  setAskingPrice(newPrice: number): void {
    this.auctionEventService.setAskingPrice(newPrice);
  }
  
  adjustBidIncrement(amount: number): void {
    this.auctionEventService.adjustBidIncrement(amount);
  }
  
  onBidPlaced(bid: any): void {
    this.auctionEventService.onBidPlaced(bid);
  }
  
  onAuctioneerBidCountChanged(): void {
    this.auctionEventService.onAuctioneerBidCountChanged();
  }
  
  // Lot selection
  selectLot(lot: any): void {
    this.auctionEventService.selectLot(lot);
  }
  
  // Dealer messaging
  onDealerSelect(dealer: any): void {
    this.auctionEventService.onDealerSelect(dealer);
  }
  
  onSendMessage(message: { text: string, isGlobal: boolean }): void {
    this.auctionEventService.onSendMessage(message);
  }
}