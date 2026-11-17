// Génère les icônes de l'app (piste « Trio barré ») dans src/static/icons.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(new URL('..', import.meta.url).pathname, 'src', 'static', 'icons');
mkdirSync(OUT, { recursive: true });

const BG = '#14513B';
const ART = [
  '<path d="M17 26h22l-3 15a8 8 0 0 1-16 0z" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"/>',
  '<path d="M28 49v15M21 65h14" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>',
  '<rect x="46" y="26" width="9" height="40" rx="2" fill="#FFFFFF"/>',
  '<rect x="46" y="53" width="9" height="13" rx="2" fill="#E89B4F"/>',
  '<rect x="66" y="18" width="6" height="9" rx="2" fill="#FFFFFF"/>',
  '<rect x="63" y="25" width="12" height="42" rx="5" fill="#FFFFFF"/>',
  `<rect x="66" y="34" width="6" height="11" rx="2" fill="${BG}"/>`,
  `<path d="M14 80L86 22" fill="none" stroke="${BG}" stroke-width="13" stroke-linecap="round"/>`,
  '<path d="M14 80L86 22" fill="none" stroke="#9FD0B9" stroke-width="6" stroke-linecap="round"/>',
].join('');

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;
const full = svg(`<rect width="100" height="100" fill="${BG}"/>${ART}`);
const rounded = svg(`<rect width="100" height="100" rx="22" fill="${BG}"/>${ART}`);
// Icône « maskable » Android : le dessin reste dans la zone sûre centrale
const maskable = svg(`<rect width="100" height="100" fill="${BG}"/><g transform="translate(50 50) scale(0.74) translate(-50 -50)">${ART}</g>`);

const png = (src, size, name) => sharp(Buffer.from(src)).resize(size, size).png().toFile(join(OUT, name));

await Promise.all([
  png(full, 180, 'apple-touch-icon.png'),
  png(full, 192, 'icon-192.png'),
  png(full, 512, 'icon-512.png'),
  png(maskable, 512, 'maskable-512.png'),
]);
writeFileSync(join(OUT, 'favicon.svg'), rounded);
console.log('Icônes générées dans src/static/icons');
