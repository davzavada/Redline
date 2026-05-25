import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import compression from 'vite-plugin-compression';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { exec } from 'child_process';
import fs from 'fs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        viteSingleFile(),
        {
          name: 'download-endpoint',
          configureServer(server) {
            server.middlewares.use('/api/download-html', (req, res) => {
              exec('npm run build', (error) => {
                if (error) {
                  console.error(`Build error: ${error}`);
                  res.statusCode = 500;
                  res.end('Error building file');
                  return;
                }
                const distPath = path.resolve(__dirname, 'dist', 'index.html');
                if (fs.existsSync(distPath)) {
                  const html = fs.readFileSync(distPath);
                  res.setHeader('Content-Disposition', 'attachment; filename="LegalLens-Redline-Offline.html"');
                  res.setHeader('Content-Type', 'text/html');
                  res.end(html);
                } else {
                  res.statusCode = 500;
                  res.end('Index.html not found in dist.');
                }
              });
            });
          }
        },
        compression({
          algorithm: 'gzip',
          ext: '.gz',
        }),
        compression({
          algorithm: 'brotliCompress',
          ext: '.br',
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'esnext',
        minify: 'esbuild',
        cssMinify: true,
        reportCompressedSize: false,
        chunkSizeWarningLimit: 100000000 // single file gets large
      }
    };
});
