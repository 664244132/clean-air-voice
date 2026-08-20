import { GoogleGenAI, Modality, Type } from 'https://esm.run/@google/genai';

const statusEl = document.querySelector('#status');
const transcriptEl = document.querySelector('#transcript');
const startBtn = document.querySelector('#start');
const stopBtn = document.querySelector('#stop');
const video = document.querySelector('#video');

let session = null;
let stream = null;
let audioContext = null;
let sourceNode = null;
let processorNode = null;
let running = false;
let mode = 'wake';
let outputQueueTime = 0;

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

startBtn.onclick = startSystem;
stopBtn.onclick = stopSystem;
video.addEventListener('ended', () => {
  video.style.display = 'none';
  mode = 'wake';
  statusEl.textContent = 'วิดีโอจบแล้ว รอฟังคำว่า “ไอที”';
});

async function startSystem() {
  if (running) return;
  running = true;
  mode = 'wake';
  statusEl.textContent = 'กำลังเชื่อมต่อ Gemini...';

  try {
    const tokenRes = await fetch('/api/token');
    const data = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(data.error || 'Token error');

    const ai = new GoogleGenAI({ apiKey: data.token, httpOptions: { apiVersion: 'v1beta' } });

    session = await ai.live.connect({
      model: MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction,
        tools
      },
      callbacks: {
        onopen() {
          statusEl.textContent = 'พร้อมแล้ว — พูดคำว่า “ไอที”';
        },
        onmessage(message) {
          handleMessage(message);
        },
        onerror(e) {
          console.error(e);
          statusEl.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        },
        onclose() {
          if (running) statusEl.textContent = 'การเชื่อมต่อสิ้นสุด กรุณาเริ่มใหม่';
        }
      }
    });

    await startMicrophone();
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'เริ่มระบบไม่สำเร็จ: ' + err.message;
    running = false;
  }
}

async function startMicrophone() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new AudioContext({ sampleRate: 16000 });
  sourceNode = audioContext.createMediaStreamSource(stream);
  processorNode = audioContext.createScriptProcessor(4096, 1, 1);

  processorNode.onaudioprocess = (event) => {
    if (!running || !session) return;
    const input = event.inputBuffer.getChannelData(0);
    const pcm16 = float32ToPCM16(input);
    const base64 = arrayBufferToBase64(pcm16.buffer);
    session.sendRealtimeInput({
      audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
    });
  };

  sourceNode.connect(processorNode);
  processorNode.connect(audioContext.destination);
}

function handleMessage(message) {
  const sc = message.serverContent;
  if (sc?.inputTranscription?.text) {
    transcriptEl.textContent = 'ได้ยิน: ' + sc.inputTranscription.text;
  }
  if (sc?.outputTranscription?.text) {
    statusEl.textContent = sc.outputTranscription.text;
  }

  for (const part of sc?.modelTurn?.parts || []) {
    if (part.inlineData?.data) playPcmBase64(part.inlineData.data, part.inlineData.mimeType || 'audio/pcm;rate=24000');
  }

  if (message.toolCall?.functionCalls?.length) {
    for (const call of message.toolCall.functionCalls) {
      if (call.name === 'open_clean_air_video') {
        openVideo();
        session.sendToolResponse({
          functionResponses: [{ id: call.id, name: call.name, response: { result: 'video_opened' } }]
        });
      }
    }
  }
}

function openVideo() {
  mode = 'command';
  statusEl.textContent = 'กำลังเปิด Clean Air for Life';
  video.style.display = 'block';
  video.currentTime = 0;
  video.play().catch(() => {
    statusEl.textContent = 'กรุณากดปุ่ม Play ที่วิดีโอ';
  });
}

function stopSystem() {
  running = false;
  try { processorNode?.disconnect(); } catch {}
  try { sourceNode?.disconnect(); } catch {}
  stream?.getTracks().forEach(t => t.stop());
  audioContext?.close();
  try { session?.close(); } catch {}
  session = null;
  video.pause();
  statusEl.textContent = 'หยุดระบบแล้ว';
}

function float32ToPCM16(input) {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function playPcmBase64(base64, mimeType) {
  if (!audioContext) return;
  const match = /rate=(\d+)/.exec(mimeType);
  const rate = match ? Number(match[1]) : 24000;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const pcm = new Int16Array(bytes.buffer);
  const buffer = audioContext.createBuffer(1, pcm.length, rate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 32768;
  const node = audioContext.createBufferSource();
  node.buffer = buffer;
  node.connect(audioContext.destination);
  const now = audioContext.currentTime;
  outputQueueTime = Math.max(outputQueueTime, now);
  node.start(outputQueueTime);
  outputQueueTime += buffer.duration;
}
