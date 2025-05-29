import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotControlsComponent } from '../../components/lot-controls/lot-controls.component';
import { LotStatus, HammerState } from '../../models/enums';
import { LotDetails, Bid } from '../../models/interfaces';
import { AuctionStateService } from '../../auction/auction-state.service';

@Component({
  selector: 'app-lot-control',
  standalone: true,
  imports: [
    CommonModule,
    LotControlsComponent
  ],
  templateUrl: './lot-control.component.html',
  styleUrls: ['./lot-control.component.scss']
})
export class LotControlComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild(LotControlsComponent) lotControlsComponent!: LotControlsComponent;
  
  @Input() lotStatus: LotStatus = LotStatus.PENDING;
  @Input() hammerState: HammerState = HammerState.ACCEPTING_BIDS;
  @Input() canControlLot = false;
  @Input() canUseHammer = false;
  @Input() hasBids = false;
  @Input() skipConfirmations = false;
  @Input() currentLot: LotDetails | null = null;
  @Input() currentHighestBid: number | null = null;
  @Input() highestBid: Bid | null = null;

  @Output() startLot = new EventEmitter<void>();
  @Output() moveLot = new EventEmitter<void>();
  @Output() noSale = new EventEmitter<void>();
  @Output() withdrawLot = new EventEmitter<void>();
  @Output() markAsSold = new EventEmitter<void>();
  @Output() progressHammerState = new EventEmitter<void>();

  constructor(private auctionState: AuctionStateService) {}

  ngAfterViewInit() {
    // Register the component with the auction state service
    this.auctionState.setLotControlComponent(this.lotControlsComponent);
  }
  
  ngOnChanges(changes: SimpleChanges) {
    // Monitor changes to hammer state and reset accordingly
    if (changes['hammerState'] && !changes['hammerState'].firstChange) {
      const previousState = changes['hammerState'].previousValue;
      const currentState = changes['hammerState'].currentValue;
      
      // If we went from a hammer sequence back to accepting bids, reset the component
      if (previousState !== HammerState.ACCEPTING_BIDS && 
          currentState === HammerState.ACCEPTING_BIDS && 
          this.lotControlsComponent) {
        this.lotControlsComponent.resetHammerSequence();
      }
    }
  }
  
  ngOnDestroy() {
    // Clear the reference when component is destroyed
    // We're passing undefined instead of null to avoid type error
    this.auctionState.setLotControlComponent(undefined);
  }

  onStartLot() {
    this.startLot.emit();
  }

  onMoveLot() {
    this.moveLot.emit();
  }

  onNoSale() {
    this.noSale.emit();
  }

  onWithdrawLot() {
    this.withdrawLot.emit();
  }

  onMarkAsSold() {
    this.markAsSold.emit();
  }

  onProgressHammerState() {
    this.progressHammerState.emit();
  }
}