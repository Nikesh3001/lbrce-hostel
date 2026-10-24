import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './server/routes/index';
import { connectDB } from './server/db';
import { requestLogger } from './server/middleware/logger.middleware';
import { errorHandler } from './server/middleware/error.middleware';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Core Express middlewares
app.use(express.json());
app.use(requestLogger);

// Mount MERN REST API routes
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

async function startServer() {
  // Connect to MongoDB (or fall back cleanly to memory store)
  await connectDB();

  if (!isProd) {
    // Dev mode: Mount Vite dev middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LBRCE MERN Server] Running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
