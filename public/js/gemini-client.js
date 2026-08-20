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
