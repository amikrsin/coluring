import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { handleEdgeRequest } from './workers/api';
import { handleR2Status, handleR2Test, handleR2Upload } from './server/r2-upload';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Scoped larger JSON limit exclusively for direct Cloudflare R2 binary uploads
  app.post('/api/r2-upload', express.json({ limit: '25mb' }), handleR2Upload);
  app.post('/api/r2-test', express.json({ limit: '64kb' }), handleR2Test);
  app.get('/api/r2-status', handleR2Status);

  app.use(express.json());

  /**
   * Bridge Express /api/* and /cdn/* requests directly into the exact same
   * Web Standards Request/Response handler used by Cloudflare Workers & Pages Functions.
   * This guarantees 100% parity between AI Studio preview and Cloudflare production!
   */
  const edgeBridge: express.RequestHandler = async (req, res, next) => {
    try {
      const origin = `${req.protocol}://${req.get('host') || `localhost:${PORT}`}`;
      const fullUrl = new URL(req.originalUrl, origin).toString();

      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      const webReq = new Request(fullUrl, {
        method: req.method,
        headers: {
          'content-type': req.headers['content-type'] || 'application/json',
        },
        body: hasBody && req.body ? JSON.stringify(req.body) : undefined,
      });

      const webRes = await handleEdgeRequest(webReq, {});

      res.status(webRes.status);
      webRes.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      const arrayBuf = await webRes.arrayBuffer();
      res.send(Buffer.from(arrayBuf));
    } catch (err) {
      next(err);
    }
  };

  app.use('/api', edgeBridge);
  app.use('/cdn', edgeBridge);

  if (process.env.NODE_ENV !== 'production') {
    const enableHmr = process.env.ENABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: enableHmr ? { server: httpServer } : false,
        ws: enableHmr ? undefined : false,
      },
      appType: 'spa',
    });

    if (!enableHmr) {
      app.get('/@vite/client', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(`
const sheetsMap = new Map();
export function updateStyle(id, content) {
  if (typeof document === 'undefined') return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else {
    style.textContent = content;
  }
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url) {
  return url;
}
export const overlayId = 'vite-error-overlay';
const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};
export class ErrorOverlay extends BaseElement {}
`);
      });
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`ColorWorld server running on http://localhost:${PORT}`);
  });
}

startServer();
