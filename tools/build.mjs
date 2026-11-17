// Construit l'application dans docs/ (dossier publié par GitHub Pages).
// 1. compile src/app.template.html en JSON
// 2. assemble le JavaScript avec esbuild
// 3. copie les fichiers statiques, les polices et prépare le service worker
import { parseFragment } from 'parse5';
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'docs');
const HOLE = /\{\{\s*([\w$.]+)\s*\}\}/g;

function splitHoles(str) {
  const parts = [];
  let last = 0;
  for (const m of str.matchAll(HOLE)) {
    if (m.index > last) parts.push(str.slice(last, m.index));
    parts.push({ p: m[1] });
    last = m.index + m[0].length;
  }
  if (last < str.length) parts.push(str.slice(last));
  return parts;
}

function attrSpec(value) {
  const parts = splitHoles(value);
  if (parts.length === 1 && typeof parts[0] === 'object') return parts[0]; // valeur brute
  if (parts.every((x) => typeof x === 'string')) return value;
  return { parts };
}

function holePath(value) {
  const m = /^\s*\{\{\s*([\w$.]+)\s*\}\}\s*$/.exec(value || '');
  if (!m) throw new Error('Expression attendue : ' + value);
  return m[1];
}

function convert(nodes) {
  const out = [];
  for (const n of nodes) {
    if (n.nodeName === '#comment') continue;
    if (n.nodeName === '#text') {
      if (!n.value.trim()) continue;
      out.push({ t: splitHoles(n.value) });
      continue;
    }
    const attrs = Object.fromEntries(n.attrs.map((a) => [a.name, a.value]));
    const kids = n.content ? n.content.childNodes : n.childNodes;
    if (n.tagName === 'sc-if') {
      out.push({ if: holePath(attrs.value), c: convert(kids) });
    } else if (n.tagName === 'sc-for') {
      out.push({ for: holePath(attrs.list), as: attrs.as, c: convert(kids) });
    } else {
      const a = {};
      for (const [name, value] of Object.entries(attrs)) {
        if (name.startsWith('hint-')) continue;
        let key = name;
        // onChange de React = saisie en direct ; en DOM natif, c'est l'événement « input »
        if (name === 'onchange' && n.tagName === 'input') key = 'oninput';
        a[key] = attrSpec(value);
      }
      out.push({ e: n.tagName, a, c: convert(kids) });
    }
  }
  return out;
}

// 1. Gabarit
const html = readFileSync(join(SRC, 'app.template.html'), 'utf8');
const tree = convert(parseFragment(html).childNodes);
mkdirSync(join(SRC, 'generated'), { recursive: true });
writeFileSync(join(SRC, 'generated', 'template.json'), JSON.stringify(tree));

// 2. JavaScript
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
await build({
  entryPoints: [join(SRC, 'main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2018', 'safari13'],
  outfile: join(OUT, 'app.js'),
  logLevel: 'warning',
  // Date et heure de la version, affichées dans les réglages
  define: { __BUILD__: JSON.stringify(new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })) },
});

// 3. Statiques et polices
cpSync(join(SRC, 'static'), OUT, { recursive: true });
mkdirSync(join(OUT, 'fonts'), { recursive: true });
const fonts = [
  ['inter', 'Inter', [400, 500, 600, 700]],
  ['space-grotesk', 'Space Grotesk', [500, 700]],
];
let css = '';
for (const [pkg, family, weights] of fonts) {
  for (const w of weights) {
    const file = `${pkg}-latin-${w}-normal.woff2`;
    copyFileSync(join(ROOT, 'node_modules', '@fontsource', pkg, 'files', file), join(OUT, 'fonts', file));
    css += `@font-face{font-family:'${family}';font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${file}) format('woff2')}\n`;
  }
}
writeFileSync(join(OUT, 'fonts.css'), css);
writeFileSync(join(OUT, '.nojekyll'), '');

// Service worker : liste des fichiers à garder hors ligne + version liée au contenu
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(OUT).filter((p) => !p.endsWith('sw.js') && !p.endsWith('.nojekyll'));
const hash = createHash('sha256');
files.sort().forEach((p) => hash.update(readFileSync(p)));
const version = hash.digest('hex').slice(0, 12);
const assets = ['./'].concat(files.map((p) => './' + relative(OUT, p)));
const sw = readFileSync(join(OUT, 'sw.js'), 'utf8')
  .replace('__VERSION__', version)
  .replace('__ASSETS__', JSON.stringify(assets));
writeFileSync(join(OUT, 'sw.js'), sw);

console.log(`Build terminé : docs/ (version ${version}, ${assets.length} fichiers)`);
