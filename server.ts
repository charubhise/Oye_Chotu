import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { SAMPLE_PRODUCTS } from './src/data/products.ts';
import { parseVoiceIntent, filterProducts } from './src/utils/voiceParser.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Support JSON bodies up to 25MB for audio uploads
app.use(express.json({ limit: '25mb' }));

// In-memory orders store
const placedOrders: any[] = [];

// API: Voice Command Processing
app.post('/api/voice-command', async (req: Request, res: Response) => {
  try {
    const { transcript, audioBase64, mimeType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    let recognizedText = transcript || '';

    // If audio is provided and Gemini API key is configured, process multimodal audio
    if (audioBase64 && apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

        const prompt = `You are Oye Chotu, a friendly Indian voice-shopping assistant robot.
The user spoke a shopping command in Hindi, Marathi, Hinglish, Roman Marathi, or English.
Analyze the speech audio and output ONLY a JSON object in this format:
{
  "transcript": "<verbatim transcript>",
  "detectedLanguage": "Hindi" | "Marathi" | "Hinglish" | "Roman Marathi" | "English",
  "intent": "search" | "set_budget" | "add_to_cart" | "update_quantity" | "remove_item" | "get_cart_total" | "find_cheaper" | "undo" | "confirm_order" | "reset_filter",
  "parameters": {
    "query": "<item search query or null>",
    "maxPrice": <number or null>,
    "minPrice": <number or null>,
    "category": "fashion" | "electronics" | "home" | "beauty" | "accessories" | null,
    "position": <1-based displayed item index or null>,
    "quantity": <number or null>,
    "budget": <number or null>
  },
  "replyText": "<friendly Chotu reply in simple Hinglish/Hindi/Marathi>"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'audio/webm',
              },
            },
            { text: prompt },
          ],
        });

        const rawText = response.text?.trim() || '';
        const cleanedJson = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        const parsed = JSON.parse(cleanedJson);
        return res.json(parsed);
      } catch (geminiErr) {
        console.warn('Gemini audio processing fallback to text/local parser:', geminiErr);
        // Fall back to local parser if transcript is present
      }
    }

    // Local Multilingual NLP Parser
    if (!recognizedText) {
      return res.status(400).json({ error: 'No audio or transcript provided.' });
    }

    const intentResult = parseVoiceIntent(recognizedText, SAMPLE_PRODUCTS);
    return res.json(intentResult);
  } catch (err: any) {
    console.error('Error in /api/voice-command:', err);
    return res.status(500).json({ error: err.message || 'Voice processing error' });
  }
});

// API: Get Products
app.get('/api/products', (req: Request, res: Response) => {
  const { query, category, color, maxPrice } = req.query;
  const mockIntent = {
    intent: 'search' as const,
    transcript: '',
    detectedLanguage: 'en',
    parameters: {
      query: typeof query === 'string' ? query : undefined,
      category: typeof category === 'string' ? (category as any) : undefined,
      requestedColor: typeof color === 'string' ? color : undefined,
      maxPrice: typeof maxPrice === 'string' ? parseInt(maxPrice, 10) : undefined,
    },
    replyText: '',
  };
  const { matchingProducts } = filterProducts(SAMPLE_PRODUCTS, mockIntent);
  res.json(matchingProducts);
});

// API: Confirm Demo Order
app.post('/api/orders', (req: Request, res: Response) => {
  const { order } = req.body;
  if (!order || !order.items || order.items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }
  const orderRecord = {
    ...order,
    id: `OC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: 'Confirmed',
  };
  placedOrders.push(orderRecord);
  res.json({ success: true, order: orderRecord });
});

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 Oye Chotu server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
