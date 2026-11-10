import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from './server/api.ts';

dotenv.config();

function expressApiPlugin(): Plugin {
  const app = express();
  app.use(express.json());
  app.use(apiRouter);

  return {
    name: 'express-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // If it's an API route and has a body, buffer it so connect doesn't stall
        if (req.url?.startsWith('/api') && (req.method === 'POST' || req.method === 'PUT')) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              (req as any).body = body ? JSON.parse(body) : {};
              (req as any)._body = true;
            } catch {
              (req as any).body = {};
              (req as any)._body = true;
            }
            app(req as any, res as any, next);
          });
          req.on('error', () => {
            app(req as any, res as any, next);
          });
        } else {
          app(req as any, res as any, next);
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressApiPlugin()],
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
