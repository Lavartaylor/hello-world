// Web Audio synthesized typewriter clicks.
// Synthesized rather than file-based so there's no asset dependency
// and pitch can vary per keystroke.

let ctx = null;
let unlocked = false;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

export function unlockAudio() {
  ensureCtx();
  if (ctx.state === "suspended") ctx.resume();
  unlocked = true;
}

export function setMuted(value) {
  muted = !!value;
}

export function isMuted() {
  return muted;
}

// One typewriter keystroke. Short noise burst with a steep envelope.
export function clickKey(opts = {}) {
  if (muted || !unlocked) return;
  const c = ensureCtx();
  const now = c.currentTime;
  const dur = 0.045 + Math.random() * 0.02;

  // Noise buffer
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.4);
  }
  const src = c.createBufferSource();
  src.buffer = buf;

  // Bandpass to make it sound like a key, not white noise
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800 + Math.random() * 1400;
  bp.Q.value = 1.2;

  // Click envelope
  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime((opts.volume ?? 0.18), now + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(bp).connect(g).connect(c.destination);
  src.start(now);
  src.stop(now + dur);
}

// Continuous TV/VCR static hiss — a soft, bandwidth-limited noise loop.
// Used during the broadcast version so the page sounds like dead air on a CRT.
let hissNodes = null;
export function startHiss(opts = {}) {
  if (muted || !unlocked) return;
  if (hissNodes) return; // already playing
  const c = ensureCtx();
  const seconds = 4;
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  // Pink-ish noise: weighted sum of random samples gives a softer sound than white
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  // High-pass: kills low rumble. Low-pass: keeps it gentle (TV-hiss frequency band).
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 600;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 5500;
  const g = c.createGain();
  g.gain.value = 0; // ramp in
  src.connect(hp).connect(lp).connect(g).connect(c.destination);
  src.start();
  const now = c.currentTime;
  g.gain.linearRampToValueAtTime(opts.volume ?? 0.07, now + 0.4);
  hissNodes = { src, gain: g };
}

export function stopHiss() {
  if (!hissNodes) return;
  const c = ensureCtx();
  const now = c.currentTime;
  const { src, gain } = hissNodes;
  hissNodes = null;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.4);
  setTimeout(() => { try { src.stop(); } catch {} }, 500);
}

// Carriage return ding for line breaks (Selectric-style).
export function dingBell(opts = {}) {
  if (muted || !unlocked) return;
  const c = ensureCtx();
  const now = c.currentTime;
  const o1 = c.createOscillator();
  const o2 = c.createOscillator();
  o1.type = "sine"; o2.type = "sine";
  o1.frequency.value = 1760;
  o2.frequency.value = 2640;
  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime((opts.volume ?? 0.12), now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  o1.connect(g); o2.connect(g);
  g.connect(c.destination);
  o1.start(now); o2.start(now);
  o1.stop(now + 0.6); o2.stop(now + 0.6);
}
