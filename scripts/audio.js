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
