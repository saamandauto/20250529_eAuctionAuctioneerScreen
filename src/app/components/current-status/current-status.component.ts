import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotDetails } from '../../models/interfaces';

@Component({
  selector: 'app-current-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './current-status.component.html',
  styleUrls: ['./current-status.component.scss']
})
export class CurrentStatusComponent {
  @Input() lot: LotDetails | null = null;
  @Input() currentHighestBid: number | null = null;
  @Input() askingPrice = 0;
  @Input() startPrice = 0;
  @Input() lotPerformance = { value: 0, text: '-' };

  get isAboveReserve(): boolean {
    return !!this.currentHighestBid && 
           !!this.lot?.reservePrice && 
           this.currentHighestBid >= this.lot.reservePrice;
  }
}