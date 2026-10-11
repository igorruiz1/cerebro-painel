/* Gera os icones PNG do painel instalavel (p132, s2468, 11/10/2026) a partir do mesmo desenho do SVG do manifest.
   POR QUE PNG: o manifest so tinha um SVG embutido. O iPhone nao le icone do manifest: usa o apple-touch-icon e,
   sem ele, poe uma foto da pagina na Tela de Inicio. O Chrome do Android pede 192 e 512 para oferecer a instalacao.
   COMO: o Chromium do Playwright desenha o SVG no tamanho exato e tira a foto; rodar de novo da o mesmo arquivo.
   Uso: node scripts/icones.mjs */
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* rx = canto arredondado. "any" leva o canto do desenho original; maskable e apple-touch vao sangrados (rx 0),
   porque o Android e o iPhone recortam a mascara deles. O "DT" fica dentro da zona segura de 80%. */
const svg = rx => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2F80FF"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>
  <rect width="512" height="512" rx="${rx}" fill="#0B1020"/>
  <text x="256" y="300" text-anchor="middle" font-family="Sora,Segoe UI,DejaVu Sans,sans-serif" font-weight="700" font-size="150" fill="#F4F7FB">DT</text>
  <rect x="156" y="350" width="200" height="14" rx="7" fill="url(#g)"/></svg>`;

const alvos = [
  { arq: 'icone-192.png', lado: 192, rx: 96 },
  { arq: 'icone-512.png', lado: 512, rx: 96 },
  { arq: 'icone-maskable-512.png', lado: 512, rx: 0 },
  { arq: 'apple-touch-icon.png', lado: 180, rx: 0 },
];

const nav = await chromium.launch();
for (const a of alvos) {
  const pag = await nav.newPage({ viewport: { width: a.lado, height: a.lado }, deviceScaleFactor: 1 });
  await pag.setContent(`<html><body style="margin:0;background:transparent">${svg(a.rx)}</body></html>`);
  await pag.screenshot({ path: path.join(raiz, a.arq), omitBackground: true });
  await pag.close();
  console.log('gerado', a.arq, a.lado + 'px');
}
await nav.close();
