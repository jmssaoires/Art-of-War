class AudioEngine {
  private ctx: AudioContext | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private masterGain: GainNode | null = null;

  // 五声音阶的基频 (宫、商、角、徵、羽)
  // 参考C大调五声：C, D, E, G, A
  private pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00];

  constructor() {
    // Lazy initialization
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // 整体音量偏弱，烘托氛围
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
    }
    return this.isMuted;
  }

  // 播放古筝风格的拨弦音
  public playPluck(noteIndex: number = Math.floor(Math.random() * 5), octave: number = 1) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // 古筝音色近似三角波混合正弦波
    osc.type = 'triangle';
    osc.frequency.value = this.pentatonicScale[noteIndex] * octave;

    osc.connect(gain);
    gain.connect(this.masterGain);

    // 包络：快速起音，带有一定衰减
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

    osc.start(t);
    osc.stop(t + 1.6);
  }

  // 播放木鱼/竹简敲击音效 (点击按钮)
  public playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // 木鱼音色短促，使用正弦波加快速包络
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // 播放浑厚的铜锣声 (进入沙盘/严重事件)
  public playGong() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    
    // 锣声由多个频率不纯的振荡器混合组成
    const freqs = [120, 160, 210, 280];
    
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = i % 2 === 0 ? 'square' : 'triangle';
      osc.frequency.value = f;
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3 / freqs.length, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 4.0);
      
      osc.start(t);
      // 微微的频率偏移模拟金属颤音
      osc.frequency.exponentialRampToValueAtTime(f * 0.95, t + 4.0);
      osc.stop(t + 4.1);
    });
  }

  // 背景氛围音 (悠远的持续风声/低沉无人声合成音)
  public startBGM() {
    if (this.isBgmPlaying || this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    this.isBgmPlaying = true;
    const t = this.ctx.currentTime;

    // 低沉宫音作为持续音(Drone)
    const droneOsc = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    
    droneOsc.type = 'sine';
    droneOsc.frequency.value = this.pentatonicScale[0] * 0.5; // 低八度
    
    droneOsc.connect(droneGain);
    droneGain.connect(this.masterGain);
    
    // 渐入
    droneGain.gain.setValueAtTime(0, t);
    droneGain.gain.linearRampToValueAtTime(0.1, t + 5.0);
    
    droneOsc.start();
    this.bgmOscillators.push(droneOsc);

    // 随机弹奏古筝音的循环调度
    const playRandomPluck = () => {
      if (!this.isBgmPlaying) return;
      
      // 以极低的概率或者悠长的间隔自动弹拨五声音阶，营造古代留白的空间感
      this.playPluck(Math.floor(Math.random() * 5), 1 + Math.floor(Math.random() * 2));
      
      // 3到8秒之间随机拨动一次
      const nextTime = 3000 + Math.random() * 5000;
      setTimeout(playRandomPluck, nextTime);
    };

    setTimeout(playRandomPluck, 2000);
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    this.bgmOscillators.forEach(osc => {
      osc.stop();
      osc.disconnect();
    });
    this.bgmOscillators = [];
  }
}

export const audio = new AudioEngine();
