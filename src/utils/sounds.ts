// Звуковой менеджер — Web Audio API, без внешних файлов

class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  // Проиграть ноту
  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) { /* Audio blocked */ }
  }

  // 🔔 Игрок вызван
  playerCalled() {
    this.playTone(880, 0.15, 'sine', 0.12);
    setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.12), 150);
    setTimeout(() => this.playTone(1320, 0.2, 'sine', 0.15), 300);
  }

  // 🃏 Карта открыта
  cardRevealed() {
    try {
      const ctx = this.getContext();
      // Swoosh sound via noise
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.15 * Math.sin(t * Math.PI);
      }
      const source = ctx.createBufferSource();
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 2000;
      bandpass.Q.value = 0.5;
      source.buffer = buffer;
      source.connect(bandpass);
      bandpass.connect(ctx.destination);
      source.start();
    } catch (e) { /* */ }
    // Plus a rising tone
    this.playTone(400, 0.2, 'triangle', 0.1);
    setTimeout(() => this.playTone(600, 0.15, 'triangle', 0.08), 100);
  }

  // ✅ Подтверждение хода
  confirmTurn() {
    this.playTone(523, 0.1, 'sine', 0.08);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.08), 100);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.1), 200);
  }

  // 🗳️ Начало голосования
  votingStart() {
    this.playTone(220, 0.3, 'sawtooth', 0.08);
    setTimeout(() => this.playTone(220, 0.3, 'sawtooth', 0.08), 400);
    setTimeout(() => this.playTone(330, 0.5, 'sawtooth', 0.1), 800);
  }

  // 💀 Исключение
  elimination() {
    this.playTone(200, 0.4, 'sawtooth', 0.1);
    setTimeout(() => this.playTone(150, 0.4, 'sawtooth', 0.1), 400);
    setTimeout(() => this.playTone(100, 0.8, 'sawtooth', 0.12), 800);
  }

  // 🏆 Победа
  victory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.12), i * 200);
    });
    setTimeout(() => {
      this.playTone(1047, 0.8, 'triangle', 0.15);
    }, 800);
  }

  // ☣️ Сирена катастрофы
  catastropheAlarm() {
    const siren = (start: number) => {
      try {
        const ctx = this.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.06, ctx.currentTime + start);
        osc.frequency.setValueAtTime(400, ctx.currentTime + start);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + start + 1);
        osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + start + 2);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 2.5);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + 2.5);
      } catch (e) { /* */ }
    };
    siren(0);
    siren(2.5);
  }

  // 🗳️ Голос отдан
  voteCast() {
    this.playTone(660, 0.1, 'sine', 0.06);
    setTimeout(() => this.playTone(880, 0.1, 'sine', 0.08), 80);
  }

  // ⏱️ Тикание таймера
  timerTick() {
    this.playTone(1000, 0.05, 'sine', 0.04);
  }

  // Кнопка нажата
  buttonClick() {
    this.playTone(800, 0.05, 'sine', 0.05);
  }
}

export const sounds = new SoundManager();
