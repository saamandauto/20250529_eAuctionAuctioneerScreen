import { TestBed } from '@angular/core/testing';
import { AuctionEventService } from './auction-event.service';
import { AuctionService } from '../services/auction.service';
import { BiddingService } from '../services/bidding.service';
import { VoiceService } from '../services/voice.service';
import { SoundService } from '../services/sound.service';
import { ToastrService } from 'ngx-toastr';
import { AuctionStateService } from './auction-state.service';
import { of } from 'rxjs';

describe('AuctionEventService', () => {
  let service: AuctionEventService;
  let auctionStateMock: jasmine.SpyObj<AuctionStateService>;
  let biddingServiceMock: jasmine.SpyObj<BiddingService>;
  let voiceServiceMock: jasmine.SpyObj<VoiceService>;
  let toastrServiceMock: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    // Create spy objects for all dependencies
    const auctionServiceSpy = jasmine.createSpyObj('AuctionService', ['getCurrentTime', 'calculateLotPerformance']);
    biddingServiceMock = jasmine.createSpyObj('BiddingService', ['getBids', 'startSimulation', 'stopSimulation', 'setEnabled', 'updateAskingPrice']);
    voiceServiceMock = jasmine.createSpyObj('VoiceService', ['speak', 'getHasCreditsError', 'formatPriceForSpeech']);
    const soundServiceSpy = jasmine.createSpyObj('SoundService', ['playBidNotification']);
    toastrServiceMock = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info']);
    
    // Create the mock for AuctionStateService
    auctionStateMock = jasmine.createSpyObj('AuctionStateService', [
      'setState',
      'getValue',
      'select',
      'resetLotState',
      'updateLot',
      'incrementSoldLots',
      'incrementWithdrawnLots',
      'addToTotalSoldValue',
      'addToTotalReserveValue',
      'incrementDealerBidsCount',
      'incrementAuctioneerBidsCount',
      'addMessage',
      'setSelectedDealer',
      'startAuction',
      'endAuction',
      'toggleView'
    ]);

    // Setup mock return values
    biddingServiceMock.getBids.and.returnValue(of());
    voiceServiceMock.getHasCreditsError.and.returnValue(of(false));
    auctionStateMock.select.and.returnValue(of(false));
    
    TestBed.configureTestingModule({
      providers: [
        AuctionEventService,
        { provide: AuctionService, useValue: auctionServiceSpy },
        { provide: BiddingService, useValue: biddingServiceMock },
        { provide: VoiceService, useValue: voiceServiceMock },
        { provide: SoundService, useValue: soundServiceSpy },
        { provide: ToastrService, useValue: toastrServiceMock },
        { provide: AuctionStateService, useValue: auctionStateMock }
      ]
    });
    
    service = TestBed.inject(AuctionEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call startAuction on the auctionState service', () => {
    // Setup
    auctionStateMock.getValue.and.returnValue([]);
    
    // Execute
    service.startAuction();
    
    // Assert
    expect(auctionStateMock.startAuction).toHaveBeenCalled();
    expect(toastrServiceMock.success).toHaveBeenCalledWith('Auction started successfully');
  });

  it('should call endAuction on the auctionState service', () => {
    // Execute
    service.endAuction();
    
    // Assert
    expect(auctionStateMock.endAuction).toHaveBeenCalled();
    expect(biddingServiceMock.stopSimulation).toHaveBeenCalled();
    expect(toastrServiceMock.success).toHaveBeenCalledWith('Auction ended successfully');
  });

  it('should call toggleView on the auctionState service', () => {
    // Setup
    auctionStateMock.getValue.and.returnValue(true);
    
    // Execute
    service.toggleView();
    
    // Assert
    expect(auctionStateMock.toggleView).toHaveBeenCalled();
    expect(toastrServiceMock.info).toHaveBeenCalled();
  });
});