// server.js - Ephemeral Key sağlayan Express sunucusu
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ephemeral token endpoint
app.get('/session', async (req, res) => {
  try {
    const model = req.query.model || 'gpt-4o-realtime-preview-2024-12-17';
    const voice = req.query.voice || 'nova'; // veya "verse"

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, voice }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Ephemeral Token Error:', err);
    res.status(500).json({ error: 'Token fetch error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Realtime Proxy Server running on port ${PORT}`);
});
