import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface KeyboardShortcut {
  key: string;
  alt: boolean;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutService {
  // Subject to communicate shortcuts should be shown/hidden in UI
  private showShortcutsInUI = new BehaviorSubject<boolean>(false);

  // Define all available shortcuts
  private shortcuts: KeyboardShortcut[] = [
    { key: 'x', alt: true, description: 'Move to Next Lot / Start Lot' },
    { key: 'h', alt: true, description: 'Hammer' },
    { key: 'r', alt: true, description: 'Random Bid' },
    { key: '1', alt: true, description: 'Bid User 1' },
    { key: '2', alt: true, description: 'Bid User 2' },
    { key: 'w', alt: true, description: 'Bid War' },
    { key: 'q', alt: true, description: 'Toggle Simulated Bidding' },
    { key: 't', alt: true, description: 'Talk (Speech Recognition)' },
    { key: 's', alt: true, description: 'Settings' }
  ];

  constructor() {}

  getShortcuts(): KeyboardShortcut[] {
    return this.shortcuts;
  }

  getShowShortcutsInUI() {
    return this.showShortcutsInUI.asObservable();
  }

  toggleShowShortcutsInUI() {
    this.showShortcutsInUI.next(!this.showShortcutsInUI.value);
  }

  setShowShortcutsInUI(show: boolean) {
    this.showShortcutsInUI.next(show);
  }

  /**
   * Checks if a keyboard event matches a specific shortcut
   */
  isShortcutMatch(event: KeyboardEvent, shortcutKey: string): boolean {
    return event.altKey && event.key.toLowerCase() === shortcutKey.toLowerCase();
  }
}