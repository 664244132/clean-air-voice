# Clean Air Voice Index Redesign & Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `public/index.html` to mirror the dark, glowing futuristic audio capture design from `index/src/app/App.tsx`, while refactoring the client code into modular JS files adhering to `markdowns/REFACTORCODE.md`, `markdowns/HTMLCodingGuide.md`, `markdowns/TailwindCodingGuide.md`, and `markdowns/DeMorgansLaws.md`.

**Architecture:** Split frontend responsibility into 4 clean ES modules (`audio-helper.js`, `gemini-client.js`, `ui-controller.js`, `app.js`) and modern CSS (`style.css`), consuming Ephemeral Tokens from `server.js` for Gemini Live API audio streaming and video tool activation.

**Tech Stack:** Native HTML5 (Semantic & a11y), Tailwind CSS + Custom CSS Variables, ES6+ JavaScript (ES Modules), Web Audio API (Linear PCM 16-bit 16kHz input / PCM 24kHz output), Canvas 2D API.

## Global Constraints
- **Security**: Must fetch Ephemeral Tokens via `GET /api/token`. Never expose `GEMINI_API_KEY` on the client.
- **Code Rules**: Strictly enforce De Morgan's Laws (no `!(A && B)` or `!(A || B)`) and Early Returns / Guard Clauses.
- **Git Safety**: Do NOT commit or push to Git automatically (STRICT RULE 11).
- **Resource Management**: Properly close `AudioContext`, stop `MediaStreamTrack`s, and cancel `requestAnimationFrame` loops on shutdown.

---

### Task 1: Create Modern CSS Design Tokens & Styles (`public/css/style.css`)

**Files:**
- Create: `public/css/style.css`

**Interfaces:**
- Consumes: Tailwind CDN / Standard CSS Variables in `index.html`.
- Produces: CSS utility classes and variables for dark theme (`--bg-dark`, `--cyan-glow`, pulse animations, video overlay modal).

- [ ] **Step 1: Write `public/css/style.css` with dark theme tokens, font utilities, and visualizer styles**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@600;700&display=swap');

:root {
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-display: 'Space Grotesk', sans-serif;
  
  --bg-dark: #09090b;
  --border-color: rgba(255, 255, 255, 0.08);
  --cyan-accent: #06b6d4;
  --cyan-glow: rgba(6, 182, 212, 0.35);
  --amber-accent: #fbbf24;
  --red-accent: #f87171;
}

body {
  font-family: var(--font-body);
  background-color: var(--bg-dark);
  color: #f4f4f5;
  min-height: 100vh;
  margin: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.font-mono-custom {
  font-family: var(--font-mono);
}

.font-display-custom {
  font-family: var(--font-display);
}

/* Mic pulse animations */
@keyframes ping-slow {
  0% { transform: scale(1); opacity: 0.4; }
  80%, 100% { transform: scale(1.4); opacity: 0; }
}

.animate-ping-slow {
  animation: ping-slow 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

/* Video modal styles */
.video-modal-backdrop {
  background-color: rgba(9, 9, 11, 0.85);
  backdrop-filter: blur(8px);
}
```

- [ ] **Step 2: Verify CSS file creation**

Verify file exists at `public/css/style.css`.

---

### Task 2: Implement Audio DSP & Canvas Visualizer Module (`public/js/audio-helper.js`)

**Files:**
- Create: `public/js/audio-helper.js`

**Interfaces:**
- Consumes: Web Audio API `AudioContext`, `AnalyserNode`, `Float32Array`.
- Produces: `float32ToPCM16()`, `arrayBufferToBase64()`, `AudioOutputQueue` class, `CanvasVisualizer` class.

- [ ] **Step 1: Write `public/js/audio-helper.js` implementing PCM encoding, base64 conversion, audio queue player, and 2D canvas frequency visualizer**

```javascript
/**
 * Audio Helper Module - Web Audio DSP & Frequency Visualizer
 */

export function float32ToPCM16(input) {
  if (!input) return new Int16Array(0);
  
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

export function arrayBufferToBase64(buffer) {
  if (!buffer) return '';
  
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export class AudioOutputQueue {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.nextStartTime = 0;
  }

  playPcmBase64(base64Data, mimeType = 'audio/pcm;rate=24000') {
    if (!this.ctx) return;
    if (!base64Data) return;

    const rateMatch = /rate=(\d+)/.exec(mimeType);
    const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const pcm16 = new Int16Array(bytes.buffer);
    const buffer = this.ctx.createBuffer(1, pcm16.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcm16.length; i++) {
      channelData[i] = pcm16[i] / 32768;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);

    const currentTime = this.ctx.currentTime;
    this.nextStartTime = Math.max(this.nextStartTime, currentTime);
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }

  reset() {
    this.nextStartTime = 0;
  }
}

export class CanvasVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.analyser = null;
    this.state = 'idle'; // 'idle' | 'recording' | 'paused'
    this.rafId = null;
    this.resizeObserver = null;
    
    this.initResizeHandler();
  }

  initResizeHandler() {
    if (!this.canvas) return;
    
    const syncSize = () => {
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;
    };
    
    syncSize();
    this.resizeObserver = new ResizeObserver(syncSize);
    this.resizeObserver.observe(this.canvas);
  }

  setAnalyser(analyser) {
    this.analyser = analyser;
  }

  setState(state) {
    this.state = state;
  }

  start() {
    if (this.rafId != null) return;
    
    const renderLoop = () => {
      this.draw();
      this.rafId = requestAnimationFrame(renderLoop);
    };
    this.rafId = requestAnimationFrame(renderLoop);
  }

  stop() {
    if (this.rafId == null) return;
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    if (width === 0 || height === 0) return;

    this.ctx.clearRect(0, 0, width, height);

    const totalBars = 72;
    const barWidth = Math.max(1, Math.floor((width / totalBars) * 0.55));
    const spacing = (width - barWidth * totalBars) / (totalBars + 1);
    const centerY = height / 2;
    const timestamp = Date.now() / 1000;

    let frequencyData = null;
    if (this.analyser && this.state === 'recording') {
      frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(frequencyData);
    }

    for (let i = 0; i < totalBars; i++) {
      let amplitude = 0;

      if (frequencyData) {
        const step = Math.floor(frequencyData.length / totalBars);
        amplitude = frequencyData[i * step] / 255;
      } else if (this.state === 'paused') {
        amplitude = 0.022 + Math.sin(i * 0.45) * 0.008;
      } else {
        amplitude = 0.028 + Math.sin(timestamp * 0.55 + i * 0.21) * 0.018 + Math.sin(timestamp * 0.28 + i * 0.09) * 0.009;
      }

      const barHeight = Math.max(1.5, amplitude * centerY * 0.88);
      const x = spacing + i * (barWidth + spacing);

      let r, g, b, alpha;
      if (frequencyData && amplitude > 0.04) {
        const blend = Math.min(1, amplitude * 1.4);
        r = Math.round(6 + blend * 10);
        g = Math.round(182 + blend * 3);
        b = Math.round(212 - blend * 83);
        alpha = 0.35 + amplitude * 0.65;
        this.ctx.shadowColor = `rgba(${r},${g},${b},${Math.min(0.75, amplitude * 1.2)})`;
        this.ctx.shadowBlur = 3 + amplitude * 22;
      } else if (this.state === 'paused') {
        r = 251; g = 191; b = 36;
        alpha = 0.1;
        this.ctx.shadowBlur = 0;
      } else {
        r = 6; g = 182; b = 212;
        alpha = frequencyData ? 0.08 : 0.1 + Math.sin(timestamp * 0.55 + i * 0.21) * 0.045;
        this.ctx.shadowBlur = 0;
      }

      this.ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      this.ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);
      this.ctx.fillRect(x, centerY, barWidth, barHeight);
    }
    this.ctx.shadowBlur = 0;
  }
}
```

---

### Task 3: Implement Gemini Live Client Module (`public/js/gemini-client.js`)

**Files:**
- Create: `public/js/gemini-client.js`

**Interfaces:**
- Consumes: `@google/genai` library via ESM `https://esm.run/@google/genai`, `/api/token`.
- Produces: `GeminiLiveClient` class managing session, callbacks, tool invocation, and audio streaming.

- [ ] **Step 1: Write `public/js/gemini-client.js` implementing Ephemeral Token retrieval and Gemini Live WebSocket connection handling**

```javascript
/**
 * Gemini Live API Client Module
 */
import { GoogleGenAI, Modality, Type } from 'https://esm.run/@google/genai';

const MODEL = 'gemini-3.1-flash-live-preview';

const tools = [{
  functionDeclarations: [{
    name: 'open_clean_air_video',
    description: 'เปิดวิดีโอ Clean Air for Life เมื่อผู้ใช้สั่งหลังจากปลุกระบบแล้ว',
    parameters: { type: Type.OBJECT, properties: {} }
  }]
}];

const systemInstruction = `
คุณคือผู้ช่วยสั่งงานด้วยเสียงภาษาไทยสำหรับงาน Clean Air for Life
กฎสำคัญ:
1) เริ่มต้นอยู่ในโหมดรอคำปลุก คำปลุกคือ "ไอที" (IT) เท่านั้น
2) ก่อนพบคำปลุก ห้ามตอบคำสั่งอื่นและห้ามเปิดวิดีโอ
3) เมื่อได้ยินคำว่า "ไอที" หรือเสียงที่ชัดเจนว่าหมายถึง IT ให้ตอบภาษาไทยเพียงว่า "คุณต้องการให้ทำอะไร" แล้วรอคำสั่งถัดไป
4) หลังจากปลุกแล้ว ถ้าผู้ใช้พูด "Clean Air for Life" รวมถึงสำเนียงไทย เช่น "คลีนแอร์ฟอร์ไลฟ์", "คลีนแอฟอไลฟ์" หรือคำออกเสียงใกล้เคียงที่เจตนาชัดเจน ให้เรียก function open_clean_air_video
5) ถ้าฟังไม่ออกหรือไม่มั่นใจ ให้พูดว่า "ช่วยพูดอีกครั้ง" และห้ามเปิดวิดีโอ
6) อย่าพูดข้อความยาว ไม่สนทนาเรื่องอื่น
`;

export class GeminiLiveClient {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.session = null;
    this.isConnected = false;
  }

  async fetchEphemeralToken() {
    const response = await fetch('/api/token');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'ไม่สามารถรับ Auth Token ได้');
    }
    return data.token;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      const token = await this.fetchEphemeralToken();
      const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: 'v1beta' } });

      this.session = await ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction,
          tools
        },
        callbacks: {
          onopen: () => {
            this.isConnected = true;
            if (this.callbacks.onOpen) this.callbacks.onOpen();
          },
          onmessage: (message) => {
            this.handleIncomingMessage(message);
          },
          onerror: (err) => {
            console.error('Gemini Session Error:', err);
            if (this.callbacks.onError) this.callbacks.onError(err);
          },
          onclose: () => {
            this.isConnected = false;
            this.session = null;
            if (this.callbacks.onClose) this.callbacks.onClose();
          }
        }
      });
    } catch (err) {
      this.isConnected = false;
      throw err;
    }
  }

  sendAudioChunk(base64PcmData) {
    if (!this.isConnected || !this.session) return;

    this.session.sendRealtimeInput({
      audio: { data: base64PcmData, mimeType: 'audio/pcm;rate=16000' }
    });
  }

  handleIncomingMessage(message) {
    if (!message) return;
    const sc = message.serverContent;

    if (sc?.inputTranscription?.text && this.callbacks.onInputTranscription) {
      this.callbacks.onInputTranscription(sc.inputTranscription.text);
    }

    if (sc?.outputTranscription?.text && this.callbacks.onOutputTranscription) {
      this.callbacks.onOutputTranscription(sc.outputTranscription.text);
    }

    const parts = sc?.modelTurn?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data && this.callbacks.onAudioData) {
        this.callbacks.onAudioData(part.inlineData.data, part.inlineData.mimeType || 'audio/pcm;rate=24000');
      }
    }

    const functionCalls = message.toolCall?.functionCalls || [];
    for (const call of functionCalls) {
      if (call.name === 'open_clean_air_video') {
        if (this.callbacks.onToolCall) {
          this.callbacks.onToolCall(call.name);
        }
        this.sendToolResponse(call.id, call.name, { result: 'video_opened' });
      }
    }
  }

  sendToolResponse(id, name, responseObj) {
    if (!this.session) return;
    this.session.sendToolResponse({
      functionResponses: [{ id, name, response: responseObj }]
    });
  }

  disconnect() {
    if (!this.session) return;
    try {
      this.session.close();
    } catch (e) {
      console.warn('Session close exception:', e);
    }
    this.session = null;
    this.isConnected = false;
  }
}
```

---

### Task 4: Implement UI Controller Module (`public/js/ui-controller.js`)

**Files:**
- Create: `public/js/ui-controller.js`

**Interfaces:**
- Consumes: DOM element selectors (`#start-stop-btn`, `#status-badge`, `#transcript-box`, `#video-modal`, `#video-player`).
- Produces: `UIController` class managing component states, video playback, and transcription updates.

- [ ] **Step 1: Write `public/js/ui-controller.js` implementing DOM controller and state transitions**

```javascript
/**
 * UI Controller Module
 */

export class UIController {
  constructor() {
    this.statusDot = document.querySelector('#status-dot');
    this.statusText = document.querySelector('#status-text');
    this.micBtn = document.querySelector('#mic-btn');
    this.micIcon = document.querySelector('#mic-icon');
    this.stopIcon = document.querySelector('#stop-icon');
    this.micGlow = document.querySelector('#mic-glow');
    this.pulseRings = document.querySelector('#pulse-rings');
    this.transcriptBox = document.querySelector('#transcript-box');
    this.transcriptText = document.querySelector('#transcript-text');
    this.videoModal = document.querySelector('#video-modal');
    this.videoPlayer = document.querySelector('#video-player');
    this.closeVideoBtn = document.querySelector('#close-video-btn');
  }

  setStatus(state, message) {
    if (this.statusText) this.statusText.textContent = message;

    if (!this.statusDot) return;

    if (state === 'recording') {
      this.statusDot.className = 'w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_rgba(248,113,113,0.9)]';
    } else if (state === 'connecting') {
      this.statusDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
    } else if (state === 'ready') {
      this.statusDot.className = 'w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]';
    } else {
      this.statusDot.className = 'w-2 h-2 rounded-full bg-zinc-600';
    }
  }

  setMicState(isActive) {
    if (isActive) {
      if (this.micIcon) this.micIcon.classList.add('hidden');
      if (this.stopIcon) this.stopIcon.classList.remove('hidden');
      if (this.pulseRings) this.pulseRings.classList.remove('hidden');
      if (this.micGlow) {
        this.micGlow.style.boxShadow = '0 0 70px rgba(6,182,212,0.25), 0 0 140px rgba(6,182,212,0.1)';
      }
    } else {
      if (this.micIcon) this.micIcon.classList.remove('hidden');
      if (this.stopIcon) this.stopIcon.classList.add('hidden');
      if (this.pulseRings) this.pulseRings.classList.add('hidden');
      if (this.micGlow) {
        this.micGlow.style.boxShadow = 'none';
      }
    }
  }

  setTranscript(text, isInput = true) {
    if (!this.transcriptBox || !this.transcriptText) return;

    if (!text) {
      this.transcriptBox.classList.add('hidden');
      this.transcriptText.textContent = '';
      return;
    }

    this.transcriptBox.classList.remove('hidden');
    const prefix = isInput ? '🎙 ได้ยิน: ' : '🤖 AI: ';
    this.transcriptText.textContent = prefix + text;
  }

  showVideo() {
    if (!this.videoModal || !this.videoPlayer) return;
    this.videoModal.classList.remove('hidden');
    this.videoPlayer.currentTime = 0;
    this.videoPlayer.play().catch((err) => {
      console.warn('Video auto-play deferred:', err);
    });
  }

  hideVideo() {
    if (!this.videoModal || !this.videoPlayer) return;
    this.videoPlayer.pause();
    this.videoModal.classList.add('hidden');
  }

  onVideoEnded(callback) {
    if (!this.videoPlayer) return;
    this.videoPlayer.onended = () => {
      this.hideVideo();
      if (callback) callback();
    };
  }

  onCloseVideo(callback) {
    if (!this.closeVideoBtn) return;
    this.closeVideoBtn.onclick = () => {
      this.hideVideo();
      if (callback) callback();
    };
  }

  onMicClick(callback) {
    if (!this.micBtn) return;
    this.micBtn.onclick = callback;
  }
}
```

---

### Task 5: Implement Main Entry Point (`public/js/app.js`)

**Files:**
- Create: `public/js/app.js`

**Interfaces:**
- Consumes: `AudioOutputQueue`, `CanvasVisualizer`, `float32ToPCM16`, `arrayBufferToBase64` from `audio-helper.js`, `GeminiLiveClient` from `gemini-client.js`, `UIController` from `ui-controller.js`.
- Produces: Main initialization and lifecycle management.

- [ ] **Step 1: Write `public/js/app.js` linking audio streaming, Gemini Live client, and UI controller**

```javascript
/**
 * Main Application Entry Point
 */
import { float32ToPCM16, arrayBufferToBase64, AudioOutputQueue, CanvasVisualizer } from './audio-helper.js';
import { GeminiLiveClient } from './gemini-client.js';
import { UIController } from './ui-controller.js';

let isRunning = false;
let mediaStream = null;
let audioContext = null;
let sourceNode = null;
let processorNode = null;
let analyserNode = null;
let audioQueue = null;
let visualizer = null;
let geminiClient = null;
let ui = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  ui = new UIController();
  
  const canvasEl = document.querySelector('#visualizer-canvas');
  if (canvasEl) {
    visualizer = new CanvasVisualizer(canvasEl);
    visualizer.start();
  }

  ui.onMicClick(() => {
    if (isRunning) {
      stopSystem();
      return;
    }
    startSystem();
  });

  ui.onVideoEnded(() => {
    ui.setStatus('ready', 'วิดีโอจบแล้ว — พูดคำว่า “ไอที”');
  });

  ui.onCloseVideo(() => {
    ui.setStatus('ready', 'ปิดวิดีโอแล้ว — พูดคำว่า “ไอที”');
  });
}

async function startSystem() {
  if (isRunning) return;
  isRunning = true;

  ui.setMicState(true);
  ui.setStatus('connecting', 'กำลังเชื่อมต่อ Gemini Live...');
  ui.setTranscript('');

  try {
    audioContext = new AudioContext({ sampleRate: 16000 });
    audioQueue = new AudioOutputQueue(audioContext);

    geminiClient = new GeminiLiveClient({
      onOpen: () => {
        ui.setStatus('ready', 'พร้อมแล้ว — พูดคำว่า “ไอที”');
      },
      onInputTranscription: (text) => {
        ui.setTranscript(text, true);
      },
      onOutputTranscription: (text) => {
        ui.setStatus('recording', text);
      },
      onAudioData: (base64Data, mimeType) => {
        audioQueue.playPcmBase64(base64Data, mimeType);
      },
      onToolCall: (toolName) => {
        if (toolName === 'open_clean_air_video') {
          ui.showVideo();
          ui.setStatus('ready', 'กำลังเล่นวิดีโอ Clean Air for Life');
        }
      },
      onError: (err) => {
        ui.setStatus('idle', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        stopSystem();
      },
      onClose: () => {
        if (isRunning) {
          ui.setStatus('idle', 'การเชื่อมต่อสิ้นสุด กรุณาเริ่มใหม่');
          stopSystem();
        }
      }
    });

    await geminiClient.connect();
    await startMicrophone();

  } catch (err) {
    console.error('System start failed:', err);
    ui.setStatus('idle', 'เริ่มระบบไม่สำเร็จ: ' + (err.message || 'Error'));
    stopSystem();
  }
}

async function startMicrophone() {
  if (!audioContext) return;

  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  sourceNode = audioContext.createMediaStreamSource(mediaStream);
  
  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 256;
  analyserNode.smoothingTimeConstant = 0.82;
  sourceNode.connect(analyserNode);

  if (visualizer) {
    visualizer.setAnalyser(analyserNode);
    visualizer.setState('recording');
  }

  processorNode = audioContext.createScriptProcessor(4096, 1, 1);
  processorNode.onaudioprocess = (event) => {
    if (!isRunning) return;
    if (!geminiClient) return;

    const inputData = event.inputBuffer.getChannelData(0);
    const pcm16 = float32ToPCM16(inputData);
    const base64 = arrayBufferToBase64(pcm16.buffer);
    geminiClient.sendAudioChunk(base64);
  };

  sourceNode.connect(processorNode);
  processorNode.connect(audioContext.destination);
}

function stopSystem() {
  isRunning = false;

  if (ui) {
    ui.setMicState(false);
    ui.setStatus('idle', 'กดปุ่มไมโครโฟนเพื่อเริ่มระบบ');
  }

  if (visualizer) {
    visualizer.setAnalyser(null);
    visualizer.setState('idle');
  }

  if (processorNode) {
    try { processorNode.disconnect(); } catch (e) {}
    processorNode = null;
  }

  if (sourceNode) {
    try { sourceNode.disconnect(); } catch (e) {}
    sourceNode = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  if (audioContext) {
    try { audioContext.close(); } catch (e) {}
    audioContext = null;
  }

  if (geminiClient) {
    geminiClient.disconnect();
    geminiClient = null;
  }

  audioQueue = null;
}
```

---

### Task 6: Redesign `public/index.html` (Semantic HTML & Accessibility)

**Files:**
- Modify: `public/index.html`

**Interfaces:**
- Consumes: Tailwind CSS CDN, Font Inter/JetBrains Mono, `public/css/style.css`, `public/js/app.js`.
- Produces: Dark futuristic UI structure with header, visualizer canvas, pulse button, transcript box, and video modal player.

- [ ] **Step 1: Rewrite `public/index.html` with modern semantic HTML markup, ARIA labels, and responsive layout**

```html
<!doctype html>
<html lang="th" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Clean Air Voice Assistant - ผู้ช่วยสั่งการด้วยเสียง</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Custom Styles & Tokens -->
  <link rel="stylesheet" href="css/style.css" />
</head>
<body class="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between select-none">

  <!-- ── Header ────────────────────────────────────────────── -->
  <header class="flex items-center justify-between px-6 sm:px-8 h-[56px] border-b border-zinc-800/80 shrink-0">
    <div class="flex items-center gap-3">
      <div id="status-dot" class="w-2 h-2 rounded-full bg-zinc-600 transition-all duration-300"></div>
      <span class="text-xs font-semibold text-zinc-300 tracking-[0.28em] uppercase font-display-custom">
        CLEAN AIR VOICE
      </span>
    </div>

    <div class="flex items-center gap-3 text-[10px] text-zinc-500 tracking-widest font-mono-custom">
      <span class="hidden sm:inline">GEMINI LIVE API</span>
      <span class="hidden sm:inline text-zinc-700">·</span>
      <span>WEB AUDIO</span>
    </div>
  </header>

  <!-- ── Main Area ─────────────────────────────────────────── -->
  <main class="flex-1 flex flex-col items-center justify-between py-10 px-6 sm:px-8 gap-8 max-w-4xl mx-auto w-full">

    <!-- Center Control Column -->
    <div class="flex flex-col items-center gap-6 w-full max-w-xl text-center">

      <!-- Status Badge -->
      <div class="flex items-center justify-center gap-2 h-6 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800/80" aria-live="polite">
        <span id="status-text" class="text-[11px] tracking-[0.2em] uppercase font-mono-custom text-zinc-400">
          กดปุ่มไมโครโฟนเพื่อเริ่มระบบ
        </span>
      </div>

      <!-- Transcript Box -->
      <div id="transcript-box" class="hidden w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-sm text-cyan-300/90 font-mono-custom transition-all">
        <p id="transcript-text" class="truncate"></p>
      </div>

      <!-- Main Mic Action Button Container -->
      <div class="relative flex items-center justify-center my-4" style="width: 172px; height: 172px;">

        <!-- Pulsing Rings (Active State) -->
        <div id="pulse-rings" class="hidden pointer-events-none">
          <div class="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping-slow"></div>
          <div class="absolute -inset-4 rounded-full border border-cyan-500/10 animate-ping-slow" style="animation-delay: 0.6s;"></div>
        </div>

        <!-- Ambient Glow -->
        <div id="mic-glow" class="absolute inset-0 rounded-full pointer-events-none transition-all duration-700"></div>

        <!-- Main Interactive Button -->
        <button
          id="mic-btn"
          type="button"
          aria-label="เริ่มหรือหยุดระบบสั่งการด้วยเสียง"
          class="relative w-[136px] h-[136px] rounded-full flex items-center justify-center bg-gradient-to-b from-zinc-800/90 to-zinc-900 border border-zinc-700/50 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 group"
        >
          <!-- Mic Icon -->
          <svg id="mic-icon" class="w-10 h-10 text-zinc-400 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>

          <!-- Stop Icon (Hidden by default) -->
          <svg id="stop-icon" class="w-10 h-10 text-cyan-400 hidden" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      </div>

      <p class="text-[11px] tracking-[0.2em] uppercase text-zinc-500 font-mono-custom">
        สั่งงานด้วยเสียง “ไอที” ➔ “Clean Air for Life”
      </p>
    </div>

    <!-- ── Visualizer Section ──────────────────────────────── -->
    <div class="w-full">
      <div class="flex items-center justify-between mb-2 px-1">
        <span class="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-mono-custom">
          FREQUENCY RESPONSE
        </span>
        <span class="text-[10px] tracking-widest text-zinc-500 font-mono-custom">
          20Hz - 20kHz
        </span>
      </div>

      <div class="relative w-full h-28 rounded-xl bg-zinc-950/60 border border-zinc-800/60 overflow-hidden">
        <!-- Canvas -->
        <canvas id="visualizer-canvas" class="w-full h-full block"></canvas>
      </div>
    </div>
  </main>

  <!-- ── Footer ────────────────────────────────────────────── -->
  <footer class="py-4 text-center border-t border-zinc-800/60 text-[11px] text-zinc-600 font-mono-custom shrink-0">
    Clean Air for Life © 2026 Assistant System
  </footer>

  <!-- ── Video Player Overlay Modal ────────────────────────── -->
  <div id="video-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 video-modal-backdrop hidden">
    <div class="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <h2 class="text-sm font-semibold text-cyan-400 font-display-custom tracking-wider">
          🎬 Clean Air for Life Video
        </h2>
        <button
          id="close-video-btn"
          type="button"
          aria-label="ปิดวิดีโอ"
          class="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Video Element -->
      <div class="relative aspect-video bg-black">
        <video id="video-player" controls class="w-full h-full">
          <source src="clean-air-for-life.mp4" type="video/mp4" />
          เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ HTML5
        </video>
      </div>
    </div>
  </div>

  <!-- Entry Script -->
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

---

### Task 7: End-to-End Verification & Server Test

**Files:**
- Read/Execute: `server.js`

- [ ] **Step 1: Test Server & Token API Endpoint**

Run command to verify backend:
```powershell
node -e "import('./server.js')"
```

- [ ] **Step 2: Verify static files in `public/`**

Check that `public/index.html`, `public/css/style.css`, `public/js/audio-helper.js`, `public/js/gemini-client.js`, `public/js/ui-controller.js`, and `public/js/app.js` are present and properly linked.
