// storybook-static を配信するだけの依存ゼロ静的サーバー。
// VRT（playwright.vrt.config.ts の webServer）から起動される。
// 外部パッケージを足さずに済ませるためだけの存在なので、機能は最小限。
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import process from 'node:process';

const [, , dirArg = 'storybook-static', portArg = '6007'] = process.argv;
const root = resolve(process.cwd(), dirArg);
const port = Number(portArg);

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
  ['.map', 'application/json; charset=utf-8'],
]);

const resolveFilePath = (urlPath) => {
  // ディレクトリトラバーサル対策。root の外に出る要求は 403 にする。
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const candidate = resolve(join(root, normalize(decoded)));
  if (candidate !== root && !candidate.startsWith(root + sep)) return null;

  try {
    return statSync(candidate).isDirectory()
      ? join(candidate, 'index.html')
      : candidate;
  } catch {
    return candidate;
  }
};

const server = createServer((req, res) => {
  const filePath = resolveFilePath(req.url ?? '/');
  if (filePath === null) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  const stream = createReadStream(filePath);
  stream.on('open', () => {
    res.writeHead(200, {
      'Content-Type':
        MIME_TYPES.get(extname(filePath)) ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    stream.pipe(res);
  });
  stream.on('error', () => {
    res.writeHead(404).end('Not Found');
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`serving ${root} at http://127.0.0.1:${port}`);
});
