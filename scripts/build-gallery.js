/**
 * Builds everything the galleries need: WebP derivatives, and js/artwork.js.
 *
 *   npm run build           build what's missing or stale
 *   npm run build -- --force    rebuild every derivative
 *
 * The published set comes from data/gallery-state.json — always, and only.
 * That file is maintained by sync-dropbox.js (from Dropbox) or seed-state.js
 * (one-time, from the repo). This script never guesses at what to publish by
 * reading directory listings: filenames on disk are hyphenated import
 * artefacts, and deriving titles from them turns "A Day Spent Outside" into
 * "A-Day-Spent-Outside".
 *
 * js/artwork.js is GENERATED. Editing it by hand is pointless; the next run
 * overwrites it. Add or rename artwork at the source.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const lib = require('./lib');
const {
  ROOT, GROUPS, CACHE_DIR,
  THUMB_WIDTH, THUMB_QUALITY, WEB_WIDTH, WEB_QUALITY,
} = lib;

const force = process.argv.includes('--force');

/* ------------------------------------------------------------------ sources */

/** Group the state file's entries, ready for ordering and slugging. */
function collectFromState(state) {
  const byGroup = {};
  const unknownGroups = new Set();
  GROUPS.forEach(g => (byGroup[g.id] = []));

  for (const [id, entry] of Object.entries(state.files)) {
    if (!byGroup[entry.group]) {
      unknownGroups.add(entry.group);
      continue;
    }

    byGroup[entry.group].push({
      id,
      title: entry.title,
      order: entry.order,
      modified: Date.parse(entry.modified),
      source: lib.sourcePath(id, entry),
    });
  }

  if (unknownGroups.size) {
    console.log(`Ignoring entries in unknown groups: ${[...unknownGroups].join(', ')}`);
  }

  return byGroup;
}

/* ------------------------------------------------------------- derivatives */

function isStale(source, dest) {
  if (force || !fs.existsSync(dest)) return true;
  return fs.statSync(source).mtimeMs > fs.statSync(dest).mtimeMs;
}

/**
 * Delete any file in `dir` whose name differs from `filename` only by case,
 * returning true if one was found.
 *
 * This exists because Windows is case-insensitive and GitHub Pages is not.
 * Writing "Aquarius.webp" on Windows when "aquarius.webp" already exists
 * silently reuses the old lowercase name — so the repo ends up holding
 * `aquarius.webp` while the manifest asks for `Aquarius.webp`. That renders
 * perfectly on the developer's machine and 404s on the live site.
 *
 * Removing the variant first forces the file to be created under the exact
 * name the manifest will reference.
 */
function clearCaseVariants(dir, filename) {
  if (!fs.existsSync(dir)) return false;

  let found = false;
  for (const name of fs.readdirSync(dir)) {
    if (name !== filename && name.toLowerCase() === filename.toLowerCase()) {
      fs.unlinkSync(path.join(dir, name));
      found = true;
    }
  }
  return found;
}

async function buildDerivatives(groupId, entry) {
  const thumbDir = path.join(ROOT, 'images', groupId, 'thumb');
  const webDir = path.join(ROOT, 'images', groupId, 'web');
  fs.mkdirSync(thumbDir, { recursive: true });
  fs.mkdirSync(webDir, { recursive: true });

  const filename = entry.slug + '.webp';
  const thumb = path.join(thumbDir, filename);
  const web = path.join(webDir, filename);

  // Must run before the staleness check: on Windows a case variant makes
  // existsSync report true for a file that is really named something else.
  const webRecased = clearCaseVariants(webDir, filename);
  const thumbRecased = clearCaseVariants(thumbDir, filename);

  let built = 0;

  if (webRecased || isStale(entry.source, web)) {
    await sharp(entry.source)
      .rotate()                      // honour EXIF orientation on phone photos
      .resize({ width: WEB_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEB_QUALITY })
      .toFile(web);
    built++;
  }

  // The grid needs the thumbnail's dimensions to reserve each tile's space, so
  // this branch always ends with `info` populated one way or the other.
  let info;
  if (thumbRecased || isStale(entry.source, thumb)) {
    info = await sharp(entry.source)
      .rotate()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toFile(thumb);
    built++;
  } else {
    info = await sharp(thumb).metadata();
  }

  return { width: info.width, height: info.height, built };
}

/**
 * Remove derivatives whose piece is gone.
 *
 * Deliberately scoped to thumb/ and web/ only. Originals sitting in
 * images/<group>/ are never touched by this script.
 */
function pruneOrphans(groupId, slugs) {
  const keep = new Set(slugs.map(s => s + '.webp'));
  let removed = 0;

  for (const sub of ['thumb', 'web']) {
    const dir = path.join(ROOT, 'images', groupId, sub);
    if (!fs.existsSync(dir)) continue;

    for (const name of fs.readdirSync(dir)) {
      if (keep.has(name)) continue;

      try {
        fs.unlinkSync(path.join(dir, name));
        removed++;
      } catch (err) {
        // A leftover derivative is cosmetic; a build that dies partway through
        // is not. Report and carry on.
        console.log(`  WARN     could not remove ${sub}/${name} — ${err.code || err.message}`);
      }
    }
  }

  return removed;
}

/* ------------------------------------------------------------------- inbox */

/**
 * Adopt anything sitting in images/inbox/<Group>/ into the state file.
 *
 * This is the fallback route for when Dropbox is unavailable: drop a file into
 * the inbox — on github.com if need be — and it publishes like anything else.
 *
 * It's a separate folder rather than images/<group>/ because that directory
 * still holds the pre-Dropbox originals. Scanning there would re-adopt all 57
 * of them every run. The inbox has no such history, so anything in it is
 * unambiguously new.
 *
 * Adopted pieces are local entries, so once Dropbox is the source of truth a
 * later sync will remove them (subject to the deletion failsafe) unless they
 * are also added to Dropbox. That is the documented trade-off of the fallback.
 */
function adoptInbox(state) {
  const inbox = path.join(ROOT, 'images', 'inbox');
  if (!fs.existsSync(inbox)) return [];

  const known = new Set(
    Object.values(state.files).filter(f => f.source === 'local').map(f => f.path)
  );

  const adopted = [];

  for (const group of GROUPS) {
    const dir = path.join(inbox, group.dropbox);
    if (!fs.existsSync(dir)) continue;

    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (!fs.statSync(full).isFile() || !lib.isSupported(name)) continue;

      const rel = path.relative(ROOT, full).split(path.sep).join('/');
      if (known.has(rel)) continue;

      const parsed = lib.parseName(name);
      state.files['local:inbox/' + group.id + '/' + name] = {
        source: 'local',
        group: group.id,
        path: rel,
        ext: parsed.ext,
        title: parsed.title,
        order: parsed.order,
        modified: new Date(fs.statSync(full).mtimeMs).toISOString(),
      };
      adopted.push(`${group.id}/${name}`);
    }
  }

  if (adopted.length) {
    lib.writeState(state);
    console.log(`\nAdopted from images/inbox (${adopted.length}):`);
    adopted.forEach(a => console.log('  + ' + a));
  }

  return adopted;
}

/* ---------------------------------------------------------------- manifest */

function writeManifest(gallery) {
  const lines = [
    '/**',
    ' * GENERATED FILE — do not edit by hand.',
    ' * Written by scripts/build-gallery.js (npm run build).',
    ' *',
    ' * Every piece on the site, in display order. Each entry carries:',
    ' *   title  caption text, and the img alt text',
    ' *   slug   basename of its files under images/<group>/thumb|web/',
    ' *   w, h   thumbnail dimensions, so tiles reserve their space before the',
    ' *          lazy-loaded image arrives and the columns never reflow',
    ' *',
    ' * To change what appears here, change the source (Dropbox, or the files',
    ' * in images/<group>/) and re-run the build. Editing this file does nothing.',
    ' */',
    'window.ARTWORK = {',
  ];

  GROUPS.forEach((group, index) => {
    const entries = gallery[group.id] || [];
    lines.push(`  ${JSON.stringify(group.id)}: [`);
    entries.forEach((e, i) => {
      const row =
        `    { title: ${JSON.stringify(e.title)}, ` +
        `slug: ${JSON.stringify(e.slug)}, w: ${e.width}, h: ${e.height} }`;
      lines.push(row + (i === entries.length - 1 ? '' : ','));
    });
    lines.push('  ]' + (index === GROUPS.length - 1 ? '' : ','));
  });

  lines.push('};', '');
  fs.writeFileSync(path.join(ROOT, 'js', 'artwork.js'), lines.join('\n'));
}

/** The About portrait: a 3MB phone photo shown in a ~320px column. */
async function buildPortrait() {
  const source = path.join(ROOT, 'images', 'site', 'portrait.png');
  const dest = path.join(ROOT, 'images', 'site', 'portrait.webp');

  if (!fs.existsSync(source) || !isStale(source, dest)) return false;

  await sharp(source)
    .rotate()
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(dest);
  return true;
}

/* -------------------------------------------------------------------- main */

(async () => {
  const state = lib.readState();

  if (!state || !state.files || !Object.keys(state.files).length) {
    console.error(
      'No data/gallery-state.json to build from.\n\n' +
      'If Dropbox is set up:      node scripts/sync-dropbox.js\n' +
      'For a one-time migration:  node scripts/seed-state.js'
    );
    process.exit(1);
  }

  if (process.argv.includes('--adopt')) adoptInbox(state);

  const counts = Object.values(state.files).reduce((acc, f) => {
    acc[f.source] = (acc[f.source] || 0) + 1;
    return acc;
  }, {});
  console.log(
    'Source: data/gallery-state.json — ' +
    Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')
  );

  const collected = collectFromState(state);
  const gallery = {};
  const missing = [];
  let builtCount = 0;
  let prunedCount = 0;

  for (const group of GROUPS) {
    const entries = lib.assignSlugs(lib.sortEntries(collected[group.id] || []));
    gallery[group.id] = [];

    console.log(`\n${group.id} (${entries.length})`);

    for (const entry of entries) {
      if (!fs.existsSync(entry.source)) {
        missing.push(`${group.id}/${entry.title}`);
        console.log(`  MISSING  ${entry.title} — no file at ${path.relative(ROOT, entry.source)}`);
        continue;
      }

      let result;
      try {
        result = await buildDerivatives(group.id, entry);
      } catch (err) {
        missing.push(`${group.id}/${entry.title} (${err.message})`);
        console.log(`  FAILED   ${entry.title} — ${err.message}`);
        continue;
      }

      builtCount += result.built;
      gallery[group.id].push({
        title: entry.title,
        slug: entry.slug,
        width: result.width,
        height: result.height,
      });

      const mark = result.built ? 'built   ' : 'cached  ';
      const pos = entry.order === null ? '  ·' : String(entry.order).padStart(3);
      console.log(`  ${mark} ${pos}  ${entry.title}`);
    }

    prunedCount += pruneOrphans(group.id, gallery[group.id].map(e => e.slug));
  }

  writeManifest(gallery);
  if (await buildPortrait()) console.log('\nsite\n  built    portrait.webp');

  const total = GROUPS.reduce((n, g) => n + gallery[g.id].length, 0);
  console.log(`\n${total} pieces · ${builtCount} derivatives built · ${prunedCount} orphans removed`);
  console.log('wrote js/artwork.js');

  if (missing.length) {
    console.log('\nCould not publish:');
    missing.forEach(m => console.log('  ' + m));
    process.exitCode = 1;
  }
})();
