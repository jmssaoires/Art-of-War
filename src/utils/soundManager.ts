class MMOAudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmTimeOuts: NodeJS.Timeout[] = [];
  private masterGain: GainNode | null = null;

  constructor() {
    // Lazy initialized to respect browser autoplay policies
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('suntzu_mmo_muted');
      this.isMuted = storedMute === 'true';
    }
  }

  setMuted(mute: boolean) {
    this.isMuted = mute;
    if (typeof window !== 'undefined') {
      localStorage.setItem('suntzu_mmo_muted', String(mute));
    }
    if (mute) {
      this.stopBGM();
    } else {
      // Don't auto start BGM on unmute unless we had state for it, but user can click to hear things.
    }
  }

  getMuted() {
    return this.isMuted;
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Deep traditional war drum beat
  playDrum() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Drum sound failed to load", e);
    }
  }

  // --- Background ambient ancient music (Guzheng/Guqin pluck simulation) ---
  playPentatonicPluck(noteIndex: number = Math.floor(Math.random() * 5), octave: number = 1) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pentatonic scale corresponding to Gong, Shang, Jiao, Zhi, Yu (Relative to C Major)
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00];

    // Ancient string instrument timbre
    osc.type = 'triangle';
    osc.frequency.value = scale[noteIndex] * octave;

    osc.connect(gain);
    gain.connect(this.masterGain);

    // Fast attack, slow decay for pluck effect
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

    osc.start(t);
    osc.stop(t + 2.1);
  }

  startBGM() {
    if (this.isBgmPlaying || this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    this.isBgmPlaying = true;
    const t = this.ctx.currentTime;

    // A low ancient drone to create historical depth
    const droneOsc = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    
    droneOsc.type = 'sine';
    // Deep note for atmosphere (Low Gong)
    droneOsc.frequency.value = 130.81; 
    
    droneOsc.connect(droneGain);
    droneGain.connect(this.masterGain);
    
    droneGain.gain.setValueAtTime(0, t);
    droneGain.gain.linearRampToValueAtTime(0.04, t + 5.0); // Gentle fade in
    
    droneOsc.start();
    this.bgmOscillators.push(droneOsc);

    // Random Guzheng-style pluck sequencer
    const playRandomPluck = () => {
      if (!this.isBgmPlaying) return;
      this.playPentatonicPluck(Math.floor(Math.random() * 5), 1 + Math.floor(Math.random() * 2));
      const nextTime = 4000 + Math.random() * 6000;
      this.bgmTimeOuts.push(setTimeout(playRandomPluck, nextTime));
    };

    this.bgmTimeOuts.push(setTimeout(playRandomPluck, 2000));
  }

  stopBGM() {
    this.isBgmPlaying = false;
    this.bgmOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.bgmOscillators = [];
    this.bgmTimeOuts.forEach(clearTimeout);
    this.bgmTimeOuts = [];
  }

  // Metal bronze bell chime (gong sound)
  playChime() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Combine multiple harmonic frequencies for bronze metallic bell timber
      const frequencies = [220, 330, 440, 554];
      frequencies.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        
        const volume = idx === 0 ? 0.25 : 0.08;
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 1.25);
      });
    } catch (e) {
      console.warn("Chime sound failed to load", e);
    }
  }

  // Coins clinking / coffers gold sound
  playCoins() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900 + i * 200, now + i * 0.08);
        osc.frequency.exponentialRampToValueAtTime(1300, now + i * 0.08 + 0.09);
        
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.15);
      }
    } catch (e) {
      console.warn("Coins sound failed to load", e);
    }
  }

  // Traditional War Horn to announce marching unit or battle start
  playHorn() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const gain2 = this.ctx.createGain();

      // Ancient brass horn texture with slightly detuned sawtooth & sine waves
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(130, now);
      osc1.frequency.linearRampToValueAtTime(145, now + 0.45);
      osc1.frequency.linearRampToValueAtTime(130, now + 0.9);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(260, now);
      osc2.frequency.linearRampToValueAtTime(290, now + 0.45);
      osc2.frequency.linearRampToValueAtTime(260, now + 0.9);

      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      gain2.gain.setValueAtTime(0.1, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    } catch (e) {
      console.warn("Horn sound failed to load", e);
    }
  }
}

export const soundManager = new MMOAudioManager();
