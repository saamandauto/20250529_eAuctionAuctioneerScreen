import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message, Dealer } from '../../models/interfaces';

@Component({
  selector: 'app-messages-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages-panel.component.html',
  styleUrls: ['./messages-panel.component.scss']
})
export class MessagesPanelComponent {
  @Input() messages: Message[] = [];
  @Input() selectedDealer: Dealer | null = null;
  @Input() dealers: Dealer[] = [];
  @Output() sendMessage = new EventEmitter<{ text: string, isGlobal: boolean }>();
  @Output() selectDealer = new EventEmitter<Dealer | null>();

  newMessage = '';
  showGlobalMessages = false;

  get filteredMessages(): Message[] {
    if (this.selectedDealer) {
      const dealerId = this.getDealerId(this.selectedDealer);
      return this.messages.filter(msg => 
        msg.dealerId === dealerId || 
        (msg.alternate && !msg.isGlobal && msg.recipientId === dealerId)
      );
    }
    
    if (this.showGlobalMessages) {
      return this.messages.filter(msg => msg.isGlobal);
    }
    
    return this.messages;
  }

  getMessagePlaceholder(): string {
    if (this.selectedDealer) {
      const dealerName = this.getDealerName(this.selectedDealer);
      return `Message ${dealerName}...`;
    }
    return this.showGlobalMessages ? 'Send announcement to all dealers...' : 'Type a message...';
  }

  // Get dealer name from dealer object
  getDealerName(dealer: Dealer): string {
    return `${dealer.FIRSTNAME || ''} ${dealer.LASTNAME || ''}`.trim();
  }

  // Get dealer ID consistently
  getDealerId(dealer: Dealer): string {
    return (dealer.USR_ID ? dealer.USR_ID.toString() : '') || 
           (dealer.ID ? dealer.ID.toString() : '');
  }

  // Get dealer name from dealer ID
  getDealerNameById(dealerId: string): string {
    const dealer = this.dealers.find(d => {
      const id = this.getDealerId(d);
      return id === dealerId;
    });
    
    if (dealer) {
      return this.getDealerName(dealer);
    }
    return 'Unknown';
  }

  clearSelectedDealer() {
    this.showGlobalMessages = false;
    this.selectDealer.emit(null);
  }

  toggleGlobalMessages() {
    this.showGlobalMessages = true;
    this.selectDealer.emit(null);
  }

  onSendMessage() {
    if (!this.newMessage.trim()) return;
    
    this.sendMessage.emit({
      text: this.newMessage,
      isGlobal: !this.selectedDealer && this.showGlobalMessages
    });
    
    this.newMessage = '';
  }

  onMessageClick(message: Message) {
    if (!message.alternate && !message.isGlobal) {
      const dealer = this.dealers.find(d => {
        const dealerId = this.getDealerId(d);
        return dealerId === message.dealerId;
      });
      
      if (dealer) {
        this.showGlobalMessages = false;
        this.selectDealer.emit(dealer);
      }
    }
  }
}