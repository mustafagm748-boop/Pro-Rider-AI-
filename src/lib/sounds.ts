
export const RINGTONE_OPTIONS = [
  { id: 'classic', name: 'Classic Pulse', url: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' },
  { id: 'modern', name: 'Modern Echo', url: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' },
  { id: 'premium', name: 'Premium Chime', url: 'https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3' }
];

export const NOTIFICATION_OPTIONS = [
  { id: 'soft', name: 'Soft Ding', url: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3' },
  { id: 'bright', name: 'Bright Alert', url: 'https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3' },
  { id: 'minimal', name: 'Minimal Pop', url: 'https://assets.mixkit.co/active_storage/sfx/2360/2360-preview.mp3' }
];

class SoundService {
  private currentAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private ringInterval: any = null;
  private ringCount = 0;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play a soft, comforting acoustic bell chime (Zen Crystal Chime)
  private playBellChime() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Soft Master gain with compressor for gentle warmth
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.35, now);
      masterGain.connect(ctx.destination);

      // Primary Warm Bell Tone (E5 - 659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Soothing Harmonic Complement (B5 - 987.77Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.12);
      osc2.stop(now + 1.5);

      // Gentle Deep Ambient Resonance (E4 - 329.63Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(329.63, now);
      gain3.gain.setValueAtTime(0.15, now);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      osc3.connect(gain3);
      gain3.connect(masterGain);
      osc3.start(now);
      osc3.stop(now + 1.8);
    } catch (e) {
      console.warn('Web Audio chime playback error', e);
    }
  }

  async playRingtone(url: string, loop = true) {
    this.stop();

    // 1. Web Audio 15-Bell Ringing System
    this.ringCount = 0;
    this.playBellChime();
    this.ringCount++;

    this.ringInterval = setInterval(() => {
      if (this.ringCount < 15) {
        this.playBellChime();
        this.ringCount++;
      } else {
        this.stop();
      }
    }, 2200); // Ring every 2.2 seconds (approx 15 rings in 33-35 seconds)

    // 2. HTML5 Audio Backup
    this.currentAudio = new Audio(url);
    this.currentAudio.loop = loop;
    try {
      await this.currentAudio.play();
    } catch (err) {
      console.warn('HTML Audio playback pending interaction', err);
    }
  }

  async playNotification(url: string) {
    this.playBellChime();
    const audio = new Audio(url);
    try {
      await audio.play();
    } catch (err) {
      console.warn('Notification sound failed', err);
    }
  }

  stop() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }
}

export const soundService = new SoundService();
