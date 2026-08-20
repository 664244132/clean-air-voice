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
