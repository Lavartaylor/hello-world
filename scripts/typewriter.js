import { clickKey, dingBell } from "/scripts/audio.js";

// Type a string into a target element, character by character,
// with random per-keystroke jitter so it doesn't feel mechanical.
//
// Supports inline tags via a bracketed mini-syntax:
//   [name]Marigold Vance[/name]   -> <span class="name">Marigold Vance</span>
//   [d]12[/d]                     -> <span class="d">12</span>
// Anything not bracketed types as plain text.

export function typeInto(el, text, opts = {}) {
  const baseSpeed = opts.speed ?? 75;          // ms per char baseline
  const jitter = opts.jitter ?? 35;            // +/- ms variance
  const punctuationPause = opts.punctPause ?? 280;
  const sentencePause = opts.sentencePause ?? 600;
  const clicks = opts.clicks ?? true;
  const ding = opts.ding ?? true;
  const endDing = opts.endDing ?? true;       // beep when the whole block finishes
  const userOnDone = opts.onDone;
  const onDone = () => {
    if (endDing) dingBell({ volume: 0.08 });
    if (userOnDone) userOnDone();
  };

  el.innerHTML = "";

  // Tokenize: array of {kind: "text"|"open"|"close", value}
  const tokens = tokenize(text);
  let stack = [el]; // current insertion target stack
  let i = 0;
  let cancelled = false;

  function topNode() { return stack[stack.length - 1]; }

  function appendText(ch) {
    topNode().appendChild(document.createTextNode(ch));
  }

  function step() {
    if (cancelled) return;
    if (i >= tokens.length) {
      if (onDone) onDone();
      return;
    }
    const tok = tokens[i++];

    if (tok.kind === "open") {
      const span = document.createElement("span");
      span.className = tok.value;
      topNode().appendChild(span);
      stack.push(span);
      step();
      return;
    }
    if (tok.kind === "close") {
      stack.pop();
      step();
      return;
    }

    // text — character by character
    typeText(tok.value, step);
  }

  function typeText(str, after) {
    let j = 0;
    function next() {
      if (cancelled) return;
      if (j >= str.length) { after(); return; }
      const ch = str[j++];
      if (ch === "\n") {
        topNode().appendChild(document.createElement("br"));
        if (ding) dingBell();
        setTimeout(next, baseSpeed * 4);
        return;
      }
      appendText(ch);
      if (clicks && /\S/.test(ch)) clickKey();
      let delay = baseSpeed + (Math.random() * 2 - 1) * jitter;
      if (/[.!?]/.test(ch)) delay += sentencePause;
      else if (/[,;:]/.test(ch)) delay += punctuationPause;
      setTimeout(next, Math.max(8, delay));
    }
    next();
  }

  step();

  return {
    cancel() {
      cancelled = true;
    },
    skip() {
      cancelled = true;
      el.innerHTML = renderFinal(tokens);
      if (onDone) onDone();
    }
  };
}

function tokenize(text) {
  const out = [];
  const re = /\[(\/?)([a-zA-Z][\w-]*)\]/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: "text", value: text.slice(last, m.index) });
    out.push({ kind: m[1] === "/" ? "close" : "open", value: m[2] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}

function renderFinal(tokens) {
  let html = "";
  for (const t of tokens) {
    if (t.kind === "text") html += escapeHTML(t.value).replace(/\n/g, "<br>");
    else if (t.kind === "open") html += `<span class="${escapeHTML(t.value)}">`;
    else if (t.kind === "close") html += `</span>`;
  }
  return html;
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
