# Publishing pipeline

**Status: built. Everything below is implemented and tested except the Dropbox
connection itself, which needs credentials — see §6.**

Until those secrets exist, the site runs from `data/gallery-state.json` seeded
from the pre-existing artwork, which is why it currently looks unchanged apart
from being considerably faster.

Goal: Livia adds a piece to a Dropbox folder and the website updates itself.
Her only inputs are the image file, its name, and which group it belongs to —
and the folder structure supplies the last two, so in practice the only action
is dropping a correctly-named file into the right folder.

---

## 1. How it fits together

```
Dropbox/Apps/Planetary Meeting/Illustration/01 - A Day Spent Outside.png
        │
        │  every 15 minutes, GitHub Actions:
        ▼
  sync-dropbox.js      list the folder, download what changed,
                       update data/gallery-state.json
        ▼
  build-gallery.js     make WebP derivatives, rewrite js/artwork.js,
                       delete derivatives whose piece is gone
        ▼
  git commit + push to main
        ▼
  GitHub Pages redeploys — live in ~1 minute
```

`data/gallery-state.json` is the single source of truth for what's published.
Both scripts read and write it; nothing else decides what appears on the site.
An earlier draft had the build fall back to scanning directories when no state
existed — that was removed, because the on-disk filenames are hyphenated
import artefacts and deriving titles from them turned *A Day Spent Outside*
into *A-Day-Spent-Outside*.

Total latency: up to ~16 minutes from drop to live.

Three things make this work, and each is worth stating plainly because each is
a change from how the site works today:

- **Dropbox becomes the source of truth.** The website is a rendering of that
  folder. Add, rename, reorder or delete there — never in the repo.
- **`js/artwork.js` becomes a generated file.** Hand-edits to it will be
  overwritten on the next run. This is the biggest behavioural change.
- **Full-resolution originals are no longer committed.** Git stores the WebP
  derivatives the site actually serves. Dropbox holds the masters.

---

## 2. Dropbox layout

```
Planetary Meeting/
├── Illustration/
│   ├── 01 - A Day Spent Outside.png
│   ├── 02 - Snow Dogs.png
│   └── Wrapped in The Wave.jpg
├── Sketchbook/
│   ├── 01 - Head Split.png
│   └── Photo Nov 28 2023, 6 55 59 PM.jpg
└── Fine Art/
    └── 01 - Desires of Earth.png
```

Folder name maps to a gallery section:

| Dropbox folder | Site section | Page |
|---|---|---|
| `Illustration` | `illustration` | `index.html` |
| `Sketchbook` | `sketchbook` | `sketchbook.html` |
| `Fine Art` | `fine-art` | `fine-art.html` |

Unrecognised folders are ignored and reported in the run log, so a stray folder
can't quietly break a build. Adding a new gallery is a code change, not
something the artist can do by making a folder — that's deliberate, since a new
gallery also needs a new page and a nav entry.

Accepted file types: `.png`, `.jpg`, `.jpeg`. Anything else is skipped and
logged (this is what stops `.DS_Store`, Dropbox conflict copies and stray PDFs
from becoming artwork).

### Naming

```
NN - Title.png     ordered
Title.png          unordered
```

The title is the filename with the number prefix and extension removed. So
`03 - Snow Dogs.png` displays as **Snow Dogs**.

The separator is **space-hyphen-space**. This is deliberately distinctive: a
looser rule like `01 Title` would misread `1984 Poster.png` as piece #1984
titled "Poster". If you'd rather have the simpler `01 Title.png` form and
accept that edge case, say so and I'll change it.

### Ordering rules

Within each group:

1. Numbered files first, ascending — 1, 2, 3…
2. Then unnumbered files, oldest to newest by when they were added to Dropbox.
3. Duplicate numbers tie-break oldest-first.
4. Gaps collapse. `01, 02, 07` renders as three consecutive pieces — no blanks.

So a forgotten prefix means the piece lands at the bottom, which is the
graceful failure you asked for rather than an error.

"Oldest to newest" uses Dropbox's `server_modified` — the moment the file
landed in Dropbox. Chosen over the file's own timestamp because phone cameras
and scanners report unreliable dates, and upload order is what the artist
actually experiences.

### Untitled sketchbook pages

Filenames matching `Photo Nov 28 2023, 6 55 59 PM` continue to be treated as
untitled — no caption is shown. That behaviour is preserved deliberately so a
file dropped straight from a phone works with no renaming. Renaming it later to
a real title makes the caption appear.

---

## 3. Mirroring and the deletion failsafe

Dropbox is mirrored, not merely appended to:

| In Dropbox | Result |
|---|---|
| New file | Piece added |
| File renamed | Title and/or order updated — the image is **not** re-downloaded |
| File moved between folders | Piece changes group |
| File replaced | Derivatives rebuilt |
| File deleted | Piece removed from the site |

Renames are free because tracking is by Dropbox's stable file `id`, not by
filename. Renaming a 6MB file to fix a typo costs no bandwidth and no rebuild.

### The failsafe

A single run will refuse to delete if it would remove **more than 3 pieces, or
more than 25% of any one group** — whichever is hit first.

The proportional rule only applies to groups holding **more than 8 pieces**.
Testing showed that without that floor, removing two of the six Fine Art pieces
tripped the guard — turning an ordinary cull into a blocked run, and training
whoever hits it to reach for the override reflexively. A failsafe that fires on
routine work stops being a failsafe.

Two further cases are treated as deletions even though they don't look like it:

- **A run that would publish nothing at all** aborts unconditionally. An empty
  or misconfigured app folder is always a configuration fault, never an edit.
- **Pre-Dropbox entries with no matching Dropbox file** count towards the
  limit. Without this, the very first sync would silently discard every piece
  that hadn't been uploaded yet, and the guard would never notice because it
  was only watching Dropbox-sourced entries.

On trip, the run stops before touching anything, exits with a failure (which
emails you), and prints exactly what it would have removed. Nothing is
committed. To proceed deliberately, re-run the workflow manually with the
`confirm_deletions` input set to `yes`.

This is the guard against the realistic disaster: Dropbox desyncs, a folder
gets dragged by accident, or an offline device resurrects an old state and the
site empties itself. Note that git history means nothing is ever truly lost —
but a site that silently empties is still a bad afternoon.

---

## 4. Image handling

Each piece produces two committed derivatives and no committed original:

| Output | Size | Purpose |
|---|---|---|
| `images/<group>/thumb/<name>.webp` | 900px wide, q80 | gallery grid |
| `images/<group>/web/<name>.webp` | 2000px wide, q82 | lightbox |

Measured over the current 57 pieces: **94 MB of originals → 26 MB of committed
derivatives.** Roughly 4x less git growth, and the lightbox drops from up to
7.8 MB per image to about 330 KB.

That lightbox change is a fix, not a side effect. Today the lightbox serves the
raw original; on a phone that is genuinely painful.

Downloaded originals land in `.cache/originals/` (gitignored) so repeat runs
don't re-fetch unchanged files. The cache is disposable — deleting it costs one
slow rebuild, nothing more.

### Path indirection

All image URLs will be produced by one helper in `js/gallery.js` rather than
being built inline. If the repo ever outgrows git, moving to Cloudflare R2 or
similar becomes a one-line change to that helper instead of a refactor.

### Existing pieces

The 57 current pieces get `web/` derivatives generated once from the originals
already on disk, so old and new behave identically. Their originals stay in git
history where they are — already paid for, and removing them would mean
rewriting history.

---

## 5. What gets built

| File | Purpose |
|---|---|
| `.github/workflows/publish.yml` | the scheduled job |
| `scripts/lib.js` | naming, ordering and slug rules, in one place |
| `scripts/sync-dropbox.js` | list Dropbox, download changes, maintain state |
| `scripts/build-gallery.js` | derivatives, manifest, orphan cleanup, inbox |
| `scripts/seed-state.js` | one-time migration from the pre-pipeline site |
| `scripts/dropbox-auth.js` | one-time OAuth helper |
| `data/gallery-state.json` | committed; the published set |
| `images/inbox/` | fallback drop folder |

Changed: `js/artwork.js` is now generated and carries `{title, slug, w, h}`;
`js/gallery.js` builds every URL through one `imageUrl()` helper and points the
lightbox at `web/`. Removed: `js/image-sizes.js` (merged into the manifest),
`scripts/optimize-images.js` (superseded by `build-gallery.js`), and
`scripts/download-images.js` (the WordPress importer, which has done its job —
it depended on the `src` field that generated manifests no longer carry).

`data/gallery-state.json` is committed because it's the memory between runs:
it's what makes renames free and deletions detectable.

### Workflow triggers

- **Schedule** — every 15 minutes.
- **Manual** — `workflow_dispatch`, with `confirm_deletions` and
  `force_rebuild` inputs.
- **Push** — when `images/inbox/**` changes, for the fallback route.

The job's own commit does not retrigger it: GitHub deliberately does not fire
workflows for pushes made with `GITHUB_TOKEN`, so there is no loop. Downloaded
originals are cached between runs, and a run that finds no changes commits
nothing and costs almost nothing.

---

## 6. Credentials

Run the helper and follow it:

```bash
npm run auth
```

It walks through creating the Dropbox app and prints three values to paste into
**Settings → Secrets and variables → Actions**:

```
DROPBOX_APP_KEY
DROPBOX_APP_SECRET
DROPBOX_REFRESH_TOKEN
```

**This is the only genuinely technical part of the system.** It's done once, by
you rather than the artist, and takes about ten minutes.

### Why this is safe on a public repo

GitHub Actions secrets are **not repository contents**. They live in GitHub's
encrypted secret store, attached to the repo's settings, and are injected as
environment variables only while a workflow runs. Nothing is committed, and
nobody browsing the repo can read them.

Four things keep the exposure minimal:

- **App folder access, not Full Dropbox.** The app is created with App folder
  scope, so the token physically cannot see anything outside
  `/Apps/Planetary Meeting/`. This is chosen at app creation and is permanent.
- **Read-only scopes.** `files.metadata.read` and `files.content.read` only.
  The pipeline cannot rename, move or delete anything in her Dropbox.
- **The derived token is masked.** GitHub redacts registered secrets from logs
  automatically, but a value *derived* from one is not covered — so
  `sync-dropbox.js` emits `::add-mask::` for the short-lived access token it
  mints. Without that, a stack trace could print a live token into a public log.
- **No fork-triggered runs.** There is no `pull_request` trigger. GitHub
  already withholds secrets from fork PRs; not offering the trigger keeps it
  that way.

Taken together, the worst realistic outcome of a leak is that someone gains
read access to artwork that is already published on a public website.

**To revoke:** Dropbox → Settings → Connected apps → remove the app, then
re-run `npm run auth` and update the three secrets.

---

## 7. Fallback: uploading through GitHub

Drop a file into `images/inbox/<Group>/` — from github.com if need be — and
committing it to `main` publishes it. Same naming rules, same output.

It's a dedicated folder rather than `images/<group>/` because that directory
still holds the 57 pre-Dropbox originals; scanning there would re-adopt all of
them on every run. The inbox has no such history, so anything in it is
unambiguously new. See `images/inbox/README.md`.

The caveat stands: since Dropbox is mirrored, a piece added this way and *not*
present in Dropbox is removed on the next scheduled sync. The failsafe means a
handful can't vanish silently, but this is a way to get something live quickly
and then do it properly — not a second permanent workflow.

---

## 8. When it breaks

| Failure | What happens | Recovery |
|---|---|---|
| Dropbox token revoked | Run fails, GitHub emails you | Re-run OAuth, update secret |
| Unsupported file dropped | Skipped, logged | None needed |
| Corrupt image | That piece fails, run continues | Re-upload |
| Deletion failsafe trips | Nothing committed, run fails loudly | Verify, then manual re-run |
| Two edits within one window | Both picked up next run | None needed |

**One scheduling gotcha:** GitHub disables scheduled workflows in public repos
after 60 days without repository activity. Publishing counts as activity, so an
active site self-sustains — but a quiet stretch over the summer could silently
switch off the schedule. GitHub emails when this happens, and re-enabling is a
single button. Worth knowing about in advance rather than discovering it.

Failures notify by email; nothing is committed by a failed run, so a broken run
never produces a broken site.

---

## 9. Rollout

- [x] Build the derivative pipeline and verify against the current artwork.
- [x] Point `gallery.js` at `web/`, generate derivatives for all 57 pieces,
      confirm the site is unchanged apart from being faster.
- [ ] **Run `npm run auth`** and add the three secrets.
- [ ] **Populate the Dropbox app folder** so it matches the site exactly.
      `data/gallery-state.json` lists every current title, and the failsafe
      will refuse the first sync if any are missing — so a partial upload
      fails loudly rather than quietly dropping work.
- [ ] **Dry run:** `node scripts/sync-dropbox.js --dry-run`. Reports what would
      change and writes nothing.
- [ ] Let the schedule run, and confirm a new piece appears end to end.
- [ ] Hand over `docs/adding-artwork.md` and watch the artist add one piece
      unaided — that's the real acceptance test.

The first two steps were independently valuable: even if the Dropbox half is
never enabled, the lightbox is roughly 20x lighter than it was.

---

## 10. Decisions taken, and what's still open

Built with these defaults, all trivially changeable:

| Decision | Value | Where |
|---|---|---|
| Filename separator | `01 - Title.png` | `ORDER_PREFIX` in `scripts/lib.js` |
| Order prefix width | 1–3 digits | same |
| Failsafe | 3 pieces, or 25% of groups >8 | top of `scripts/sync-dropbox.js` |
| Frequency | every 15 min | `cron` in the workflow |
| Thumbnail | 900px, q80 | `scripts/lib.js` |
| Lightbox image | 2000px, q82 | same |
| `src` provenance field | dropped | — |

Still open:

1. **`images/_unpublished/`** — the 51 unpublished sketchbook originals remain
   backed up nowhere but the local disk. Folding them into Dropbox would fix
   that, and any worth showing could then be published by renaming.
2. **Ordering the existing work.** Seeding assigned prefixes 1..N from the
   current display order, so uploading to Dropbox with those names preserves
   it exactly. Worth deciding whether the artist would rather re-curate.
3. **Legacy originals in `images/<group>/`.** Left in place as instructed. They
   are ignored by the build and can be moved out whenever, without touching
   git history.
