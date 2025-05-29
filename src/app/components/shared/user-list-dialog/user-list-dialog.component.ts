import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ViewerInfo, SortColumn, SortDirection } from '../../../models/interfaces';

@Component({
  selector: 'app-user-list-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list-dialog.component.html',
  styleUrls: ['./user-list-dialog.component.scss']
})
export class UserListDialogComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() users: ViewerInfo[] = [];
  @Input() type = '';
  @Input() title = '';
  @Input() description = '';
  @Output() close = new EventEmitter<void>();

  searchTerm = '';
  filteredUsers: ViewerInfo[] = [];
  sortColumn: SortColumn = 'lastActive';
  sortDirection: SortDirection = 'desc';

  get emptyRows(): number[] {
    const currentRows = this.filteredUsers.length;
    const minRows = 10;
    return currentRows < minRows ? Array(minRows - currentRows).fill(0) : [];
  }

  get sortedUsers(): ViewerInfo[] {
    return this.filteredUsers;
  }

  ngOnInit() {
    this.filteredUsers = [...this.users];
    this.sortUsers();
  }

  ngOnChanges() {
    this.filterUsers();
  }

  filterUsers() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.dealerId.toLowerCase().includes(term) ||
        user.type.toLowerCase().includes(term)
      );
    }
    this.sortUsers();
  }

  sort(column: SortColumn) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortUsers();
  }

  private parseDateString(dateStr: string): Date {
    const [datePart, timePart] = dateStr.split(', ');
    const [day, month, year] = datePart.split(' ');
    const [hours, minutes] = timePart.split(':');
    
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    return new Date(
      parseInt(year),
      monthMap[month],
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
  }

  private sortUsers() {
    this.filteredUsers.sort((a, b) => {
      const direction = this.sortDirection === 'asc' ? 1 : -1;
      
      if (this.sortColumn === 'lastBuy' || this.sortColumn === 'lastActive') {
        const aDate = this.parseDateString(a[this.sortColumn]);
        const bDate = this.parseDateString(b[this.sortColumn]);
        return direction * (aDate.getTime() - bDate.getTime());
      }
      
      const aValue = String(a[this.sortColumn]);
      const bValue = String(b[this.sortColumn]);
      return direction * aValue.localeCompare(bValue);
    });
  }

  onClose() {
    this.close.emit();
  }
}