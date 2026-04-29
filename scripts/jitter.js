// Hand-jitter — micro-transforms on text/elements to break grid stiffness.
// Seeded pseudo-random so the same content always jitters the same way.

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Apply per-character jitter to all text inside an element.
// Wraps each character in a <span>, then applies seeded transforms.
export function jitterChars(el, opts = {}) {
  const seed = opts.seed ?? hashString(el.textContent || "jitter");
  const rand = mulberry32(seed);
  const maxRot = opts.maxRot ?? 3.5;        // deg
  const maxShift = opts.maxShift ?? 1.5;    // px
  const maxScale = opts.maxScale ?? 0.06;   // proportional

  const text = el.textContent;
  el.textContent = "";
  for (const ch of text) {
    if (ch === " ") {
      el.appendChild(document.createTextNode(" "));
      continue;
    }
    const span = document.createElement("span");
    span.textContent = ch;
    const rot = (rand() * 2 - 1) * maxRot;
    const dx = (rand() * 2 - 1) * maxShift;
    const dy = (rand() * 2 - 1) * maxShift;
    const sc = 1 + (rand() * 2 - 1) * maxScale;
    span.style.display = "inline-block";
    span.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    el.appendChild(span);
  }
}

// Apply gentle per-element jitter to multiple children.
export function jitterEls(els, opts = {}) {
  const seed = opts.seed ?? 1;
  const rand = mulberry32(seed);
  const maxRot = opts.maxRot ?? 1.5;
  const maxShift = opts.maxShift ?? 2;
  els.forEach(el => {
    const rot = (rand() * 2 - 1) * maxRot;
    const dx = (rand() * 2 - 1) * maxShift;
    const dy = (rand() * 2 - 1) * maxShift;
    el.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;
  });
}
