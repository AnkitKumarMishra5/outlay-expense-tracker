export type Cue =
  | "flip"
  | "select"
  | "tick"
  | "success"
  | "error"
  /** A bill cleared: bright ka-ching with a shimmer tail. */
  | "settle"
  /** A bill put back in what is owed. */
  | "unsettle"
  /** The model starts reading a statement. */
  | "scan"
  /** The model finished: a rising sparkle. */
  | "sparkle"
  /** Files landed in the drop zone. */
  | "drop"
  /** A statement was read. */
  | "read"
  /** Something was removed. */
  | "delete"
  /** The session locked. */
  | "lock"
  /** Cards flicking past each other as the deck reorders. */
  | "riffle"
  /** One card sliding over another. */
  | "slide"
  /** A card landing square on the deck. */
  | "snap"
  /** Every bill settled: the closing cadence. */
  | "allclear";

const KEY = "outlay:sound";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
const listeners = new Set<() => void>();

function read(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

if (typeof window !== "undefined") enabled = read();

export function soundEnabled() {
  return enabled;
}

export function setSoundEnabled(next: boolean) {
  enabled = next;
  try {
    window.localStorage.setItem(KEY, next ? "on" : "off");
  } catch {}
  listeners.forEach((l) => l());
  if (next) play("tick");
}

export function subscribeSound(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    master = ctx.createGain();
    // Levels were measured by rendering each cue offline: every one now peaks
    // between -5 and -12 dBFS. At the old 0.06 they sat near -30, which is why
    // half of them were inaudible over a laptop speaker.
    master.gain.value = 0.9;
    // A limiter after the bus, because cues overlap (a toast on top of a
    // settle) and the sum would otherwise clip.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.12;
    master.connect(limiter);
    limiter.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(c: AudioContext, at: number, freq: number, dur: number, peak: number, type: OscillatorType = "sine", glide?: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, at + dur);
  gain.gain.setValueAtTime(0.0001, at);
  // Short cues need a short attack or the envelope never reaches its peak.
  gain.gain.exponentialRampToValueAtTime(peak, at + Math.min(0.004, dur * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(master!);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/** Filtered noise whose band travels: friction that moves, not static hiss. */
function sweep(c: AudioContext, at: number, from: number, to: number, dur: number, peak: number, q = 1.1) {
  const frames = Math.max(1, Math.floor(c.sampleRate * dur));
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = q;
  const nyquist = c.sampleRate / 2.2;
  filter.frequency.setValueAtTime(Math.min(from, nyquist), at);
  filter.frequency.exponentialRampToValueAtTime(Math.min(to, nyquist), at + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(peak, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter).connect(gain).connect(master!);
  src.start(at);
  src.stop(at + dur);
}

/**
 * A noise transient. Card sounds are broadband friction and impact rather than
 * pitched tones, so they come from shaped noise. A lowpass reads as a dull
 * knock, a bandpass as a brighter edge.
 */
function burst(
  c: AudioContext,
  at: number,
  dur: number,
  peak: number,
  freq: number,
  q = 0.7,
  curve = 2.2,
  kind: BiquadFilterType = "bandpass",
  /**
   * Fraction of the burst spent rising. Left at zero the noise starts at full
   * amplitude, which *is* a click no matter how it is filtered afterwards;
   * giving the edge a couple of milliseconds to arrive is what separates a
   * card from a tick.
   */
  attack = 0,
  /** Optional ceiling, for taking the fizz off the top. */
  ceiling?: number
) {
  const frames = Math.max(1, Math.floor(c.sampleRate * dur));
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  const rise = Math.max(1, Math.floor(frames * attack));
  for (let i = 0; i < frames; i++) {
    const env = i < rise ? i / rise : Math.pow(1 - (i - rise) / (frames - rise), curve);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = kind;
  filter.frequency.value = Math.min(freq, c.sampleRate / 2.2);
  filter.Q.value = q;
  const gain = c.createGain();
  gain.gain.value = peak;
  let node: AudioNode = src.connect(filter);
  if (ceiling) {
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = Math.min(ceiling, c.sampleRate / 2.2);
    lp.Q.value = 0.4;
    node = node.connect(lp);
  }
  node.connect(gain).connect(master!);
  src.start(at);
  src.stop(at + dur + 0.02);
}

/** A struck bell: fundamental, a slightly sharp octave for shimmer, a faint twelfth. */
function bell(c: AudioContext, at: number, freq: number, dur: number, peak: number) {
  tone(c, at, freq, dur, peak, "sine");
  tone(c, at, freq * 2.008, dur * 0.6, peak * 0.3, "sine");
  tone(c, at, freq * 3.01, dur * 0.32, peak * 0.1, "sine");
}

export function play(cue: Cue) {
  if (!enabled) return;
  const c = audio();
  if (!c || !master) return;
  const t = c.currentTime;
  switch (cue) {
    case "flip":
      sweep(c, t, 2600, 700, 0.16, 0.8);
      tone(c, t + 0.02, 420, 0.09, 0.4, "triangle");
      break;
    case "select":
      // A fingertip on a card: a dull tap with body, no pitch to speak of.
      burst(c, t, 0.05, 3.4, 900, 0.7, 3.2, "lowpass");
      tone(c, t, 200, 0.07, 1.05, "sine", 120);
      break;
    case "tick":
      tone(c, t, 1180, 0.05, 1.35, "sine");
      break;
    case "success":
      tone(c, t, 587.33, 0.12, 0.42, "sine");
      tone(c, t + 0.07, 880, 0.18, 0.38, "sine");
      break;
    case "error":
      tone(c, t, 320, 0.14, 0.5, "triangle", 220);
      break;
    case "settle":
      // Clearing a debt is the best thing you do in here, so it gets the
      // nicest sound: a rising C major triad on bells, an octave over the top,
      // and a warm root underneath. They overlap into one chord as they ring.
      tone(c, t, 130.81, 0.55, 0.18, "sine");
      bell(c, t, 1046.5, 0.95, 0.17);
      bell(c, t + 0.065, 1318.51, 1.0, 0.16);
      bell(c, t + 0.13, 1567.98, 1.15, 0.15);
      bell(c, t + 0.21, 2093, 1.35, 0.13);
      sweep(c, t + 0.16, 4200, 7200, 0.5, 0.07, 0.7);
      break;
    case "unsettle":
      tone(c, t, 660, 0.1, 0.4, "sine");
      tone(c, t + 0.09, 440, 0.15, 0.36, "sine");
      break;
    case "scan":
      sweep(c, t, 300, 4200, 0.42, 0.75);
      tone(c, t + 0.05, 220, 0.4, 0.16, "sine", 330);
      break;
    case "sparkle":
      [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(c, t + i * 0.055, f, 0.22, 0.34, "sine"));
      sweep(c, t + 0.2, 5000, 7400, 0.3, 0.26);
      break;
    case "drop":
      tone(c, t, 150, 0.16, 0.62, "sine", 60);
      sweep(c, t, 900, 200, 0.09, 0.5);
      break;
    case "read":
      sweep(c, t, 3800, 900, 0.09, 0.7);
      tone(c, t + 0.06, 1480, 0.05, 0.5, "sine");
      break;
    case "delete":
      sweep(c, t, 2200, 260, 0.26, 0.8);
      break;
    case "lock":
      tone(c, t, 740, 0.08, 0.42, "sine");
      tone(c, t + 0.09, 494, 0.13, 0.4, "sine");
      break;
    case "riffle": {
      // A riffle heard from arm's length is mostly rustle, with the individual
      // edges well underneath it. Three earlier attempts led with the edges and
      // all read as clicking; measured, this one carries the same peak but a
      // crest factor two decibels lower, which is the prickliness leaving.
      burst(c, t, 0.34, 0.34, 950, 0.2, 0.9, "bandpass", 0.3, 2600);
      burst(c, t + 0.02, 0.3, 0.24, 1500, 0.2, 1.1, "bandpass", 0.35, 2600);
      const TICKS = 40;
      let at = t + 0.012;
      for (let i = 0; i < TICKS; i++) {
        const arc = Math.sin((Math.PI * i) / (TICKS - 1));
        burst(c, at, 0.016, 0.11 * (0.6 + 0.4 * arc), 560 + Math.random() * 260, 0.3, 2, "bandpass", 0.22, 2600);
        at += 0.0098 - 0.004 * arc + Math.random() * 0.0018;
      }
      // The two packets marry, then the deck is squared on the table.
      tone(c, at + 0.012, 128, 0.13, 0.26, "sine", 72);
      burst(c, at + 0.012, 0.06, 0.3, 760, 0.35, 2.2, "bandpass", 0.12, 2600);
      break;
    }
    case "slide":
      // One card drawn across another, then set down.
      sweep(c, t, 3400, 520, 0.14, 0.62, 0.8);
      tone(c, t + 0.085, 150, 0.09, 0.4, "sine", 72);
      break;
    case "snap":
      burst(c, t, 0.04, 1.6, 2400, 0.6, 3);
      tone(c, t, 180, 0.06, 0.5, "sine", 90);
      break;
    case "allclear":
      // The settle chime answered. Where a single bill rises C-E-G-C, finishing
      // everything resolves: G major leaning home to C, held with a long tail.
      tone(c, t, 98, 1.5, 0.16, "sine");
      bell(c, t, 783.99, 1.1, 0.15);
      bell(c, t + 0.05, 987.77, 1.2, 0.14);
      tone(c, t + 0.28, 130.81, 1.7, 0.17, "sine");
      bell(c, t + 0.3, 1046.5, 1.7, 0.17);
      bell(c, t + 0.36, 1318.51, 1.8, 0.15);
      bell(c, t + 0.42, 1567.98, 1.9, 0.13);
      bell(c, t + 0.5, 2093, 2.1, 0.11);
      sweep(c, t + 0.42, 3600, 7200, 0.9, 0.06, 0.7);
      break;
  }
}
