// Sons simples gerados na hora (sem arquivos de áudio, sem downloads).

let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

// Navegadores só liberam áudio depois de um toque/tecla do jogador.
export function unlockAudio() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    ctx = new AC();
  } catch {
    ctx = null;
  }
}

function tone(freq, duration = 0.08, type = 'sine', volume = 0.15, delay = 0) {
  if (muted || !ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  move: () => tone(330, 0.03, 'square', 0.04),
  rotate: () => tone(520, 0.05, 'triangle', 0.08),
  land: () => tone(140, 0.08, 'sine', 0.15),
  clear: (chain) => {
    const base = 440 + Math.min(chain, 6) * 80;
    tone(base, 0.1, 'triangle', 0.15);
    tone(base * 1.5, 0.12, 'triangle', 0.12, 0.08);
  },
  levelup: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.08, i * 0.09)),
  gameover: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.2, 'sawtooth', 0.07, i * 0.15)),
};
