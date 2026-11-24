import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

const ADMIN_DIST = path.resolve(__dirname, '../admin/dist');

const MIME_MAP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function mountAdminAtSubpath(): Plugin {
  return {
    name: 'mount-admin-subpath',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const cleanUrl = (req.url || '').split('?')[0];
        if (cleanUrl === '/admin') {
          res.statusCode = 302;
          res.setHeader('Location', '/admin/');
          res.end();
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '';
        const cleanUrl = rawUrl.split('?')[0];
        if (cleanUrl === '/admin') {
          res.statusCode = 302;
          res.setHeader('Location', '/admin/');
          res.end();
          return;
        }
        if (!cleanUrl.startsWith('/admin/')) {
          next();
          return;
        }
        const relPath = cleanUrl.slice('/admin/'.length);
        const safeRel = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
        const candidate = path.join(ADMIN_DIST, safeRel);
        if (relPath && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          const ext = path.extname(candidate).toLowerCase();
          res.setHeader('Content-Type', MIME_MAP[ext] || 'application/octet-stream');
          fs.createReadStream(candidate).pipe(res);
          return;
        }
        const indexHtml = path.join(ADMIN_DIST, 'index.html');
        if (fs.existsSync(indexHtml)) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          fs.createReadStream(indexHtml).pipe(res);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), mountAdminAtSubpath()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
    proxy: {
      '/admin': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
