import { DealerStatus } from '../models/interfaces';
import { MOCK_VIEWERS } from './mock-viewers';
import { MOCK_WATCHERS } from './mock-watchers';
import { MOCK_LEADS } from './mock-leads';
import { MOCK_ONLINE } from './mock-online';

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

// Create mock status for each dealer
export const MOCK_DEALER_STATUS = new Map<string, DealerStatus>();

const now = new Date();
const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

const updateDealerStatuses = (currentLotNumber: number, dealers: any[] = []) => {
  dealers.forEach(dealer => {
    // Skip bid users
    if (dealer.TYPE === 'Bid User 1' || dealer.TYPE === 'Bid User 2') {
      return;
    }

    // Get dealerId from either ID or USR_ID field
    const dealerId = (dealer.USR_ID ? dealer.USR_ID.toString() : '') || 
                     (dealer.ID ? dealer.ID.toString() : '');
    
    if (!dealerId) {
      return;
    }

    const viewers = MOCK_VIEWERS.get(currentLotNumber) || [];
    const watchers = MOCK_WATCHERS.get(currentLotNumber) || [];
    const leads = MOCK_LEADS.get(currentLotNumber) || [];
    const online = MOCK_ONLINE.get(currentLotNumber) || [];

    const status: DealerStatus = {
      dealerId,
      isViewer: viewers.some(v => v.dealerId === dealerId),
      isWatcher: watchers.some(w => w.dealerId === dealerId),
      isLead: leads.some(l => l.dealerId === dealerId),
      isOnline: online.some(o => o.dealerId === dealerId),
      lastActive: formatDateTime(getRandomDate(sixHoursAgo, now))
    };

    MOCK_DEALER_STATUS.set(dealerId, status);
  });
};

// Function to get dealer status
export const getDealerStatus = (dealerId: string): DealerStatus | undefined => {
  return MOCK_DEALER_STATUS.get(dealerId);
};

// Function to update dealer status
export const updateDealerStatus = (dealerId: string, updates: Partial<DealerStatus>) => {
  const currentStatus = MOCK_DEALER_STATUS.get(dealerId);
  if (currentStatus) {
    MOCK_DEALER_STATUS.set(dealerId, { ...currentStatus, ...updates });
  }
};

export { updateDealerStatuses };