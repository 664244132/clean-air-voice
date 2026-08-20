import { useState, useRef, useEffect } from "react";
import { Mic, Square, Pause, Play, RotateCcw, Download, Trash2, AlertCircle } from "lucide-react";

type RecState = "idle" | "recording" | "paused" | "stopped";

interface Rec {
  id: string;
  blob: Blob;
  duration: number;
  date: Date;
  url: string;
  name: string;
  mimeType: string;
}

const pad = (n: number) => n.toString().padStart(2, "0");
const fmtTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const fmtDur = (s: number) =>
  s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60 > 0 ? ` ${s % 60}s` : ""}`;
const fmtClock = (d: Date) =>
  d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false });

// ─── Draw helpers ──────────────────────────────────────────────────────────

function drawFrame(
  canvas: HTMLCanvasElement,
  analyser: AnalyserNode | null,
  recState: RecState
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return;

  ctx.clearRect(0, 0, w, h);

  const BAR = 72;
  const barW = Math.max(1, Math.floor((w / BAR) * 0.55));
  const spacing = (w - barW * BAR) / (BAR + 1);
  const cy = h / 2;
  const t = Date.now() / 1000;

  let dataArr: Uint8Array | null = null;
  if (analyser && recState === "recording") {
    dataArr = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArr);
  }

  for (let i = 0; i < BAR; i++) {
    let amp: number;

    if (dataArr) {
      const step = Math.floor(dataArr.length / BAR);
      amp = dataArr[i * step] / 255;
    } else if (recState === "paused") {
      amp = 0.022 + Math.sin(i * 0.45) * 0.008;
    } else {
      // Gentle idle breathing
      amp =
        0.028 +
        Math.sin(t * 0.55 + i * 0.21) * 0.018 +
        Math.sin(t * 0.28 + i * 0.09) * 0.009;
    }

    const barH = Math.max(1.5, amp * cy * 0.88);
    const x = spacing + i * (barW + spacing);

    // Color gradient: dim teal → cyan → emerald based on amplitude
    let r: number, g: number, b: number, alpha: number;

    if (dataArr && amp > 0.04) {
      const blend = Math.min(1, amp * 1.4);
      r = Math.round(6 + blend * 10);
      g = Math.round(182 + blend * 3);
      b = Math.round(212 - blend * 83);
      alpha = 0.35 + amp * 0.65;
      ctx.shadowColor = `rgba(${r},${g},${b},${Math.min(0.75, amp * 1.2)})`;
      ctx.shadowBlur = 3 + amp * 22;
    } else if (recState === "paused") {
      r = 251; g = 191; b = 36;
      alpha = 0.1;
      ctx.shadowBlur = 0;
    } else {
      r = 6; g = 182; b = 212;
      alpha = dataArr
        ? 0.08
        : 0.1 + Math.sin(t * 0.55 + i * 0.21) * 0.045;
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fillRect(x, cy - barH, barW, barH);
    ctx.fillRect(x, cy, barW, barH);
  }

  ctx.shadowBlur = 0;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function App() {
  const [state, setState] = useState<RecState>("idle");
  const stateRef = useRef<RecState>("idle");
  const [timer, setTimer] = useState(0);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [denied, setDenied] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef(0);
  const timerIvRef = useRef<number | null>(null);
  const recCountRef = useRef(0);

  const setStateSynced = (s: RecState) => {
    stateRef.current = s;
    setState(s);
  };

  // Canvas sizing via ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Single persistent RAF loop — reads refs, no dependency churn
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      if (canvasRef.current) {
        drawFrame(canvasRef.current, analyserRef.current, stateRef.current);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const startTimer = () => {
    if (timerIvRef.current) clearInterval(timerIvRef.current);
    timerIvRef.current = window.setInterval(() => {
      timerRef.current++;
      setTimer(timerRef.current);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIvRef.current) {
      clearInterval(timerIvRef.current);
      timerIvRef.current = null;
    }
  };

  const startRecording = async () => {
    setDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      mrRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        recCountRef.current++;
        setRecs((prev) => [
          {
            id: Date.now().toString(),
            blob,
            url,
            mimeType,
            duration: timerRef.current,
            date: new Date(),
            name: `Recording ${recCountRef.current.toString().padStart(2, "0")}`,
          },
          ...prev,
        ]);
        analyserRef.current = null;
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
        setStateSynced("stopped");
      };

      mr.start(100);
      timerRef.current = 0;
      setTimer(0);
      startTimer();
      setStateSynced("recording");
    } catch {
      setDenied(true);
    }
  };

  const stopRecording = () => {
    stopTimer();
    if (mrRef.current && mrRef.current.state !== "inactive") mrRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const pauseRecording = () => {
    if (mrRef.current?.state === "recording") {
      mrRef.current.pause();
      stopTimer();
      setStateSynced("paused");
    }
  };

  const resumeRecording = () => {
    if (mrRef.current?.state === "paused") {
      mrRef.current.resume();
      startTimer();
      setStateSynced("recording");
    }
  };

  const retake = () => {
    stopTimer();
    if (mrRef.current && mrRef.current.state !== "inactive") mrRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    timerRef.current = 0;
    setTimer(0);
    setStateSynced("idle");
  };

  const downloadRec = (rec: Rec) => {
    const a = document.createElement("a");
    a.href = rec.url;
    a.download = `${rec.name}.${rec.mimeType.includes("mp4") ? "mp4" : "webm"}`;
    a.click();
  };

  const deleteRec = (id: string) => {
    setRecs((prev) => {
      const rec = prev.find((r) => r.id === id);
      if (rec) URL.revokeObjectURL(rec.url);
      return prev.filter((r) => r.id !== id);
    });
  };

  const isRec = state === "recording";
  const isPaused = state === "paused";
  const isActive = isRec || isPaused;
  const isStopped = state === "stopped";

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 h-[52px] border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div
            className={`w-[5px] h-[5px] rounded-full transition-all duration-500 ${
              isRec
                ? "bg-cyan-400 shadow-[0_0_10px_#22d3ee,0_0_20px_rgba(34,211,238,0.4)]"
                : isPaused
                ? "bg-amber-400"
                : "bg-zinc-700"
            }`}
          />
          <span
            className="text-xs font-semibold text-zinc-400 tracking-[0.28em] uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            VoiceCapture
          </span>
        </div>

        <div
          className="flex items-center gap-3 text-[10px] text-zinc-700 tracking-widest"
          style={{ fontFamily: "var(--font-mono-custom)" }}
        >
          <span className="hidden sm:block">WEB AUDIO API</span>
          <span className="hidden sm:block text-zinc-800">·</span>
          <span className={recs.length > 0 ? "text-zinc-500" : ""}>
            {recs.length.toString().padStart(2, "0")} REC
          </span>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-between py-14 px-8 gap-10">

        {/* Center column */}
        <div className="flex flex-col items-center gap-7 w-full max-w-xl">

          {/* Status badge */}
          <div className="flex items-center gap-2 h-5">
            <div
              className={`w-[5px] h-[5px] rounded-full shrink-0 transition-all duration-300 ${
                isRec
                  ? "bg-red-400 animate-pulse shadow-[0_0_6px_rgba(248,113,113,0.9)]"
                  : isPaused
                  ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                  : "bg-zinc-700"
              }`}
            />
            <span
              className="text-[10px] tracking-[0.32em] uppercase transition-colors duration-300"
              style={{
                fontFamily: "var(--font-mono-custom)",
                color: isRec
                  ? "#f87171"
                  : isPaused
                  ? "#fbbf24"
                  : isStopped
                  ? "#52525b"
                  : "#3f3f46",
              }}
            >
              {isRec ? "Recording" : isPaused ? "Paused" : isStopped ? "Complete" : "Standby"}
            </span>
          </div>

          {/* Timer */}
          <div
            className="text-[80px] leading-none font-bold tabular-nums transition-colors duration-500 select-none"
            style={{
              fontFamily: "var(--font-mono-custom)",
              letterSpacing: "-0.03em",
              color: isRec
                ? "#f4f4f5"
                : isPaused
                ? "rgba(251,191,36,0.55)"
                : "#27272a",
            }}
          >
            {fmtTime(timer)}
          </div>

          {/* Mic button */}
          <div className="relative flex items-center justify-center" style={{ width: 172, height: 172 }}>

            {/* Outer ping rings when recording */}
            {isRec && (
              <>
                <div
                  className="absolute rounded-full border border-cyan-500/15 animate-ping"
                  style={{ inset: "-4px", animationDuration: "2.2s" }}
                />
                <div
                  className="absolute rounded-full border border-cyan-500/08 animate-ping"
                  style={{ inset: "-18px", animationDuration: "3s", animationDelay: "0.6s" }}
                />
              </>
            )}

            {/* Ambient glow behind button */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none transition-all duration-700"
              style={{
                boxShadow: isRec
                  ? "0 0 70px rgba(6,182,212,0.22), 0 0 140px rgba(6,182,212,0.08)"
                  : isPaused
                  ? "0 0 40px rgba(251,191,36,0.12)"
                  : "none",
              }}
            />

            {/* Main button */}
            <button
              onClick={() => {
                if (!isActive) startRecording();
                else stopRecording();
              }}
              className="relative w-[136px] h-[136px] rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none group"
              style={{
                background: isRec
                  ? "radial-gradient(circle at 40% 35%, #0d2228, #09090b)"
                  : isPaused
                  ? "radial-gradient(circle at 40% 35%, #1a1600, #09090b)"
                  : "radial-gradient(circle at 40% 35%, #1a1a1d, #0d0d0f)",
                border: isRec
                  ? "1px solid rgba(6,182,212,0.28)"
                  : isPaused
                  ? "1px solid rgba(251,191,36,0.25)"
                  : "1px solid rgba(255,255,255,0.08)",
                boxShadow: isRec
                  ? "inset 0 1px 0 rgba(6,182,212,0.08), inset 0 0 24px rgba(6,182,212,0.04)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(6,182,212,0.35)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 32px rgba(6,182,212,0.14), inset 0 0 16px rgba(6,182,212,0.03)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                }
              }}
            >
              {isActive ? (
                <Square
                  className="w-10 h-10 transition-colors duration-200"
                  style={{ color: isRec ? "#22d3ee" : "#fbbf24" }}
                />
              ) : (
                <Mic
                  className="w-10 h-10 transition-all duration-300"
                  style={{ color: "#52525b" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as SVGElement).style.color = "#06b6d4";
                    (e.currentTarget as SVGElement).style.filter =
                      "drop-shadow(0 0 8px rgba(6,182,212,0.7))";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as SVGElement).style.color = "#52525b";
                    (e.currentTarget as SVGElement).style.filter = "none";
                  }}
                />
              )}

              {/* Inner ring accent when recording */}
              {isRec && (
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: "10px",
                    border: "1px solid rgba(6,182,212,0.1)",
                  }}
                />
              )}
            </button>
          </div>

          {/* Hint */}
          {!isActive && (
            <p
              className="text-[10px] tracking-[0.28em] uppercase transition-colors duration-300"
              style={{
                fontFamily: "var(--font-mono-custom)",
                color: isStopped ? "#3f3f46" : "#27272a",
              }}
            >
              {isStopped ? "Click mic to record again" : "Click mic to start recording"}
            </p>
          )}

          {/* Secondary controls */}
          {isActive && (
            <div className="flex items-center gap-2">
              <button
                onClick={isRec ? pauseRecording : resumeRecording}
                className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.18em] uppercase transition-all duration-200"
                style={{
                  fontFamily: "var(--font-mono-custom)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#52525b",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.18)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#a1a1aa";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#52525b";
                }}
              >
                {isRec ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                {isRec ? "Pause" : "Resume"}
              </button>

              <button
                onClick={retake}
                className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.18em] uppercase transition-all duration-200"
                style={{
                  fontFamily: "var(--font-mono-custom)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#52525b",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(239,68,68,0.3)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#52525b";
                }}
              >
                <RotateCcw className="w-3 h-3" />
                Retake
              </button>
            </div>
          )}

          {/* Permission denied */}
          {denied && (
            <div className="flex items-start gap-2 max-w-xs">
              <AlertCircle className="w-3.5 h-3.5 text-red-400/60 shrink-0 mt-px" />
              <p
                className="text-[10px] leading-relaxed"
                style={{
                  fontFamily: "var(--font-mono-custom)",
                  color: "rgba(248,113,113,0.65)",
                }}
              >
                Microphone access denied. Enable microphone permissions in your browser to start recording.
              </p>
            </div>
          )}
        </div>

        {/* ── Visualizer ─────────────────────────────────── */}
        <div className="w-full max-w-3xl">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span
              className="text-[9px] tracking-[0.3em] uppercase text-zinc-800"
              style={{ fontFamily: "var(--font-mono-custom)" }}
            >
              Frequency Response
            </span>
            <div className="flex items-center gap-2">
              <span
                className="text-[9px]"
                style={{
                  fontFamily: "var(--font-mono-custom)",
                  color: isRec ? "#06b6d4" : "#27272a",
                }}
              >
                {isRec ? "● LIVE" : isPaused ? "⏸ HOLD" : "○ OFF"}
              </span>
            </div>
          </div>

          {/* Canvas container */}
          <div className="relative w-full" style={{ height: 128 }}>
            {/* Background grid */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0"
                  style={{
                    top: `${(i / 4) * 100}%`,
                    height: "1px",
                    background: i === 2
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(255,255,255,0.02)",
                  }}
                />
              ))}
              {/* Vertical grid marks */}
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <div
                  key={p}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${p * 100}%`,
                    width: "1px",
                    background: "rgba(255,255,255,0.015)",
                  }}
                />
              ))}
            </div>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          </div>

          {/* Axis labels */}
          <div
            className="flex justify-between mt-1.5 px-0.5 text-[9px] text-zinc-800"
            style={{ fontFamily: "var(--font-mono-custom)" }}
          >
            <span>20Hz</span>
            <span>250Hz</span>
            <span>1kHz</span>
            <span>4kHz</span>
            <span>20kHz</span>
          </div>
        </div>
      </main>

      {/* ── Recordings list ────────────────────────────── */}
      {recs.length > 0 && (
        <section className="border-t border-border px-8 py-6 shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[9px] tracking-[0.32em] uppercase text-zinc-600"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Recordings
              </span>
              <span
                className="text-[9px] text-zinc-800"
                style={{ fontFamily: "var(--font-mono-custom)" }}
              >
                {recs.length} {recs.length === 1 ? "file" : "files"}
              </span>
            </div>

            {/* Row list */}
            <div className="flex flex-col gap-[1px]">
              {recs.map((rec, i) => (
                <div
                  key={rec.id}
                  className="group flex items-center gap-4 px-3 py-2.5 transition-all duration-150"
                  style={{
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(255,255,255,0.015)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
                  }}
                >
                  {/* Index */}
                  <span
                    className="text-[10px] text-zinc-800 w-5 shrink-0 select-none"
                    style={{ fontFamily: "var(--font-mono-custom)" }}
                  >
                    {(i + 1).toString().padStart(2, "0")}
                  </span>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors duration-150 truncate block">
                      {rec.name}
                    </span>
                  </div>

                  {/* Duration */}
                  <span
                    className="text-[10px] text-zinc-700 shrink-0 w-10 text-right"
                    style={{ fontFamily: "var(--font-mono-custom)" }}
                  >
                    {fmtDur(rec.duration)}
                  </span>

                  {/* Time */}
                  <span
                    className="text-[10px] text-zinc-800 shrink-0 w-12 text-right hidden sm:block"
                    style={{ fontFamily: "var(--font-mono-custom)" }}
                  >
                    {fmtClock(rec.date)}
                  </span>

                  {/* Audio player */}
                  <audio
                    src={rec.url}
                    controls
                    className="h-7 shrink-0 opacity-20 group-hover:opacity-60 transition-opacity duration-200"
                    style={{ width: 140, minWidth: 100 }}
                  />

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                    <button
                      onClick={() => downloadRec(rec)}
                      className="p-1.5 rounded transition-all duration-150 text-zinc-600 hover:text-cyan-400"
                      style={{ background: "transparent" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "rgba(6,182,212,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteRec(rec.id)}
                      className="p-1.5 rounded transition-all duration-150 text-zinc-600 hover:text-red-400"
                      style={{ background: "transparent" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "rgba(239,68,68,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer rule ─────────────────────────────────── */}
      <div className="h-px w-full bg-border shrink-0" />
    </div>
  );
}
