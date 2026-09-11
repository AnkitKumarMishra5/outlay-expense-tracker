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
  | "lock";

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
    master.gain.value = 0.06;
    master.connect(ctx.destination);
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
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(master!);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

function sweep(c: AudioContext, at: number, from: number, to: number, dur: number, peak: number) {
  const frames = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.1;
  filter.frequency.setValueAtTime(from, at);
  filter.frequency.exponentialRampToValueAtTime(to, at + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(peak, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter).connect(gain).connect(master!);
  src.start(at);
  src.stop(at + dur);
}

export function play(cue: Cue) {
  if (!enabled) return;
  const c = audio();
  if (!c || !master) return;
  const t = c.currentTime;
  switch (cue) {
    case "flip":
      sweep(c, t, 2600, 700, 0.16, 0.5);
      tone(c, t + 0.02, 420, 0.09, 0.18, "triangle");
      break;
    case "select":
      tone(c, t, 660, 0.07, 0.24, "sine", 880);
      break;
    case "tick":
      tone(c, t, 1180, 0.035, 0.16, "sine");
      break;
    case "success":
      tone(c, t, 587.33, 0.1, 0.22, "sine");
      tone(c, t + 0.07, 880, 0.16, 0.2, "sine");
      break;
    case "error":
      tone(c, t, 320, 0.12, 0.24, "triangle", 220);
      break;
    case "settle":
      // Register bell: a low thump, two bright partials a fifth apart, then shimmer.
      tone(c, t, 160, 0.09, 0.3, "sine", 70);
      tone(c, t + 0.02, 1318.5, 0.5, 0.26, "sine");
      tone(c, t + 0.02, 1975.5, 0.42, 0.14, "sine");
      tone(c, t + 0.11, 2637, 0.55, 0.16, "sine");
      tone(c, t + 0.11, 3951, 0.3, 0.05, "sine");
      sweep(c, t + 0.12, 6000, 12000, 0.34, 0.16);
      break;
    case "unsettle":
      tone(c, t, 660, 0.09, 0.16, "sine");
      tone(c, t + 0.09, 440, 0.14, 0.14, "sine");
      break;
    case "scan":
      sweep(c, t, 300, 4200, 0.42, 0.34);
      tone(c, t + 0.05, 220, 0.4, 0.06, "sine", 330);
      break;
    case "sparkle":
      [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(c, t + i * 0.055, f, 0.22, 0.14, "sine"));
      sweep(c, t + 0.2, 5000, 11000, 0.3, 0.12);
      break;
    case "drop":
      tone(c, t, 150, 0.14, 0.34, "sine", 60);
      sweep(c, t, 900, 200, 0.08, 0.2);
      break;
    case "read":
      sweep(c, t, 3800, 900, 0.09, 0.3);
      tone(c, t + 0.06, 1480, 0.05, 0.12, "sine");
      break;
    case "delete":
      sweep(c, t, 2200, 260, 0.26, 0.4);
      break;
    case "lock":
      tone(c, t, 740, 0.07, 0.18, "sine");
      tone(c, t + 0.09, 494, 0.12, 0.18, "sine");
      break;
  }
}
