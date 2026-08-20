import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/api/token', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY in .env' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 60 * 1000);

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: 'gemini-3.1-flash-live-preview',
          config: {
            responseModalities: ['AUDIO']
          }
        }
      }
    });

    res.json({ token: token.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Cannot create ephemeral token' });
  }
});

app.listen(port, () => {
  console.log(`Open http://localhost:${port}`);
});
