import { Bid, Dealer, LotDetails, Message, ViewerInfo } from './interfaces';
import { LotStatus, HammerState } from './enums';

/**
 * Strongly-typed state interface for the auction application
 */
export interface AuctionState {
  // Auction meta info
  auctionTitle: string;
  currentDateTime: string;
  
  // Auction state
  isAuctionStarted: boolean;
  isViewingLots: boolean;
  simulatedBiddingEnabled: boolean;
  skipConfirmations: boolean;

  // Lots and dealers
  currentLot: LotDetails | null;
  lots: LotDetails[];
  dealers: Dealer[];
  messages: Message[];
  bids: Bid[];

  // User info
  viewers: ViewerInfo[];
  watchers: ViewerInfo[];
  leads: ViewerInfo[];
  onlineUsers: ViewerInfo[];
  
  // Dialog states
  isViewersDialogOpen: boolean;
  isWatchersDialogOpen: boolean;
  isLeadsDialogOpen: boolean;
  isOnlineDialogOpen: boolean;

  // Lot status
  lotStatus: LotStatus;
  hammerState: HammerState;
  canControlLot: boolean;
  canUseHammer: boolean;

  // Bidding state
  currentHighestBid: number | null;
  askingPrice: number;
  startPrice: number;
  bidIncrement: number;
  newBidAmount: number;
  highestBid: Bid | null;

  // Auction stats
  soldLots: number;
  withdrawnLots: number;
  totalSoldValue: number;
  totalReserveValue: number;
  auctioneerBidsCount: number;
  dealerBidsCount: number;

  // Selected dealer
  selectedDealer: Dealer | null;
}

// Type for keys of AuctionState
export type AuctionStateKey = keyof AuctionState;