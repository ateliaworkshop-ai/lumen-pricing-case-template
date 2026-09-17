import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import healthHandler from './api/health.ts';
import scenariosHandler from './api/scenarios.ts';
import evaluateHandler from './api/evaluate.ts';
import competitorsHandler from './api/competitors.ts';
import evidenceHandler from './api/evidence.ts';

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;
        const query: Record<string, string> = {};
        urlObj.searchParams.forEach((v, k) => {
          query[k] = v;
        });

        // Decorate response with helper methods
        const decoratedRes = res as any;
        decoratedRes.status = (code: number) => {
          res.statusCode = code;
          return decoratedRes;
        };
        decoratedRes.json = (data: any) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return decoratedRes;
        };

        const decoratedReq = req as any;
        decoratedReq.query = query;

        // Parse request body for POST/PUT requests
        if (req.method === 'POST' || req.method === 'PUT') {
          let bodyStr = '';
          req.on('data', chunk => {
            bodyStr += chunk;
          });
          req.on('end', () => {
            try {
              decoratedReq.body = bodyStr ? JSON.parse(bodyStr) : {};
            } catch {
              decoratedReq.body = bodyStr;
            }
            routeRequest(pathname, decoratedReq, decoratedRes, next);
          });
          return;
        }

        routeRequest(pathname, decoratedReq, decoratedRes, next);
      });
    }
  };
}

function routeRequest(pathname: string, req: any, res: any, next: any) {
  if (pathname === '/api/health') {
    return healthHandler(req, res);
  }
  if (pathname === '/api/scenarios') {
    return scenariosHandler(req, res);
  }
  if (pathname === '/api/evaluate') {
    return evaluateHandler(req, res);
  }
  if (pathname === '/api/competitors') {
    return competitorsHandler(req, res);
  }
  if (pathname === '/api/evidence') {
    return evidenceHandler(req, res);
  }
  next();
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
