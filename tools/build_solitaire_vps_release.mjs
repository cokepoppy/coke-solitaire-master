import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(process.argv[2] ?? 'dist/solitaire');
const base = '/solitaire';
const cacheName = 'solitaire-master-solitaire-v92';
const cachePrefix = 'solitaire-master-solitaire-v';

if (output === root || output.startsWith(`${root}${path.sep}`)) {
  throw new Error('Choose an output directory outside the source checkout.');
}

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const entry of ['index.html', 'manifest.webmanifest', 'sw.js', 'src', 'assets']) {
  cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
}

function visit(directory) {
  for (const entry of readdirSync(directory)) {
    const file = path.join(directory, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) {
      visit(file);
      continue;
    }

    if (!['.html', '.css', '.js', '.webmanifest'].includes(path.extname(file))) continue;
    let source = readFileSync(file, 'utf8');
    source = source
      .replaceAll('/assets/', `${base}/assets/`)
      .replaceAll('/src/', `${base}/src/`)
      .replaceAll('/sw.js', `${base}/sw.js`)
      .replaceAll('/manifest.webmanifest', `${base}/manifest.webmanifest`)
      .replaceAll("'/index.html'", `'/solitaire/index.html'`)
      .replaceAll("['/', '/solitaire/index.html'", "['/solitaire/', '/solitaire/index.html'")
      .replaceAll('"start_url": "/"', `"start_url": "${base}/"`)
      .replace(/solitaire-master-v\d+/g, cacheName)
      .replaceAll('solitaire-master-v', cachePrefix);

    if (/['"`]\/(?:assets|src)\//.test(source)) {
      throw new Error(`Unscoped asset path remains in ${path.relative(output, file)}`);
    }
    if (source.includes("register('/sw.js')") || source.includes("caches.match('/index.html')")) {
      throw new Error(`Unscoped worker path remains in ${path.relative(output, file)}`);
    }
    writeFileSync(file, source);
  }
}

visit(output);
console.log(`Built ${base}/ static release at ${output}`);
