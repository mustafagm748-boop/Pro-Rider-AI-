export class VoiceService {
  private recognition: any;
  private synth: SpeechSynthesis | null = null;
  private isListening: boolean = false;
  private speechTimeout: any = null;
  private voiceMode: 'formal' | 'casual' = 'formal';
  private voiceSpeed: number = 1.0;
  private unlocked: boolean = false;

  constructor() {
    this.initSpeech();
    this.attachUnlockListeners();
  }

  private initSpeech() {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
      }
    } catch {
      // Ignore audio recognition unsupported environments
    }

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }
    } catch {
      // Ignore speech synthesis unsupported environments
    }

    // Load saved voice mode & speed
    const savedMode = localStorage.getItem('pro_rider_voice_mode');
    if (savedMode === 'formal' || savedMode === 'casual') {
      this.voiceMode = savedMode;
    }

    const savedSpeed = localStorage.getItem('pro_rider_voice_speed');
    if (savedSpeed) {
      const parsed = parseFloat(savedSpeed);
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
        this.voiceSpeed = parsed;
      }
    }
  }

  // Mobile User Interaction Audio Unlock (Required for iOS Safari & Android Chrome)
  public unlockAudio() {
    if (this.unlocked || !this.synth) return;
    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0.01;
      this.synth.speak(u);
      this.unlocked = true;
    } catch (e) {
      console.warn("Audio unlock attempted:", e);
    }
  }

  private attachUnlockListeners() {
    if (typeof window === 'undefined') return;
    const unlockHandler = () => {
      this.unlockAudio();
      window.removeEventListener('touchstart', unlockHandler);
      window.removeEventListener('click', unlockHandler);
    };
    window.addEventListener('touchstart', unlockHandler, { passive: true });
    window.addEventListener('click', unlockHandler, { passive: true });
  }

  setVoiceMode(mode: 'formal' | 'casual') {
    this.voiceMode = mode;
    localStorage.setItem('pro_rider_voice_mode', mode);
  }

  getVoiceMode(): 'formal' | 'casual' {
    return this.voiceMode;
  }

  setVoiceSpeed(speed: number) {
    this.voiceSpeed = Math.max(0.5, Math.min(2.0, speed));
    localStorage.setItem('pro_rider_voice_speed', this.voiceSpeed.toString());
  }

  getVoiceSpeed(): number {
    return this.voiceSpeed;
  }

  listen(lang?: string): Promise<string> {
    this.unlockAudio();
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject('Speech recognition not supported on this browser');
        return;
      }

      if (this.isListening) {
        try {
          this.recognition.abort();
        } catch (e) {
          // ignore
        }
      }

      this.isListening = true;
      if (lang) {
        this.recognition.lang = lang;
      } else {
        this.recognition.lang = 'en-US';
      }

      this.recognition.onresult = (event: any) => {
        this.isListening = false;
        try {
          const text = event.results?.[0]?.[0]?.transcript || '';
          resolve(text);
        } catch (err) {
          reject(err);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn("SpeechRecognition notice:", event.error);
        this.isListening = false;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          reject('Microphone access denied. Please allow microphone permissions in browser settings.');
        } else {
          reject(event.error);
        }
      };
      
      this.recognition.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition.start();
      } catch (err) {
        this.isListening = false;
        reject(err);
      }
    });
  }

  speak(text: string, customLang?: string): Promise<void> {
    this.unlockAudio();
    return new Promise((resolve) => {
      if (!text || !text.trim()) {
        resolve();
        return;
      }

      if (!this.synth || typeof window === 'undefined' || !('SpeechSynthesisUtterance' in window)) {
        resolve();
        return;
      }

      try {
        if (this.speechTimeout) {
          clearTimeout(this.speechTimeout);
          this.speechTimeout = null;
        }

        this.synth.cancel();

        this.speechTimeout = setTimeout(() => {
          try {
            if (!this.synth) {
              resolve();
              return;
            }

            if (this.synth.paused) {
              this.synth.resume();
            }

            this.synth.cancel();

            console.log("Speaking text:", text);
            const utterance = new SpeechSynthesisUtterance(text);
            
            const containsUrdu = /[\u0600-\u06FF]/.test(text);
            if (customLang) {
              utterance.lang = customLang;
            } else if (containsUrdu) {
              utterance.lang = 'ur-PK';
            } else {
              utterance.lang = 'en-US';
            }

            utterance.rate = this.voiceSpeed;
            utterance.pitch = 1.0;
            utterance.volume = 1.0; // Full volume for mobile speakers

            const voices = this.synth.getVoices();
            
            const selectVoice = () => {
              if (voices && voices.length > 0) {
                const isRegional = containsUrdu || 
                                  ['ur-PK', 'pa-PK', 'ps-AF', 'sd-PK'].includes(customLang || '');
                
                if (isRegional) {
                  const regionalVoice = voices.find(v => 
                    v.lang.includes('ur') || v.lang.includes('pa') || v.lang.includes('ps') || v.lang.includes('sd') ||
                    v.name.toLowerCase().includes('urdu') || v.name.toLowerCase().includes('punjabi') || 
                    v.name.toLowerCase().includes('pakistan')
                  );
                  if (regionalVoice) utterance.voice = regionalVoice;
                } else {
                  const femaleVoice = voices.find(v => 
                    v.name.toLowerCase().includes('female') || 
                    v.name.toLowerCase().includes('google uk english female') ||
                    v.name.toLowerCase().includes('google us english female') ||
                    v.name.toLowerCase().includes('samantha')
                  );
                  if (femaleVoice) {
                    utterance.voice = femaleVoice;
                  }
                }
              }
            };
            
            if (voices.length === 0) {
              this.synth.onvoiceschanged = () => {
                selectVoice();
              };
            } else {
              selectVoice();
            }

            utterance.onend = () => {
              this.speechTimeout = null;
              resolve();
            };
            utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
              if (e.error !== 'interrupted') {
                console.error("SpeechSynthesisUtterance error:", e.error, e);
              }
              this.speechTimeout = null;
              resolve();
            };

            this.synth.speak(utterance);
          } catch (e) {
            console.error("Speech error inside timeout:", e);
            resolve();
          }
        }, 40);

      } catch (err) {
        console.error("Speech error:", err);
        resolve();
      }
    });
  }

  stop() {
    try {
      if (this.speechTimeout) {
        clearTimeout(this.speechTimeout);
        this.speechTimeout = null;
      }
      if (this.recognition) {
        this.recognition.abort();
      }
      if (this.synth) {
        this.synth.cancel();
      }
      this.isListening = false;
    } catch {
      // Ignore stop errors
    }
  }

  getUrduRideRequestStatus(ride: any, mode: 'formal' | 'casual' = this.voiceMode): string {
    const pickup = ride.pickupLocation || 'آپ کی لوکیشن';
    const dropoff = ride.dropoffLocation || 'منزل';
    
    if (mode === 'formal') {
      return `محترم صارف، ہم آپ کے لیے ${pickup} سے ${dropoff} تک کی سواری کے لیے قریبی ڈرائیورز تلاش کر رہے ہیں۔ برائے مہربانی تھوڑا انتظار فرمائیں، ہم جلد ہی آپ کو بہترین پیشکش فراہم کریں گے۔`;
    } else {
      return `یار، میں تیرے لیے ${pickup} سے ${dropoff} کے لیے ڈرائیور ڈھونڈ رہا ہوں۔ بس تھوڑی دیر رک جا، ابھی کوئی نہ کوئی تگڑا ڈرائیور مل جائے گا۔`;
    }
  }

  getUrduDriverOfferReceived(offer: any, mode: 'formal' | 'casual' = this.voiceMode): string {
    const driver = offer.driverName || 'ایک ڈرائیور';
    const fare = offer.fare || 'کچھ';
    const rating = offer.driverRating || 'بہترین';
    
    if (mode === 'formal') {
      return `آپ کو ${driver} صاحب کی طرف سے ${fare} روپے کی پیشکش موصول ہوئی ہے۔ ان کی ریٹنگ ${rating} ہے اور وہ آپ کے قریب ہی موجود ہیں۔ کیا آپ یہ سواری قبول کرنا چاہیں گے؟`;
    } else {
      return `اوئے سن، ${driver} نے ${fare} روپے مانگے ہیں۔ اس کی ریٹنگ ${rating} ہے اور وہ بالکل پاس ہی کھڑا ہے۔ بتا کیا خیال ہے، ڈن کر دوں؟`;
    }
  }

  getUrduRideConfirmation(ride: any, mode: 'formal' | 'casual' = this.voiceMode): string {
    const pickup = ride.pickupLocation || 'آپ کی لوکیشن';
    const dropoff = ride.dropoffLocation || 'منزل';
    const driver = ride.driverName || 'ڈرائیور';
    const vehicle = ride.vehicleType || 'گاڑی';

    if (mode === 'formal') {
      return `محترم صارف، آپ کی ${vehicle} سواری جو کہ ${pickup} سے ${dropoff} تک ہے، وہ کامیابی سے کنفرم ہو گئی ہے۔ ڈرائیور ${driver} صاحب اپنی ${vehicle} لے کر اب آپ کے پتے کی طرف روانہ ہو چکے ہیں۔ آپ کا سفر محفوظ اور خوشگوار ہو!`;
    } else {
      return `تیری ${vehicle} والی رائیڈ کنفرم ہو گئی ہے! ${pickup} سے ${dropoff} تک کا سین اوکے ہے۔ ${driver} بھائی اپنی ${vehicle} نکال کر تیری طرف آ رہے ہیں۔ بس اب تیار ہو جا!`;
    }
  }

  getUrduRideArrived(ride: any, mode: 'formal' | 'casual' = this.voiceMode): string {
    const driver = ride.driverName || 'ڈرائیور';
    if (mode === 'formal') {
      return `آپ کا ڈرائیور ${driver} صاحب آپ کے بتائے ہوئے مقام پر پہنچ چکے ہیں۔ آپ سے گزارش ہے کہ جلد از جلد گاڑی تک پہنچیں تاکہ سفر کا آغاز کیا جا سکے۔ پرو رائڈر استعمال کرنے کا شکریہ۔`;
    } else {
      return `تیرا ڈرائیور ${driver} آ گیا ہے! باہر نکل کر دیکھ، وہ تیرا انتظار کر رہا ہے۔ جلدی کر، دیر نہ کر!`;
    }
  }

  getUrduRideCompleted(ride: any, mode: 'formal' | 'casual' = this.voiceMode): string {
    const fare = ride.fare || 'مطلوبہ رقم';
    if (mode === 'formal') {
      return `آپ کا سفر بحسن و خوبی مکمل ہو گیا ہے۔ آپ کے سفر کا کل کرایہ ${fare} روپے ہے۔ امید ہے کہ آپ کا سفر پرو رائڈر کے ساتھ اچھا رہا ہوگا۔ برائے مہربانی ڈرائیور کو ریٹنگ دیں تاکہ ہم اپنی سروس بہتر بنا سکیں۔`;
    } else {
      return `لو جی، پہنچ گئے اپنی منزل پر! اب ${fare} روپے نکالو اور ڈرائیور کو دے دو۔ سفر کیسا رہا؟ رائیڈ کو ریٹ لازمی کرنا، اب میں چلتا ہوں، پھر ملیں گے!`;
    }
  }
}

export const voiceService = new VoiceService();

