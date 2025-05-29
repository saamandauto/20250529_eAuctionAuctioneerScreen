import { Message } from '../models/interfaces';

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg1',
    text: 'Important: Please check vehicle documentation before bidding',
    time: '13:04:45',
    alternate: false,
    dealer: 'Michael Brown',
    dealerId: '45678901',
    type: 'VIP',
    isRead: false
  },
  {
    id: 'msg2',
    text: 'All vehicles have been inspected and certified',
    time: '13:03:32',
    alternate: true,
    dealer: 'You',
    dealerId: 'ADMIN',
    type: 'Admin',
    isGlobal: true,
    isRead: true
  },
  {
    id: 'msg3',
    text: 'Question about Lot 7 service history',
    time: '13:02:55',
    alternate: false,
    dealer: 'Sarah Wilson',
    dealerId: '56789012',
    type: 'Premium',
    isRead: false
  },
  {
    id: 'msg4',
    text: 'Interested in multiple lots, any package deals?',
    time: '13:01:22',
    alternate: false,
    dealer: 'Daniel Kim',
    dealerId: 'DK123456',
    type: 'VIP',
    isRead: false
  },
  {
    id: 'msg5',
    text: 'Welcome to today\'s auction. Good luck with your bids!',
    time: '13:00:00',
    alternate: true,
    dealer: 'You',
    dealerId: 'ADMIN',
    type: 'Admin',
    isGlobal: true,
    isRead: true
  },
  {
    id: 'msg6',
    text: 'Need clarification on shipping options',
    time: '12:59:45',
    alternate: false,
    dealer: 'Isabella Garcia',
    dealerId: 'IG345678',
    type: 'VIP',
    isRead: false
  }
];