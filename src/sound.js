import { Platform } from 'react-native';

let ctx = null;

// A short, quiet bell made with Web Audio, so there is no sound file to ship. Web only.
export function ding() {
  if (Platform.OS !== 'web') return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.07, t + 0.008);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    out.connect(ctx.destination);
    // Fundamental plus a softer upper partial gives the bell its shimmer.
    [[1318.5, 1], [2637, 0.35], [3951, 0.12]].forEach(([freq, level]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = level;
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + 0.75);
    });
  } catch {
    // Sound is a nicety; never let it break logging a set.
  }
}
