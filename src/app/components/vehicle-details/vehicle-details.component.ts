import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotDetails } from '../../models/interfaces';

@Component({
  selector: 'app-vehicle-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-details.component.html',
  styleUrls: ['./vehicle-details.component.scss']
})
export class VehicleDetailsComponent {
  @Input() lot: LotDetails | null = null;
  @Output() viewersClick = new EventEmitter<void>();
  @Output() watchersClick = new EventEmitter<void>();
  @Output() leadsClick = new EventEmitter<void>();
  @Output() onlineClick = new EventEmitter<void>();

  openViewersDialog() {
    this.viewersClick.emit();
  }

  openWatchersDialog() {
    this.watchersClick.emit();
  }

  openLeadsDialog() {
    this.leadsClick.emit();
  }

  onOnlineClick() {
    this.onlineClick.emit();
  }
}