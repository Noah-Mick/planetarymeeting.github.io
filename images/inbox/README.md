# Inbox — the fallback way to publish

Normally artwork is published by dropping it in Dropbox. This folder is the
backup route, for when Dropbox is unavailable or something has gone wrong with
the sync.

Put an image in a sub-folder named for its gallery:

```
images/inbox/Illustration/01 - New Piece.png
images/inbox/Sketchbook/Another One.jpg
images/inbox/Fine Art/Something.png
```

The same naming rules apply as in Dropbox: `NN - Title.png` to control the
order, or just `Title.png` to land at the bottom. Committing the file to `main`
publishes it — the workflow builds and deploys the same way.

You can do this entirely from github.com: navigate here, **Add file → Upload
files**, and type the folder name into the filename box to create it.

## The catch

Pieces added this way are not in Dropbox, and Dropbox is the source of truth.
The next scheduled sync will therefore *remove* them — unless the same piece is
also added to Dropbox.

So treat this as a way to get something live quickly, then add it to Dropbox
properly. It isn't a second permanent workflow running alongside the first.

(The deletion failsafe means a small number of these can't vanish silently —
removing more than three pieces in one run stops the sync and reports it. But
don't rely on that; put it in Dropbox.)
