import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleDetailsComponent as VehicleDetailsBaseComponent } from '../../components/vehicle-details/vehicle-details.component';
import { LotDetails } from '../../models/interfaces';

@Component({
  selector: 'app-vehicle-details-feature',
  standalone: true,
  imports: [
    CommonModule,
    VehicleDetailsBaseComponent
  ],
  templateUrl: './vehicle-details.component.html',
  styleUrls: ['./vehicle-details.component.scss']
})
export class VehicleDetailsFeatureComponent {
  @Input() lot: LotDetails | null = null;
  @Input() viewers = 0;
  @Input() watchers = 0;
  @Input() leads = 0;
  @Input() onlineUsers = 0;

  @Output() viewersClick = new EventEmitter<void>();
  @Output() watchersClick = new EventEmitter<void>();
  @Output() leadsClick = new EventEmitter<void>();
  @Output() onlineClick = new EventEmitter<void>();

  onViewersClick() {
    this.viewersClick.emit();
  }

  onWatchersClick() {
    this.watchersClick.emit();
  }

  onLeadsClick() {
    this.leadsClick.emit();
  }

  onOnlineClick() {
    this.onlineClick.emit();
  }
}