/**
 * One-time migration: build data/gallery-state.json from the site as it stands.
 *
 *   node scripts/seed-state.js
 *
 * Reads the titles and display order out of the existing js/artwork.js and
 * pairs them with the original files in images/<group>/. That matters because
 * those originals are named "A-Day-Spent-Outside.png" — deriving titles from
 * the filenames would turn "A Day Spent Outside" into "A-Day-Spent-Outside"
 * and throw away the curated ordering.
 *
 * After this runs, the pipeline has a source of truth and `npm run build`
 * works. Once Dropbox is populated, sync-dropbox.js takes over and these
 * local entries are replaced.
 *
 * Safe to re-run: it rebuilds the file from scratch each time. It refuses to
 * overwrite entries that already came from Dropbox.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const lib = require('./lib');
const { ROOT, GROUPS } = lib;

/** Read the current generated manifest, if there is one. */
function readExistingManifest() {
  const file = path.join(ROOT, 'js', 'artwork.js');
  if (!fs.existsSync(file)) return {};

  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox);
  return sandbox.window.ARTWORK || {};
}

const existing = readExistingManifest();
const previous = lib.readState();

if (previous && Object.values(previous.files).some(f => f.source === 'dropbox')) {
  console.error(
    'data/gallery-state.json already contains Dropbox entries.\n' +
    'Seeding would discard them. Delete the file first if that is really what you want.'
  );
  process.exit(1);
}

const files = {};
let matched = 0;
let derived = 0;
const orphans = [];

for (const group of GROUPS) {
  const dir = path.join(ROOT, 'images', group.id);
  if (!fs.existsSync(dir)) continue;

  // Existing display order becomes the ordering prefix: first piece is 1.
  const known = new Map();
  (existing[group.id] || []).forEach((entry, index) => {
    // Old manifest format carried `file`; the new one carries `slug`.
    const key = entry.file || entry.slug;
    if (key) known.set(key, { title: entry.title, order: index + 1 });
  });

  const onDisk = fs.readdirSync(dir).filter(name => {
    const full = path.join(dir, name);
    return fs.statSync(full).isFile() && lib.isSupported(name);
  });

  for (const name of onDisk) {
    const full = path.join(dir, name);
    const parsed = lib.parseName(name);

    // Match on filename first, then on the slug the old entry would produce.
    const hit = known.get(name) || known.get(path.basename(name, parsed.ext));

    if (hit) matched++;
    else derived++;

    files['local:' + group.id + '/' + name] = {
      source: 'local',
      group: group.id,
      path: path.relative(ROOT, full).split(path.sep).join('/'),
      ext: parsed.ext,
      title: hit ? hit.title : parsed.title,
      order: hit ? hit.order : parsed.order,
      modified: new Date(fs.statSync(full).mtimeMs).toISOString(),
    };
  }

  // Anything the manifest lists but that isn't on disk.
  for (const key of known.keys()) {
    if (!onDisk.includes(key) && !onDisk.some(n => path.basename(n, path.extname(n)) === key)) {
      orphans.push(`${group.id}/${key}`);
    }
  }

  console.log(`${group.id}: ${onDisk.length} originals`);
}

lib.writeState({
  version: 1,
  generatedAt: new Date().toISOString(),
  files,
});

console.log(
  `\nwrote data/gallery-state.json — ${Object.keys(files).length} pieces ` +
  `(${matched} titled from the existing manifest, ${derived} from filenames)`
);

if (orphans.length) {
  console.log('\nListed in js/artwork.js but not found on disk:');
  orphans.forEach(o => console.log('  ' + o));
}

if (derived > 0) {
  console.log(
    '\nNote: pieces without a manifest match took their title from the filename.\n' +
    'Check data/gallery-state.json and fix any that read wrong before building.'
  );
}
