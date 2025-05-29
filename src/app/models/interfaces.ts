import { LotStatus } from './enums';

export { LotStatus } from './enums';

// Refactored Dealer interfaces
export interface BaseDealer {
  id: string; // Standardized ID field
  firstName: string;
  lastName: string;
  fullName: string; // Computed full name
  phone?: string;
  mobilePhone?: string;
  note?: string;
  lastLogin?: string;
  lastBidDate?: string;
  lastBuy?: string;
  type: string;
  companyName?: string;
  companyType?: string;
  city?: string;
  country?: string;
}

export interface LegacyDealer {
  ID?: number;
  USR_ID?: number;
  FIRSTNAME?: string | null;
  LASTNAME?: string | null;
  PHONE?: string | null;
  MOBILEPHONE?: string | null;
  NOTE?: string | null;
  LASTLOGIN?: string | null;
  LASTBIDDATE?: string | null;
  LASTBUY?: string | null;
  TYPE?: string;
  companyName?: string;
  companyType?: string;
  city?: string;
  country?: string;
}

// Combined interface for supporting both formats
export type Dealer = LegacyDealer;

// Helper functions to convert between formats
export function legacyToDealerModel(legacy: LegacyDealer): BaseDealer {
  const id = (legacy.USR_ID ? legacy.USR_ID.toString() : '') || 
             (legacy.ID ? legacy.ID.toString() : '');
  
  const firstName = legacy.FIRSTNAME || '';
  const lastName = legacy.LASTNAME || '';
  
  return {
    id,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    phone: legacy.PHONE || undefined,
    mobilePhone: legacy.MOBILEPHONE || undefined,
    note: legacy.NOTE || undefined,
    lastLogin: legacy.LASTLOGIN || undefined,
    lastBidDate: legacy.LASTBIDDATE || undefined,
    lastBuy: legacy.LASTBUY || undefined,
    type: legacy.TYPE || 'Standard',
    companyName: legacy.companyName,
    companyType: legacy.companyType,
    city: legacy.city,
    country: legacy.country
  };
}

export function getDealerName(dealer: Dealer): string {
  return `${dealer.FIRSTNAME || ''} ${dealer.LASTNAME || ''}`.trim();
}

export function getDealerId(dealer: Dealer): string {
  return (dealer.USR_ID ? dealer.USR_ID.toString() : '') || 
         (dealer.ID ? dealer.ID.toString() : '');
}

export interface LotDetails {
  lotNumber: number;
  make: string;
  model: string;
  year: number;
  transmission: string;
  fuel: string;
  color: string;
  mileage: number;
  location: string;
  registration: string;
  reservePrice: number;
  initialAskingPrice: number;
  lastAuctionBid?: number;
  indicataMarketPrice?: number;
  status?: LotStatus;
  viewers: number;
  watchers: number;
  leadListUsers: number;
  onlineUsers: number;
  finalState?: LotFinalState;
}

export interface LotFinalState {
  soldPrice: number;
  reservePrice: number;
  performance: {
    value: number;
    text: string;
  };
  soldTime: string;
  soldTo: string;
  soldToId: string;
  bids: Bid[];
}

export interface Message {
  id: string;
  text: string;
  time: string;
  alternate: boolean;
  dealer: string;
  dealerId: string;
  recipientId?: string;
  type?: string;
  isGlobal?: boolean;
  isRead?: boolean;
}

export interface ViewerInfo {
  name: string;
  dealerId: string;
  type: string;
  lastBuy: string;
  lastActive: string;
}

export interface DealerStatus {
  dealerId: string;
  isViewer: boolean;
  isWatcher: boolean;
  isLead: boolean;
  isOnline: boolean;
  lastActive: string;
}

export type SortColumn = 'name' | 'type' | 'lastBuy' | 'lastActive';
export type SortDirection = 'asc' | 'desc';

export interface MessageCount {
  total: number;
  unread: number;
}

export type DealerFilter = 'all' | 'viewers' | 'watchers' | 'leads' | 'online';

export interface Bid {
  bidder: string;
  bidderId: string;
  amount: number;
  time: string;
  type: string;
  bidType: string;
  companyName?: string;
  companyType?: string;
  city?: string;
  country?: string;
}