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
  g.gain.linearRampToValueAtTime(opts.volume ?? 0.035, now + 0.4); // dialed back from 0.07
  hissNodes = { src, gain: g };
}

// Channel-change click — hard transient + low thump, fires on .key button clicks.
export function channelClick() {
  if (muted || !unlocked) return;
  const c = ensureCtx();
  const now = c.currentTime;

  // Sharp click transient
  const dur = 0.04;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.4);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.value = 1200;
  const cg = c.createGain();
  cg.gain.setValueAtTime(0, now);
  cg.gain.linearRampToValueAtTime(0.32, now + 0.002);
  cg.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(hp).connect(cg).connect(c.destination);
  src.start(now); src.stop(now + dur);

  // Low thump — descending pitch for the channel-flip feel
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(140, now);
  o.frequency.exponentialRampToValueAtTime(45, now + 0.09);
  const og = c.createGain();
  og.gain.setValueAtTime(0, now);
  og.gain.linearRampToValueAtTime(0.13, now + 0.005);
  og.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
  o.connect(og).connect(c.destination);
  o.start(now); o.stop(now + 0.12);
}

// Random radio interference — fires every 8–18 seconds while broadcast is up.
// Three flavors so it doesn't sound looped.
export function radioBlip() {
  if (muted || !unlocked) return;
  const c = ensureCtx();
  const now = c.currentTime;
  const variant = Math.floor(Math.random() * 3);

  if (variant === 0) {
    // Brief swept tone — distant signal warble
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(700 + Math.random() * 500, now);
    o.frequency.exponentialRampToValueAtTime(180 + Math.random() * 220, now + 0.32);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.04, now + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    o.connect(g).connect(c.destination);
    o.start(now); o.stop(now + 0.5);
  } else if (variant === 1) {
    // Static crackle burst
    const dur = 0.16 + Math.random() * 0.1;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1300 + Math.random() * 1700;
    f.Q.value = 0.6;
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.05, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(now); src.stop(now + dur);
  } else {
    // Faint morse-like pulses
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "square";
    o.frequency.value = 580 + Math.random() * 320;
    g.gain.setValueAtTime(0, now);
    const pulses = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < pulses; i++) {
      const t = now + i * 0.13;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.035, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    }
    o.connect(g).connect(c.destination);
    o.start(now); o.stop(now + pulses * 0.13 + 0.1);
  }
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

// Drop a one-time tap gate on the page. Once a user taps the gate on any
// page, the unlocked flag is stored in sessionStorage so subsequent pages
// in the same browser tab skip the gate entirely.
export function ensureAudioReady({ label = "▸ tap to begin transmission", onReady } = {}) {
  const already = sessionStorage.getItem("capitol_audio_unlocked") === "1";
  if (already) {
    // Try to resume audio silently. If the browser's autoplay policy blocks,
    // wait for the next user interaction anywhere on the page.
    try { unlockAudio(); startHiss(); } catch {}
    document.addEventListener("click", () => {
      try { unlockAudio(); startHiss(); } catch {}
    }, { once: true });
    if (onReady) onReady();
    return;
  }
  const gate = document.createElement("div");
  gate.style.cssText = "position:fixed;inset:0;z-index:50;display:grid;place-items:center;cursor:pointer;background:rgba(0,0,0,0.4);color:#e8d49a;font-family:var(--font-utility);font-size:0.75rem;text-transform:uppercase;letter-spacing:0;font-weight:500;";
  gate.textContent = label;
  document.body.appendChild(gate);
  gate.addEventListener("click", () => {
    unlockAudio();
    startHiss();
    sessionStorage.setItem("capitol_audio_unlocked", "1");
    gate.style.transition = "opacity 0.4s";
    gate.style.opacity = "0";
    setTimeout(() => gate.remove(), 400);
    if (onReady) onReady();
  }, { once: true });
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
