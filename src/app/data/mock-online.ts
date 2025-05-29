import { ViewerInfo, LotDetails } from '../models/interfaces';

const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const formatDateTime = (date: Date) => {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const createOnlineInfo = (count: number, dealers: any[]): ViewerInfo[] => {
  // Filter out bid users as they shouldn't appear in the lists
  const availableDealers = dealers.filter(d => {
    const type = d.TYPE;
    return type !== 'Bid User 1' && type !== 'Bid User 2';
  });
  
  if (availableDealers.length === 0) {
    return [];
  }
  
  const shuffledDealers = [...availableDealers].sort(() => Math.random() - 0.5);
  const selectedDealers = shuffledDealers.slice(0, Math.min(count, availableDealers.length));
  
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  
  return selectedDealers.map(dealer => {
    const lastBuy = dealer.LASTBUY || formatDateTime(getRandomDate(sixMonthsAgo, now));
    // Use a safer approach to get dealerId that always returns a string
    const dealerId = (dealer.USR_ID ? dealer.USR_ID.toString() : '') || 
                   (dealer.ID ? dealer.ID.toString() : '');
    
    return {
      name: `${dealer.FIRSTNAME || ''} ${dealer.LASTNAME || ''}`.trim(),
      dealerId,
      type: dealer.TYPE,
      lastBuy,
      lastActive: formatDateTime(getRandomDate(sixMonthsAgo, now))
    };
  });
};

export const MOCK_ONLINE = new Map<number, ViewerInfo[]>();

let cachedDealers: any[] = [];

export const updateMockOnline = (lots: LotDetails[], dealers?: any[]) => {
  if (dealers) {
    cachedDealers = dealers;
  }
  
  lots.forEach(lot => {
    MOCK_ONLINE.set(lot.lotNumber, createOnlineInfo(lot.onlineUsers, cachedDealers));
  });
};