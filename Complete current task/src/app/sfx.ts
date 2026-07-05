// Sound Effects using Web Audio API — no external files needed
const getCtx = (() => {
  let ctx: AudioContext | null = null;
  return () => {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
})();

export const sfx = {
  /** Soft tap for buttons and nav dots */
  softClick: () => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  },

  /** Swoosh for chapter transitions */
  pageWhoosh: () => {
    try {
      const ctx = getCtx();
      const len = ctx.sampleRate * 0.3;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type = "bandpass";
      filt.frequency.value = 1000;
      filt.Q.value = 0.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      src.connect(filt).connect(gain).connect(ctx.destination);
      src.start();
    } catch {}
  },

  /** Wax seal pop + rising chime for envelope opens */
  envelopeOpen: () => {
    try {
      const ctx = getCtx();
      // Pop
      const nSrc = ctx.createBufferSource();
      const nBuf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
      const nD = nBuf.getChannelData(0);
      for (let i = 0; i < nD.length; i++) nD[i] = Math.random() * 2 - 1;
      nSrc.buffer = nBuf;
      const nG = ctx.createGain();
      nG.gain.setValueAtTime(0.08, ctx.currentTime);
      nG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      nSrc.connect(nG).connect(ctx.destination);
      nSrc.start();
      // Rising chime
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.02);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.09, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(g).connect(ctx.destination);
      osc.start(ctx.currentTime + 0.02);
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  },

  /** Gentle three-note chime for star twinkle and reveals */
  chime: () => {
    try {
      const ctx = getCtx();
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.07, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    } catch {}
  },

  /** Mechanical shutter click for camera snap */
  cameraShutter: () => {
    try {
      const ctx = getCtx();
      [0, 0.07].forEach((delay) => {
        const src = ctx.createBufferSource();
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.025, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = "highpass";
        filt.frequency.value = 3000;
        const g = ctx.createGain();
        const t = ctx.currentTime + delay;
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
        src.connect(filt).connect(g).connect(ctx.destination);
        src.start(t);
      });
    } catch {}
  },

  /** High sparkle pings for gacha/confetti */
  sparkle: () => {
    try {
      const ctx = getCtx();
      [1200, 1600, 2000].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.07;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.05, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch {}
  },

  /** Short beep for countdown 3, 2, 1 */
  countdownBeep: () => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  },

  /** Higher-pitched snap for the final countdown "0" moment */
  countdownSnap: () => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 1320;
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  },

  /** Soft warm tone for typewriter text completion */
  warmPing: () => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 440;
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  },
};
