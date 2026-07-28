#!/usr/bin/env node
/**
 * Bundles the deep dive into dist/ct-p4-adoption-deep-dive.html — one file with
 * fonts, artwork and data inlined so it runs from file:// with no server and no
 * network. Remote tile photography is fetched at build time; if it can't be
 * reached the tiles fall back to the CSS gradient at runtime.
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const dist = path.join(root, 'dist');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const dataUri = (p, mime) =>
  `data:${mime};base64,${fs.readFileSync(path.join(root, p)).toString('base64')}`;

const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

async function main() {
  let html = read('index.html');
  let css = read('styles.css');
  let js = read('app.js');
  const data = JSON.parse(read('data/p4.json'));

  // 1. Fonts -> data URIs inside the stylesheet.
  css = css.replace(/url\('(assets\/fonts\/[^']+)'\)/g, (_, p) =>
    `url('${dataUri(p, MIME[path.extname(p)])}')`);

  // 2. Artwork referenced from CSS.
  css = css.replace(/url\('(assets\/[^']+\.(?:svg|png))'\)/g, (_, p) =>
    `url('${dataUri(p, MIME[path.extname(p)])}')`);

  // 3. Artwork referenced from markup.
  html = html.replace(/(src|href)="(assets\/[^"]+\.(?:svg|png))"/g, (_, attr, p) =>
    `${attr}="${dataUri(p, MIME[path.extname(p)])}"`);

  // 4. Any remote photography anywhere in the dataset -> data URIs, so the deck
  //    survives bad conference wifi. Walks the whole tree rather than a fixed
  //    key, so the JSON shape can change without touching the bundler.
  const cache = new Map();
  let embedded = 0, total = 0;
  const inlineRemote = async (node) => {
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        if (typeof node[i] === 'string') node[i] = await swap(node[i]);
        else await inlineRemote(node[i]);
      }
    } else if (node && typeof node === 'object') {
      for (const k of Object.keys(node)) {
        if (typeof node[k] === 'string') node[k] = await swap(node[k]);
        else await inlineRemote(node[k]);
      }
    }
  };
  const swap = async (val) => {
    if (!/^https?:\/\/.*\.(jpg|jpeg|png|webp)|^https?:\/\/images\.unsplash\.com/.test(val)) return val;
    total++;
    if (cache.has(val)) return cache.get(val);
    try {
      const res = await fetch(val, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const uri = `data:${res.headers.get('content-type') || 'image/jpeg'};base64,${buf.toString('base64')}`;
      cache.set(val, uri);
      embedded++;
      return uri;
    } catch (err) {
      console.warn(`  ! left remote (${err.message}): ${val.slice(0, 60)}…`);
      return val;
    }
  };
  await inlineRemote(data);
  console.log(`  images embedded: ${embedded}/${total}`);

  // 5. Serve the dataset from memory instead of over fetch().
  js = js.replace(/fetch\('data\/p4\.json'\)/g, '__loadData()');
  const preamble =
    `const __P4__ = ${JSON.stringify(data)};\n` +
    `function __loadData(){return Promise.resolve({json:()=>Promise.resolve(__P4__)});}\n`;

  // 6. Fold the external stylesheet and script into the document.
  html = html
    .replace(/[ \t]*<link rel="stylesheet" href="styles\.css"[^>]*>/,
      `  <style>\n${css}\n  </style>`)
    .replace(/[ \t]*<script src="app\.js"><\/script>/,
      `  <script>\n${preamble}${js}\n  </script>`);

  for (const leftover of [/href="styles\.css"/, /src="app\.js"/, /"data\/p4\.json"/, /"assets\//]) {
    if (leftover.test(html)) throw new Error(`unresolved external reference: ${leftover}`);
  }

  fs.mkdirSync(dist, { recursive: true });
  const out = path.join(dist, 'ct-p4-adoption-deep-dive.html');
  fs.writeFileSync(out, html);
  console.log(`  wrote ${path.relative(root, out)} (${(fs.statSync(out).size / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
