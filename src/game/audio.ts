let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.04) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + dur);
}

export const sfx = {
  tap: () => beep(420, 0.05, "triangle", 0.03),
  cat: () => {
    beep(520, 0.08, "sine", 0.045);
    setTimeout(() => beep(740, 0.1, "sine", 0.03), 60);
  },
  mark: () => beep(280, 0.06, "square", 0.02),
  error: () => beep(160, 0.18, "sawtooth", 0.05),
  win: () => {
    beep(523, 0.12, "sine", 0.05);
    setTimeout(() => beep(659, 0.12, "sine", 0.05), 110);
    setTimeout(() => beep(784, 0.22, "sine", 0.05), 220);
  },
  lose: () => beep(110, 0.35, "triangle", 0.05),
  hint: () => beep(880, 0.09, "sine", 0.035),
};
