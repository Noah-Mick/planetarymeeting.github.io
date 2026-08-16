/**
 * Shared helpers for the publishing pipeline.
 *
 * Both scripts/build-gallery.js and scripts/sync-dropbox.js depend on these,
 * so the naming and ordering rules live in exactly one place. If you change how
 * filenames are read, change it here.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/**
 * The three galleries, and the Dropbox folder each one maps to.
 *
 * Adding a gallery means adding a row here AND creating the page plus a nav
 * entry in the seven HTML files. That's deliberate: a new folder appearing in
 * Dropbox should not be able to invent a page that nothing links to.
 */
const GROUPS = [
  { id: 'illustration', dropbox: 'Illustration', label: 'Illustration' },
  { id: 'sketchbook', dropbox: 'Sketchbook', label: 'Sketchbook' },
  { id: 'fine-art', dropbox: 'Fine Art', label: 'Fine Art' },
];

const GROUP_IDS = GROUPS.map(g => g.id);
const EXTENSIONS = ['.png', '.jpg', '.jpeg'];

/**
 * The published set: one entry per piece, keyed by a stable id.
 *
 * Entries are either `source: "dropbox"` (id is the Dropbox file id, original
 * cached under .cache/originals/) or `source: "local"` (original sits in the
 * repo). Local entries exist so the site could be migrated onto this pipeline
 * before Dropbox was wired up; sync-dropbox.js replaces them as Dropbox
 * becomes the source of truth.
 */
const STATE_FILE = path.join(ROOT, 'data', 'gallery-state.json');
const CACHE_DIR = path.join(ROOT, '.cache', 'originals');

/** Derivative sizes. Thumbnails feed the grid, web copies feed the lightbox. */
const THUMB_WIDTH = 900;
const THUMB_QUALITY = 80;
const WEB_WIDTH = 2000;
const WEB_QUALITY = 82;

/**
 * Filenames may carry an ordering prefix: "01 - Snow Dogs.png".
 *
 * The separator is space-hyphen-space and the number is capped at three digits
 * on purpose. A looser rule would read "1984 Poster.png" as piece #1984 titled
 * "Poster", and a four-digit year at the start of a title is a real thing.
 */
const ORDER_PREFIX = /^(\d{1,3}) - (.+)$/;

/** Sketchbook pages straight off a phone are shown without a caption. */
const CAMERA_FILENAME = /^Photo\s+[A-Z][a-z]{2}\s+\d/;

/**
 * Split a filename into its ordering number and its display title.
 *   "01 - Snow Dogs.png" -> { order: 1,    title: "Snow Dogs" }
 *   "Snow Dogs.png"      -> { order: null, title: "Snow Dogs" }
 */
function parseName(filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  const match = base.match(ORDER_PREFIX);

  return match
    ? { order: parseInt(match[1], 10), title: match[2].trim(), ext }
    : { order: null, title: base.trim(), ext };
}

/** True for titles that are really just camera filenames. */
function isUntitled(title) {
  return CAMERA_FILENAME.test(title);
}

/**
 * Turn a title into a filename-safe slug, matching the names already in the
 * repo: "For What It's Worth" -> "For-What-Its-Worth".
 *
 * Case is preserved because these become visible URLs.
 */
function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip accents: ROSÈ -> ROSE
    .replace(/['’]/g, '')              // drop apostrophes rather than dashing them
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'untitled';
}

/**
 * Assign slugs across a group, breaking ties so two pieces with the same title
 * can't overwrite each other's derivative files.
 */
function assignSlugs(entries) {
  const seen = new Map();

  return entries.map(entry => {
    const base = slugify(entry.title);
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);

    return Object.assign({}, entry, {
      slug: count === 0 ? base : `${base}-${count + 1}`,
    });
  });
}

/**
 * Ordering, as specified:
 *   1. numbered files first, ascending
 *   2. then unnumbered files, oldest first
 *   3. duplicate numbers tie-break oldest first
 *   4. gaps collapse — 01, 02, 07 renders as three consecutive pieces
 *
 * `modified` is a millisecond timestamp: when the file reached Dropbox, or the
 * file's mtime in local mode.
 */
function sortEntries(entries) {
  const numbered = entries.filter(e => e.order !== null);
  const unnumbered = entries.filter(e => e.order === null);

  numbered.sort((a, b) => a.order - b.order || a.modified - b.modified);
  unnumbered.sort((a, b) => a.modified - b.modified);

  return numbered.concat(unnumbered);
}

function isSupported(filename) {
  return EXTENSIONS.includes(path.extname(filename).toLowerCase());
}

function readState() {
  if (!fs.existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (err) {
    throw new Error(`data/gallery-state.json is not valid JSON: ${err.message}`);
  }
}

/** Where a state entry's original lives, whichever source it came from. */
function sourcePath(id, entry) {
  return entry.source === 'dropbox'
    ? path.join(CACHE_DIR, entry.group, id.replace(/^dropbox:/, '') + entry.ext)
    : path.join(ROOT, entry.path);
}

function writeState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

module.exports = {
  ROOT,
  GROUPS,
  GROUP_IDS,
  EXTENSIONS,
  STATE_FILE,
  CACHE_DIR,
  THUMB_WIDTH,
  THUMB_QUALITY,
  WEB_WIDTH,
  WEB_QUALITY,
  parseName,
  isUntitled,
  slugify,
  assignSlugs,
  sortEntries,
  isSupported,
  readState,
  writeState,
  sourcePath,
};
