/**
 * One-shot importer: pulls every image listed in js/artwork.js down from the
 * old WordPress site into images/<section>/<file>.
 *
 * Run from the project root:  node scripts/download-images.js
 *
 * Already-downloaded files are skipped, so it is safe to re-run after adding
 * rows to js/artwork.js. Pass --force to re-fetch everything.
 *
 * Once the WordPress hosting is cancelled this script stops working — that is
 * fine, it exists only to get the images out. The site itself never uses it.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const force = process.argv.includes('--force');

// js/artwork.js assigns to `window`, so hand it a stand-in and read it back.
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js', 'artwork.js'), 'utf8'), sandbox);
const artwork = sandbox.window.ARTWORK;

async function download(section, entry) {
  const dir = path.join(root, 'images', section);
  const dest = path.join(dir, entry.file);

  if (!force && fs.existsSync(dest)) {
    return { status: 'skipped', file: entry.file };
  }

  fs.mkdirSync(dir, { recursive: true });

  const res = await fetch(entry.src);
  if (!res.ok) {
    return { status: 'failed', file: entry.file, detail: `HTTP ${res.status}` };
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, bytes);
  return { status: 'downloaded', file: entry.file, bytes: bytes.length };
}

(async () => {
  const counts = { downloaded: 0, skipped: 0, failed: 0 };
  let totalBytes = 0;
  const failures = [];

  for (const [section, entries] of Object.entries(artwork)) {
    console.log(`\n${section} (${entries.length})`);
    for (const entry of entries) {
      let result;
      try {
        result = await download(section, entry);
      } catch (err) {
        result = { status: 'failed', file: entry.file, detail: err.message };
      }

      counts[result.status]++;
      if (result.bytes) totalBytes += result.bytes;
      if (result.status === 'failed') failures.push(`${section}/${result.file} — ${result.detail}`);

      const size = result.bytes ? ` (${(result.bytes / 1024).toFixed(0)} KB)` : '';
      console.log(`  ${result.status.padEnd(10)} ${result.file}${size}${result.detail ? ' — ' + result.detail : ''}`);
    }
  }

  console.log(
    `\n${counts.downloaded} downloaded, ${counts.skipped} skipped, ${counts.failed} failed` +
    ` — ${(totalBytes / 1024 / 1024).toFixed(1)} MB`
  );
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => console.log('  ' + f));
    process.exitCode = 1;
  }
})();
