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
