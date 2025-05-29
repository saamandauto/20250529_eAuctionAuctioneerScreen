import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dealer, Message, MessageCount, DealerFilter, DealerStatus } from '../../models/interfaces';
import { getDealerStatus } from '../../data/mock-dealer-status';

@Component({
  selector: 'app-dealers-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dealers-list.component.html',
  styleUrls: ['./dealers-list.component.scss']
})
export class DealersListComponent implements OnInit, OnChanges {
  @Input() dealers: Dealer[] = [];
  @Input() messages: Message[] = [];
  @Input() selectedDealer: Dealer | null = null;
  @Output() selectDealer = new EventEmitter<Dealer>();
  
  expanded = false;
  searchTerm = '';
  filteredDealers: Dealer[] = [];
  currentFilter: DealerFilter = 'all';

  ngOnInit() {
    console.log('DealersListComponent initialized with dealers:', this.dealers?.length);
    this.filterDealers();
  }

  ngOnChanges() {
    console.log('DealersListComponent - dealers changed:', this.dealers?.length);
    this.filterDealers();
  }

  // Helper methods for the template
  getDealerName(dealer: Dealer): string {
    return `${dealer.FIRSTNAME || ''} ${dealer.LASTNAME || ''}`.trim();
  }

  getDealerId(dealer: Dealer): string {
    return (dealer.USR_ID ? dealer.USR_ID.toString() : '') || 
           (dealer.ID ? dealer.ID.toString() : '');
  }

  setFilter(filter: DealerFilter) {
    this.currentFilter = filter;
    this.filterDealers();
    // Reset to first page when changing filters
    this.expanded = false;
  }

  filterDealers() {
    console.log('DealersListComponent - filterDealers called with dealers:', this.dealers?.length);
    
    if (!this.dealers || this.dealers.length === 0) {
      console.warn('No dealers available to filter');
      this.filteredDealers = [];
      return;
    }
    
    // First filter out bid users
    let dealers = this.dealers.filter(d => {
      const type = d.TYPE;
      return type !== 'Bid User 1' && type !== 'Bid User 2';
    });

    console.log('DealersListComponent - after filtering bid users:', dealers.length);

    // Apply status filter
    if (this.currentFilter !== 'all') {
      dealers = dealers.filter(dealer => {
        const dealerId = this.getDealerId(dealer);
        if (!dealerId) {
          console.log('Dealer missing ID:', dealer);
          return false;
        }
        
        const status = getDealerStatus(dealerId);
        if (!status) {
          console.log('No status found for dealer:', dealerId);
          return false;
        }

        switch (this.currentFilter) {
          case 'viewers': return status.isViewer;
          case 'watchers': return status.isWatcher;
          case 'leads': return status.isLead;
          case 'online': return status.isOnline;
          default: return true;
        }
      });
      
      console.log('DealersListComponent - after applying status filter:', dealers.length);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      dealers = dealers.filter(dealer => {
        const name = this.getDealerName(dealer);
        const dealerId = this.getDealerId(dealer);
        const type = dealer.TYPE;
        
        return name.toLowerCase().includes(term) ||
          (dealerId && dealerId.toLowerCase().includes(term)) ||
          (type && type.toLowerCase().includes(term)) ||
          dealer.companyName?.toLowerCase().includes(term) ||
          dealer.companyType?.toLowerCase().includes(term) ||
          dealer.city?.toLowerCase().includes(term) ||
          dealer.country?.toLowerCase().includes(term) ||
          dealer.FIRSTNAME?.toLowerCase().includes(term) ||
          dealer.LASTNAME?.toLowerCase().includes(term);
      });
      
      console.log('DealersListComponent - after applying search filter:', dealers.length);
    }

    // Sort alphabetically using name from either format
    this.filteredDealers = [...dealers].sort((a, b) => {
      const nameA = this.getDealerName(a);
      const nameB = this.getDealerName(b);
      return nameA.localeCompare(nameB);
    });
    
    console.log('DealersListComponent - final filtered dealers count:', this.filteredDealers.length);
  }

  get displayedDealers(): Dealer[] {
    return this.expanded ? this.filteredDealers : this.filteredDealers.slice(0, 10);
  }

  get emptyRows(): number[] {
    const currentRows = this.displayedDealers.length;
    const minRows = this.expanded ? 0 : 10;
    return currentRows < minRows ? Array(minRows - currentRows).fill(0) : [];
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
    console.log('Dealers list expanded state toggled:', this.expanded);
  }

  getDealerTooltip(dealer: Dealer): string {
    const dealerId = this.getDealerId(dealer);
    const status = getDealerStatus(dealerId || '');
    const lastActive = status ? `\nLast Active: ${status.lastActive}` : '';
    const lastBuy = dealer.LASTBUY ? `\nLast Buy: ${dealer.LASTBUY}` : '';
    const lastLogin = dealer.LASTLOGIN ? `\nLast Login: ${dealer.LASTLOGIN}` : '';
    
    return `
Company: ${dealer.companyName || 'N/A'}
Type: ${dealer.TYPE || 'N/A'}
Location: ${dealer.city || 'N/A'}, ${dealer.country || 'N/A'}
ID: ${dealerId}${lastActive}${lastBuy}${lastLogin}
    `.trim();
  }

  getDealerStatus(dealerId: string): DealerStatus | undefined {
    return getDealerStatus(dealerId);
  }

  getMessageCount(dealerId: string): MessageCount {
    const dealerMessages = this.messages.filter(m => 
      m.dealerId === dealerId && !m.alternate && !m.isGlobal
    );
    const unreadMessages = dealerMessages.filter(m => !m.isRead);
    
    return {
      total: dealerMessages.length,
      unread: unreadMessages.length
    };
  }

  onDealerClick(dealer: Dealer) {
    console.log('DealersListComponent - dealer clicked:', this.getDealerName(dealer));
    this.selectDealer.emit(dealer);
  }

  isSelected(dealer: Dealer): boolean {
    if (!this.selectedDealer) return false;
    
    const dealerId = this.getDealerId(dealer);
    const selectedId = this.getDealerId(this.selectedDealer);
    
    return dealerId === selectedId;
  }
}