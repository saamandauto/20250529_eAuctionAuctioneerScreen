import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { LotDetails, ViewerInfo, SortColumn, SortDirection } from '../../models/interfaces';
import { UserListDialogComponent } from '../shared/user-list-dialog/user-list-dialog.component';
import { MOCK_VIEWERS } from '../../data/mock-viewers';
import { MOCK_WATCHERS } from '../../data/mock-watchers';
import { MOCK_LEADS } from '../../data/mock-leads';
import { MOCK_ONLINE } from '../../data/mock-online';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-planned-lots',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    UserListDialogComponent,
    CdkDrag,
    CdkDropList
  ],
  templateUrl: './planned-lots.component.html',
  styleUrls: ['./planned-lots.component.scss'],
  host: {
    '[style.--toggle-visible]': '"none"'
  }
})
export class PlannedLotsComponent implements OnInit {
  @Input() lots: LotDetails[] = [];
  @Output() lotUpdated = new EventEmitter<{lotNumber: number, field: string, value: number}>();
  @Output() lotsReordered = new EventEmitter<LotDetails[]>();
  
  // Editing state
  editMode: {[key: number]: {reservePrice: boolean, initialAskingPrice: boolean}} = {};
  
  // Sorting state
  sortColumn: string = 'lotNumber';
  sortDirection: SortDirection = 'asc';
  
  // View mode (compact or detailed)
  viewMode: 'compact' | 'detailed' = 'compact';
  
  // Track if toggle button should be visible based on screen width
  isToggleVisible = false;
  
  // Dialog state
  selectedLot: LotDetails | null = null;
  isViewersDialogOpen = false;
  isWatchersDialogOpen = false;
  isLeadsDialogOpen = false;
  isOnlineDialogOpen = false;
  viewers: ViewerInfo[] = [];
  watchers: ViewerInfo[] = [];
  leads: ViewerInfo[] = [];
  onlineUsers: ViewerInfo[] = [];

  // Reordering state
  isDragEnabled = false;
  
  constructor(private toastr: ToastrService) {}
  
  ngOnInit() {
    this.updateToggleVisibility();
    window.addEventListener('resize', this.updateToggleVisibility.bind(this));
  }
  
  ngOnDestroy() {
    window.removeEventListener('resize', this.updateToggleVisibility.bind(this));
  }
  
  updateToggleVisibility() {
    const width = window.innerWidth;
    this.isToggleVisible = width >= 1025 && width <= 1620;
  }
  
  get sortedLots(): LotDetails[] {
    if (this.isDragEnabled) {
      return [...this.lots];
    }
    
    return [...this.lots].sort((a, b) => {
      const direction = this.sortDirection === 'asc' ? 1 : -1;
      
      // Handle different column types appropriately
      if (['lotNumber', 'year', 'mileage', 'reservePrice', 'initialAskingPrice', 
           'lastAuctionBid', 'indicataMarketPrice', 'viewers', 'watchers', 
           'leadListUsers', 'onlineUsers'].includes(this.sortColumn)) {
        const aValue = a[this.sortColumn as keyof LotDetails] as number;
        const bValue = b[this.sortColumn as keyof LotDetails] as number;
        return direction * ((aValue || 0) - (bValue || 0));
      }
      
      // Handle string columns
      const aValue = String(a[this.sortColumn as keyof LotDetails] || '');
      const bValue = String(b[this.sortColumn as keyof LotDetails] || '');
      return direction * aValue.localeCompare(bValue);
    });
  }
  
  // Toggle between compact and detailed view
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'compact' ? 'detailed' : 'compact';
  }
  
  // Sorting methods
  sort(column: string): void {
    // Don't sort if we're in reordering mode
    if (this.isDragEnabled) {
      return;
    }
    
    if (column === 'dealerActivity') return; // Don't sort the dealer activity column
    
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }
  
  // Toggle drag and drop mode
  toggleDragMode(): void {
    this.isDragEnabled = !this.isDragEnabled;
    if (this.isDragEnabled) {
      this.toastr.info('Lot reordering enabled. Drag lots to change their order.', '', {
        timeOut: 5000
      });
    } else {
      this.toastr.info('Lot reordering disabled.', '', {
        timeOut: 3000
      });
    }
  }
  
  // Handle drop event for drag and drop
  onDrop(event: CdkDragDrop<LotDetails[]>): void {
    if (this.isDragEnabled) {
      // First make a copy of the array to maintain immutability
      const newLots = [...this.lots];
      
      // Move the item in the array
      moveItemInArray(newLots, event.previousIndex, event.currentIndex);
      
      // Renumber lot numbers to maintain order
      const reorderedLots = newLots.map((lot, index) => ({
        ...lot,
        lotNumber: index + 1
      }));
      
      // Emit the reordered lots to parent component
      this.lotsReordered.emit(reorderedLots);
      
      this.toastr.success(`Lot ${event.item.data.lotNumber} moved to position ${event.currentIndex + 1}`);
    }
  }
  
  // Editing methods
  startEdit(lotNumber: number, field: string): void {
    if (!this.editMode[lotNumber]) {
      this.editMode[lotNumber] = { reservePrice: false, initialAskingPrice: false };
    }
    this.editMode[lotNumber][field as keyof typeof this.editMode[number]] = true;
  }
  
  saveEdit(lot: LotDetails, field: string, value: number): void {
    if (this.editMode[lot.lotNumber]) {
      this.editMode[lot.lotNumber][field as keyof typeof this.editMode[number]] = false;
      this.lotUpdated.emit({lotNumber: lot.lotNumber, field, value});
    }
  }
  
  cancelEdit(lotNumber: number, field: string): void {
    if (this.editMode[lotNumber]) {
      this.editMode[lotNumber][field as keyof typeof this.editMode[number]] = false;
    }
  }
  
  isEditing(lotNumber: number, field: string): boolean {
    return this.editMode[lotNumber]?.[field as keyof typeof this.editMode[number]] || false;
  }
  
  // Dialog methods
  openViewersDialog(lot: LotDetails): void {
    this.selectedLot = lot;
    this.viewers = MOCK_VIEWERS.get(lot.lotNumber) || [];
    this.isViewersDialogOpen = true;
  }
  
  closeViewersDialog(): void {
    this.isViewersDialogOpen = false;
  }
  
  openWatchersDialog(lot: LotDetails): void {
    this.selectedLot = lot;
    this.watchers = MOCK_WATCHERS.get(lot.lotNumber) || [];
    this.isWatchersDialogOpen = true;
  }
  
  closeWatchersDialog(): void {
    this.isWatchersDialogOpen = false;
  }
  
  openLeadsDialog(lot: LotDetails): void {
    this.selectedLot = lot;
    this.leads = MOCK_LEADS.get(lot.lotNumber) || [];
    this.isLeadsDialogOpen = true;
  }
  
  closeLeadsDialog(): void {
    this.isLeadsDialogOpen = false;
  }
  
  openOnlineDialog(lot: LotDetails): void {
    this.selectedLot = lot;
    this.onlineUsers = MOCK_ONLINE.get(lot.lotNumber) || [];
    this.isOnlineDialogOpen = true;
  }
  
  closeOnlineDialog(): void {
    this.isOnlineDialogOpen = false;
  }

  // Utility method for mapping column names
  getSortColumnName(column: string): string {
    const columnMapping: {[key: string]: string} = {
      'lotNumber': 'Lot No.',
      'make model': 'Vehicle',
      'year': 'Year',
      'transmission': 'Transmission',
      'fuel': 'Fuel',
      'color': 'Color',
      'mileage': 'Mileage',
      'location': 'Location',
      'registration': 'Registration',
      'reservePrice': 'Reserve Price',
      'initialAskingPrice': 'Asking Price',
      'lastAuctionBid': 'Last Auction',
      'indicataMarketPrice': 'Indicata Price'
    };
    return columnMapping[column] || column;
  }
}