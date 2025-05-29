import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {
  private recognition: any;
  private isListening = new BehaviorSubject<boolean>(false);
  private commandDetected = new BehaviorSubject<string>('');
  private noSpeechRetryCount = 0;
  private maxNoSpeechRetries = 3;
  private retryDelay = 1000; // 1 second delay between retries
  private retryTimeout: any = null;
  private keyDownListener: any = null;
  private keyUpListener: any = null;
  private isAltKeyHeld = false;
  private hasShownActivationToast = false;
  private sensitivity = new BehaviorSubject<number>(0.5);
  
  private commands = [
    // Auction control commands
    'start auction',
    'end auction',
    
    // Navigation commands
    'view lots',
    'show lots',
    'view auction',
    'show auction',
    
    // Lot control commands
    'next lot',
    'start lot',
    'mark as sold',
    'withdraw lot',
    'no sale',
    
    // Bidding commands
    'increase bid',
    'raise bid',
    'decrease bid',
    'lower bid',
    'place bid',
    'start bid war',
    'hammer', // Added hammer command
    
    // Simulation commands
    'toggle simulation',
    'start simulation',
    'stop simulation'
  ];

  constructor(private toastr: ToastrService) {
    this.initializeSpeechRecognition();
    this.setupKeyListeners();
  }

  private initializeSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening.next(true);
      };

      this.recognition.onend = () => {
        // Only restart recognition if we're still supposed to be listening
        if (this.isListening.value && this.isAltKeyHeld) {
          try {
            // Check if recognition is already running before starting
            setTimeout(() => {
              if (this.isListening.value && this.isAltKeyHeld) {
                try {
                  this.recognition.start();
                } catch (error) {
                  console.error('Error restarting speech recognition:', error);
                  this.isListening.next(false);
                }
              }
            }, 300); // Brief pause before restart
          } catch (error) {
            console.error('Error restarting speech recognition:', error);
            this.isListening.next(false);
          }
        } else {
          this.isListening.next(false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        
        // Handle critical errors that affect functionality
        if (event.error === 'no-speech') {
          this.noSpeechRetryCount++;
          
          // Only show an error after multiple attempts
          if (this.noSpeechRetryCount > this.maxNoSpeechRetries) {
            this.stopListening(); // Properly stop listening
          }
          
          // Clear any existing timeout before setting a new one
          if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
          }
          
          // Retry automatically without notifying the user
          this.retryTimeout = setTimeout(() => {
            if (this.isListening.value && this.isAltKeyHeld) {
              try {
                this.recognition.stop(); // Stop first to ensure clean restart
                
                // Add another timeout to ensure complete stop before restarting
                setTimeout(() => {
                  if (this.isListening.value && this.isAltKeyHeld) {
                    try {
                      this.recognition.start();
                    } catch (error) {
                      console.error('Error restarting after no-speech:', error);
                      this.isListening.next(false);
                    }
                  }
                }, 500); // Longer pause to ensure recognition has fully stopped
                
              } catch (error) {
                console.error('Error stopping speech recognition:', error);
                this.isListening.next(false);
              }
            }
          }, this.retryDelay);
        } else if (event.error === 'audio-capture') {
          this.toastr.error('No microphone was found or microphone is disabled.');
          this.stopListening();
        } else if (event.error === 'not-allowed') {
          this.toastr.error('Microphone permission was denied.');
          this.stopListening();
        } else {
          // Only show critical errors
          console.error(`Speech recognition error: ${event.error}`);
          this.stopListening();
        }
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          const confidence = event.results[i][0].confidence;
          
          // Apply sensitivity threshold
          const sensitivityThreshold = 1 - this.sensitivity.value; // Invert for intuitive control
          
          if (event.results[i].isFinal && confidence > sensitivityThreshold) {
            // Reset the no-speech retry counter when we successfully get speech
            this.noSpeechRetryCount = 0;
            
            // Check if the transcript contains any of our commands
            for (const command of this.commands) {
              if (transcript.includes(command)) {
                this.commandDetected.next(command);
                break;
              }
            }
          } else {
            interimTranscript += transcript;
          }
        }
      };
    } else {
      console.error('Web Speech API is not supported in this browser');
      this.toastr.error('Speech recognition is not supported in your browser.');
    }
  }
  
  private setupKeyListeners(): void {
    // Remove any existing listeners first
    this.removeKeyListeners();
    
    // Set up keydown listener for ALT+T key
    this.keyDownListener = (event: KeyboardEvent) => {
      // Check for ALT+T key combination
      if (event.altKey && (event.key === 't' || event.key === 'T')) {
        // Prevent the default browser behavior
        event.preventDefault();
        
        if (!this.isAltKeyHeld) {
          this.isAltKeyHeld = true;
          this.startListening();
        }
      }
    };
    
    // Set up keyup listener
    this.keyUpListener = (event: KeyboardEvent) => {
      // Check for ALT or T key
      if (event.key === 'Alt' || event.key === 't' || event.key === 'T') {
        // Prevent the default browser behavior
        event.preventDefault();
        
        this.isAltKeyHeld = false;
        this.stopListening();
      }
    };
    
    // Add the listeners
    window.addEventListener('keydown', this.keyDownListener);
    window.addEventListener('keyup', this.keyUpListener);
  }
  
  private removeKeyListeners(): void {
    // Remove existing listeners if they exist
    if (this.keyDownListener) {
      window.removeEventListener('keydown', this.keyDownListener);
      this.keyDownListener = null;
    }
    
    if (this.keyUpListener) {
      window.removeEventListener('keyup', this.keyUpListener);
      this.keyUpListener = null;
    }
  }

  public toggleListening(): void {
    if (this.isListening.value) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  private startListening(): void {
    if (!this.recognition) {
      this.toastr.error('Speech recognition is not supported in your browser.');
      return;
    }
    
    // Reset the no-speech retry counter when starting fresh
    this.noSpeechRetryCount = 0;
    
    // Clear any existing timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    try {
      // Make sure recognition is stopped before starting
      try {
        this.recognition.stop();
      } catch (error) {
        // Ignore errors when trying to stop recognition that might not be running
      }
      
      // Small delay to ensure complete stop before starting
      setTimeout(() => {
        try {
          this.recognition.start();
          
          // Only show the activation toast the first time
          if (!this.hasShownActivationToast) {
            this.toastr.success('Speech recognition activated. Try saying a command like "Start auction".');
            this.hasShownActivationToast = true;
          }
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          this.toastr.error('Failed to start speech recognition.');
          this.isListening.next(false);
        }
      }, 300);
    } catch (error) {
      console.error('Error in startListening:', error);
      this.toastr.error('Failed to start speech recognition.');
      this.isListening.next(false);
    }
  }

  private stopListening(): void {
    // Clear any pending retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    // Update state first to prevent any restart attempts
    this.isListening.next(false);
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        // Already set listening to false, so no need to do it again
      }
    }
  }

  public getIsListening(): Observable<boolean> {
    return this.isListening.asObservable();
  }

  public getCommandDetected(): Observable<string> {
    return this.commandDetected.asObservable();
  }
  
  public getSupportedCommands(): string[] {
    return [...this.commands];
  }
  
  public setSensitivity(sensitivity: number): void {
    this.sensitivity.next(sensitivity);
  }
  
  public getSensitivity(): Observable<number> {
    return this.sensitivity.asObservable();
  }

  ngOnDestroy() {
    this.removeKeyListeners();
    this.stopListening();
  }
}