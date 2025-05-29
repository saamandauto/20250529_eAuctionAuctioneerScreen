import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LotDetails } from '../../models/interfaces';
import { LotStatus } from '../../models/enums';
import { LotResultDialogComponent } from '../lot-result-dialog/lot-result-dialog.component';

@Component({
  selector: 'app-lots-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LotResultDialogComponent],
  templateUrl: './lots-list.component.html',
  styleUrls: ['./lots-list.component.scss']
})
export class LotsListComponent implements OnChanges {
  @Input() lots: LotDetails[] = [];
  @Input() currentLotStatus: LotStatus = LotStatus.PENDING;
  @Output() selectLot = new EventEmitter<LotDetails>();

  expanded = false;
  searchTerm = '';
  filteredLots: LotDetails[] = [];
  selectedLot: LotDetails | null = null;
  isResultDialogOpen = false;

  ngOnInit() {
    this.filteredLots = this.lots;
    console.log('LotsListComponent initialized with', this.lots.length, 'lots');
  }

  ngOnChanges() {
    this.filterLots();
    console.log('LotsListComponent - ngOnChanges called, lots:', this.lots.length);
  }

  filterLots() {
    if (!this.searchTerm.trim()) {
      this.filteredLots = this.lots;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredLots = this.lots.filter(lot => 
      lot.lotNumber.toString().includes(term) ||
      lot.make.toLowerCase().includes(term) ||
      lot.model.toLowerCase().includes(term) ||
      (lot.status && lot.status.toLowerCase().includes(term))
    );
  }

  get displayedLots(): LotDetails[] {
    return this.expanded ? this.filteredLots : this.filteredLots.slice(0, 10);
  }

  get emptyRows(): number[] {
    const currentRows = this.displayedLots.length;
    const minRows = this.expanded ? 0 : 10;
    return currentRows < minRows ? Array(minRows - currentRows).fill(0) : [];
  }

  canSelectLot(lot: LotDetails): boolean {
    return this.currentLotStatus !== LotStatus.ACTIVE;
  }

  onSelectLot(lot: LotDetails) {
    if (lot.status === LotStatus.SOLD && lot.finalState) {
      this.selectedLot = lot;
      this.isResultDialogOpen = true;
    } else if (this.canSelectLot(lot)) {
      this.selectLot.emit(lot);
    }
  }

  closeResultDialog = () => {
    this.isResultDialogOpen = false;
    this.selectedLot = null;
  };

  toggleExpanded() {
    this.expanded = !this.expanded;
    console.log('Lots list expanded state toggled:', this.expanded);
  }
}