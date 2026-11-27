#!/usr/bin/env node
/**
 * sync-youtube.mjs — trae los videos del canal de YouTube al portfolio.
 *
 *   node scripts/sync-youtube.mjs            lee el canal y actualiza lo que cambió
 *   node scripts/sync-youtube.mjs --refresh  además vuelve a bajar todas las imágenes
 *
 * No necesita claves: usa el feed público del canal, que trae los 15 videos más nuevos.
 * Escribe:
 *   src/data/youtube-works.json            las piezas, con la forma de Work (display-works.ts)
 *   public/works/yt/<video>-0.webp         póster de la ficha
 *   public/works/thumbs/yt/<video>-0.webp  miniatura de la grilla
 *
 * Cómo se lee cada video (también en DIRECTION.md, «Videos de YouTube»):
 *   - título: el de YouTube sin la firma del final («- DV [Wopell]», «- [ by Wopell ]»…)
 *   - categoría: un hashtag en la descripción o en el título: #animacion, #3d, #ia o #post.
 *     Sin hashtag, la pieza aparece solo en «Todo».
 *   - cliente: una línea «Cliente: Nombre» en la descripción; si no está, «Wopell».
 *   - #oculto en la descripción saca el video del portfolio.
 *   - los Shorts entran como piezas verticales (o cuadradas, si el original es 1:1).
 *
 * El feed solo trae los últimos 15, así que las piezas ya guardadas se conservan aunque
 * salgan del feed. Una pieza guardada se borra solo cuando YouTube confirma que el video
 * ya no es público. Si YouTube no responde, no se toca nada y el script termina bien:
 * el sitio se arma con lo último guardado.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CHANNEL = process.env.YT_CHANNEL_ID || 'UC1g54OYAb-7f9DloizE9zyA'; // youtube.com/@wopellart
const DATA = path.join(ROOT, 'src/data/youtube-works.json');
const FULL_DIR = path.join(ROOT, 'public/works/yt');
const THUMB_DIR = path.join(ROOT, 'public/works/thumbs/yt');
const REFRESH = process.argv.includes('--refresh');
const UA = 'Mozilla/5.0 (portfolio sync)';

const CATEGORIES = [
  { tags: ['animacion', 'animation', 'motion', '2d'], categoryId: 'category-animation', kind: 'Animación' },
  { tags: ['3d', 'render', 'blender'], categoryId: 'category-3d-art', kind: '3D' },
  { tags: ['ia', 'ai'], categoryId: 'category-ia', kind: 'IA' },
  { tags: ['post', 'postpro', 'postproduccion', 'vfx'], categoryId: 'category-post-production', kind: 'Post' },
];
const HIDE_TAG = 'oculto';

const log = (...a) => console.log('[youtube]', ...a);

/* ── lectura del feed ─────────────────────────────────────────────────────── */

const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const pick = (xml, tag) => {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  return m ? decode(m[1].trim()) : '';
};

function parseFeed(xml) {
  return xml
    .split('<entry>')
    .slice(1)
    .map((e) => ({
      videoId: pick(e, 'yt:videoId'),
      title: pick(e, 'title'),
      published: pick(e, 'published'),
      description: pick(e, 'media:description'),
    }))
    .filter((v) => v.videoId);
}

/* ── reglas: título, categoría, cliente ───────────────────────────────────── */

const fold = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const hashtags = (s) => [...fold(s).matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1]);

function cleanTitle(raw) {
  let t = raw
    // la firma del final: «- DV [Wopell]», «- W [Wopell]», «- [ by Wopell ]», «- [Wopell] 2022 Project»
    .replace(/\s*[-–—]\s*(?:[A-Z]{1,3}\s*)?\[[^\]]*wopell[^\]]*\].*$/i, '')
    .replace(/^\s*wopell\s*[-–—:]\s*/i, '')
    .replace(/#[\p{L}\p{N}_]+/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!t) t = raw.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function readRules(video) {
  const tags = hashtags(`${video.title} ${video.description}`);
  const cat = CATEGORIES.find((c) => c.tags.some((t) => tags.includes(t)));
  const client = video.description.match(/^\s*cliente\s*:\s*(.+?)\s*$/im)?.[1] || 'Wopell';
  return {
    hidden: tags.includes(HIDE_TAG),
    categoryId: cat?.categoryId ?? '',
    kind: cat?.kind ?? 'Video',
    client,
  };
}

/* ── consultas a YouTube ─────────────────────────────────────────────────── */

async function get(url, init = {}) {
  return fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'es' }, signal: AbortSignal.timeout(20000), ...init });
}

/** un Short responde 200 en /shorts/<id>; un video común redirige */
async function isShort(id) {
  try {
    const r = await get(`https://www.youtube.com/shorts/${id}`, { method: 'HEAD', redirect: 'manual' });
    return r.status === 200;
  } catch {
    return false;
  }
}

async function durationOf(id) {
  try {
    const html = await (await get(`https://www.youtube.com/watch?v=${id}`)).text();
    const s = Number(html.match(/"lengthSeconds":"(\d+)"/)?.[1]);
    if (!s) return '';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = String(s % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
  } catch {
    return '';
  }
}

/** 'public' | 'gone' | 'unknown' (sin respuesta: no se borra nada) */
async function stillPublic(id) {
  try {
    const r = await get(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`);
    if (r.ok) return 'public';
    return r.status === 401 || r.status === 403 || r.status === 404 ? 'gone' : 'unknown';
  } catch {
    return 'unknown';
  }
}

/* ── imágenes ────────────────────────────────────────────────────────────── */

const HAS_FFMPEG = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
const EXT = HAS_FFMPEG ? 'webp' : 'jpg';

async function download(url, file) {
  const r = await get(url);
  if (!r.ok) return false;
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 2000) return false; // YouTube devuelve un gris de 120×90 cuando no existe
  writeFileSync(file, buf);
  return true;
}

function ffmpeg(input, output, filter) {
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', input, '-vf', filter, '-c:v', 'libwebp', '-quality', '82', output]);
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}`);
}

async function saveImages(id, vertical) {
  const full = path.join(FULL_DIR, `${id}-0.${EXT}`);
  const thumb = path.join(THUMB_DIR, `${id}-0.${EXT}`);
  if (!REFRESH && existsSync(full) && existsSync(thumb)) return true;
  const tmp = mkdtempSync(path.join(tmpdir(), 'yt-'));
  try {
    const src = path.join(tmp, 'src.jpg');
    // vertical: oardefault conserva la proporción original; horizontal: maxres es 1280×720.
    // sd/hq vienen con franjas negras (4:3), así que se recortan al centro.
    const tries = vertical
      ? [['oardefault', null], ['maxresdefault', 'crop=ih*9/16:ih']]
      : [['maxresdefault', null], ['sddefault', 'crop=iw:iw*9/16'], ['hqdefault', 'crop=iw:iw*9/16']];
    let crop;
    let ok = false;
    for (const [name, c] of tries) {
      if (await download(`https://i.ytimg.com/vi/${id}/${name}.jpg`, src)) {
        crop = c;
        ok = true;
        break;
      }
    }
    if (!ok) return false;
    if (!HAS_FFMPEG) {
      writeFileSync(full, readFileSync(src));
      writeFileSync(thumb, readFileSync(src));
      return true;
    }
    const pre = crop ? `${crop},` : '';
    ffmpeg(src, full, `${pre}scale='min(1600,iw)':-2`);
    ffmpeg(src, thumb, `${pre}scale='min(${vertical ? 540 : 960},iw)':-2`);
    return true;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** proporción de un Short según su imagen original: vertical o cuadrado */
function shortRatio(id) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path.join(FULL_DIR, `${id}-0.${EXT}`)], { encoding: 'utf8' });
  const [w, h] = (r.stdout || '').trim().split(',').map(Number);
  if (!w || !h) return '9/16';
  return h / w > 1.25 ? '9/16' : '1/1';
}

function removeImages(id) {
  for (const dir of [FULL_DIR, THUMB_DIR]) for (const ext of ['webp', 'jpg']) rmSync(path.join(dir, `${id}-0.${ext}`), { force: true });
}

/* ── principal ───────────────────────────────────────────────────────────── */

async function main() {
  mkdirSync(FULL_DIR, { recursive: true });
  mkdirSync(THUMB_DIR, { recursive: true });
  const stored = existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : [];
  const byId = new Map(stored.map((w) => [w.youtubeId, w]));

  let xml;
  try {
    const r = await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    xml = await r.text();
  } catch (e) {
    log(`no se pudo leer el canal (${e.message}); queda lo último guardado`);
    return;
  }
  const feed = parseFeed(xml);
  log(`${feed.length} videos en el feed, ${stored.length} guardados`);

  const next = new Map();
  for (const v of feed) {
    const rules = readRules(v);
    if (rules.hidden) {
      removeImages(v.videoId);
      log(`oculto: ${v.title}`);
      continue;
    }
    const prev = byId.get(v.videoId);
    const short = prev ? prev.ratio !== '16/9' : await isShort(v.videoId);
    const duration = prev?.duration || (await durationOf(v.videoId));
    if (!(await saveImages(v.videoId, short))) {
      log(`sin imagen, se saltea: ${v.title}`);
      continue;
    }
    const ratio = !short ? '16/9' : prev?.ratio || shortRatio(v.videoId);
    next.set(v.videoId, {
      id: `yt-${v.videoId}`,
      youtubeId: v.videoId,
      url: short ? `https://www.youtube.com/shorts/${v.videoId}` : `https://www.youtube.com/watch?v=${v.videoId}`,
      published: v.published,
      client: rules.client,
      title: cleanTitle(v.title),
      kind: rules.kind,
      image: `/works/yt/${v.videoId}-0.${EXT}`,
      loop: '',
      ratio,
      format: '',
      duration,
      categoryId: rules.categoryId,
    });
  }

  // las guardadas que ya no están en el feed: se quedan salvo que el video ya no sea público
  for (const w of stored) {
    if (next.has(w.youtubeId)) continue;
    if (feed.some((v) => v.videoId === w.youtubeId)) continue; // estaba oculta o sin imagen
    const state = await stillPublic(w.youtubeId);
    if (state === 'gone') {
      removeImages(w.youtubeId);
      log(`ya no es público, se quita: ${w.title}`);
    } else {
      next.set(w.youtubeId, w);
    }
  }

  const list = [...next.values()].sort((a, b) => b.published.localeCompare(a.published));
  const out = `${JSON.stringify(list, null, 2)}\n`;
  if (existsSync(DATA) && readFileSync(DATA, 'utf8') === out) {
    log('sin cambios');
    return;
  }
  writeFileSync(DATA, out);
  log(`${list.length} piezas en src/data/youtube-works.json`);
}

main().catch((e) => {
  // un error inesperado no frena la publicación: el sitio sale con lo último guardado
  console.error('[youtube] error:', e);
  process.exitCode = 0;
});
