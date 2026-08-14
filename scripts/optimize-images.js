/**
 * Generates the WebP thumbnails the galleries actually load, plus
 * js/image-sizes.js so tiles can reserve their space before the image arrives.
 *
 *   npm run images          build anything missing
 *   npm run images -- --force   rebuild everything
 *
 * Originals in images/<section>/ are never touched — they stay as the
 * full-resolution copies the lightbox opens, and as the repo's backup.
 * Output goes to images/<section>/thumb/<name>.webp.
 *
 * Re-run this after adding artwork to js/artwork.js.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const force = process.argv.includes('--force');

// Galleries top out at 3 columns in a 1265px page, so a tile is ~400px wide.
// 900px covers that at 2x for retina without shipping the full original.
const MAX_WIDTH = 900;
const QUALITY = 80;

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js', 'artwork.js'), 'utf8'), sandbox);
const artwork = sandbox.window.ARTWORK;

async function buildThumb(section, entry) {
  const source = path.join(root, 'images', section, entry.file);
  const thumbDir = path.join(root, 'images', section, 'thumb');
  const dest = path.join(thumbDir, entry.file.replace(/\.[^.]+$/, '') + '.webp');

  if (!fs.existsSync(source)) {
    return { status: 'missing', file: entry.file };
  }

  fs.mkdirSync(thumbDir, { recursive: true });

  if (!force && fs.existsSync(dest)) {
    const meta = await sharp(dest).metadata();
    return { status: 'cached', file: entry.file, width: meta.width, height: meta.height };
  }

  const info = await sharp(source)
    .rotate()                                            // honour EXIF orientation on phone photos
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(dest);

  const savedFrom = fs.statSync(source).size;
  return {
    status: 'built',
    file: entry.file,
    width: info.width,
    height: info.height,
    bytes: info.size,
    from: savedFrom,
  };
}

(async () => {
  const sizes = {};
  const counts = { built: 0, cached: 0, missing: 0 };
  let thumbBytes = 0;
  let originalBytes = 0;
  const missing = [];

  // The About portrait is displayed in a ~320px column but the original is a
  // 3MB phone photo, so it gets its own web-sized copy. The logo stays PNG —
  // it needs its transparency and is already small.
  const portrait = path.join(root, 'images', 'site', 'portrait.png');
  const portraitWeb = path.join(root, 'images', 'site', 'portrait.webp');
  if (fs.existsSync(portrait) && (force || !fs.existsSync(portraitWeb))) {
    const info = await sharp(portrait)
      .rotate()
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(portraitWeb);
    console.log(`\nsite\n  built    portrait.webp -> ${(info.size / 1024).toFixed(0)} KB`);
  }

  for (const [section, entries] of Object.entries(artwork)) {
    if (section === 'site') continue;   // handled above

    console.log(`\n${section} (${entries.length})`);

    for (const entry of entries) {
      const result = await buildThumb(section, entry);
      counts[result.status]++;

      if (result.status === 'missing') {
        missing.push(`${section}/${entry.file}`);
        console.log(`  missing  ${entry.file}`);
        continue;
      }

      sizes[`${section}/${entry.file}`] = [result.width, result.height];

      if (result.status === 'built') {
        thumbBytes += result.bytes;
        originalBytes += result.from;
        const pct = (100 - (result.bytes / result.from) * 100).toFixed(0);
        console.log(`  built    ${entry.file} -> ${(result.bytes / 1024).toFixed(0)} KB (-${pct}%)`);
      } else {
        console.log(`  cached   ${entry.file}`);
      }
    }
  }

  const banner =
    '/**\n' +
    ' * GENERATED FILE — do not edit by hand.\n' +
    ' * Written by scripts/optimize-images.js (npm run images).\n' +
    ' *\n' +
    ' * Maps "<section>/<original filename>" to the [width, height] of its\n' +
    ' * generated thumbnail. The gallery uses this to reserve each tile\'s space\n' +
    ' * before the lazy-loaded image arrives, which keeps the masonry columns\n' +
    ' * from reflowing mid-scroll. Its presence also tells the gallery that\n' +
    ' * WebP thumbnails exist and can be served instead of the originals.\n' +
    ' */\n';

  const body =
    'window.IMAGE_SIZES = {\n' +
    Object.entries(sizes)
      .map(([key, [w, h]]) => `  ${JSON.stringify(key)}: [${w}, ${h}]`)
      .join(',\n') +
    '\n};\n';

  fs.writeFileSync(path.join(root, 'js', 'image-sizes.js'), banner + body);

  console.log(`\n${counts.built} built, ${counts.cached} cached, ${counts.missing} missing`);
  if (counts.built) {
    console.log(
      `thumbnails: ${(thumbBytes / 1024 / 1024).toFixed(1)} MB ` +
      `from ${(originalBytes / 1024 / 1024).toFixed(1)} MB of originals`
    );
  }
  console.log(`wrote js/image-sizes.js (${Object.keys(sizes).length} entries)`);

  if (missing.length) {
    console.log('\nListed in js/artwork.js but not on disk:');
    missing.forEach(f => console.log('  ' + f));
    process.exitCode = 1;
  }
})();
