import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // 開発専用API プラグイン
    {
      name: 'dev-pavilions-api',
      configureServer(server) {
        server.middlewares.use('/__dev/api/pavilions', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });

            req.on('end', () => {
              try {
                const payload = JSON.parse(body) as unknown;
                const updates = (Array.isArray(payload) ? payload : [payload]) as unknown[];

                const outputPath = path.join(projectRoot, 'public/data/pavilions.json');
                const backupPath = path.join(projectRoot, 'public/data/pavilions.bak.json');

                const existingRaw = fs.existsSync(outputPath)
                  ? JSON.parse(fs.readFileSync(outputPath, 'utf8'))
                  : [];

                const existing = Array.isArray(existingRaw) ? existingRaw : [];

                // 初回のみバックアップ作成
                if (fs.existsSync(outputPath) && !fs.existsSync(backupPath)) {
                  fs.copyFileSync(outputPath, backupPath);
                }

                type PavilionRecord = {
                  id: string;
                  name: string;
                  coordinate: { x: number; y: number } | null;
                  hitboxRadius: number | null;
                  [key: string]: unknown;
                };

                const map = new Map<string, PavilionRecord>(
                  existing
                    .filter((item): item is PavilionRecord => typeof item?.id === 'string')
                    .map(item => [item.id, item])
                );

                for (const update of updates) {
                  if (typeof update !== 'object' || update === null) {
                    throw new Error('無効なリクエストボディです');
                  }

                  const { id } = update as { id?: unknown };

                  if (typeof id !== 'string' || id === '') {
                    throw new Error('id が指定されていません');
                  }

                  const current = map.get(id) ?? {
                    id,
                    name: typeof (update as { name?: unknown }).name === 'string' ? (update as { name: string }).name : id,
                    coordinate: null,
                    hitboxRadius: null
                  };

                  const updateRecord = {
                    ...current,
                    ...(update as Record<string, unknown>)
                  };

                  map.set(id, updateRecord);
                }

                const merged = Array.from(map.values());
                fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  error: `保存エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
                }));
              }
            });
          } else {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
        });
      }
    }
  ],
})
