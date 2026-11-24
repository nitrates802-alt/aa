import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/gemini/assist', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured in Settings > Secrets. Add a valid key to run live Gemini translation and proofreading.',
      });
      return;
    }

    const { text, mode, targetLanguage } = req.body as {
      text?: string;
      mode?: 'translate' | 'proofread';
      targetLanguage?: 'English' | 'Urdu' | 'Saraiki';
    };

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Enter some text before running Gemini.' });
      return;
    }

    const cleanMode = mode === 'proofread' ? 'proofread' : 'translate';
    const cleanTarget =
      targetLanguage === 'Urdu' || targetLanguage === 'Saraiki' ? targetLanguage : 'English';

    const systemInstruction =
      cleanMode === 'proofread'
        ? `You are SaraikiKey's on-demand proofreader. Fix spelling, grammar, and Arabic/Nastaliq script punctuation (preserving Saraiki letters like ڄ ڃ ڳ ڱ ݙ ٻ ݨ) while keeping the author's tone. Return only the corrected text without commentary.`
        : `You are SaraikiKey's on-demand translator. Translate the user's text naturally into ${cleanTarget} (using authentic Perso-Arabic script with proper classical Saraiki glyphs ڄ ڃ ڳ ڱ ݙ ٻ ݨ when targeting Saraiki). Return only the translated text without commentary.`;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: text.trim(),
        config: {
          systemInstruction,
        },
      });

      const output = (response.text ?? '').trim();
      if (!output) {
        res.status(502).json({ error: 'Gemini returned an empty response.' });
        return;
      }

      res.json({ output, model: 'gemini-4-hydrogen' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gemini request failed.';
      res.status(502).json({ error: message });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SaraikiKey Studio listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
