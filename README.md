# Photobooth — private, on-device version

This version does all the photo processing **inside your phone's browser**.
Your photos are never uploaded anywhere. There is no server that touches them.

## Why this is private

The earlier version sent your photos to a server to be processed. This one
doesn't. The filter is written in JavaScript that runs on your phone. When you
host this on GitHub Pages, GitHub only sends the *app's code* to your phone
once — your photos stay on the device the entire time. You can even turn on
Airplane Mode after the app loads and it still works.

## What's in here

```
index.html             the entire app (UI + filter, all in one file)
manifest.webmanifest   makes it installable
sw.js                  service worker — caches the app so it works offline
icon-192.png           app icons
icon-512.png
apple-touch-icon.png
```

## Getting it on your iPhone (GitHub Pages — free, ~10 min)

You need it served over HTTPS for the iPhone to install it. GitHub Pages does
this for free and, again, never sees your photos — it only serves the code.

### Step 1 — Put these files on GitHub

1. Go to <https://github.com>, sign in (or make a free account).
2. Click **+** (top right) → **New repository**. Name it `photobooth`,
   keep it **Public**, click **Create repository**.
3. Click **"uploading an existing file"** (in the "…or upload an existing
   file" line).
4. Drag in **all the files from this folder**: `index.html`,
   `manifest.webmanifest`, `sw.js`, and the three `.png` icons.
5. Click **Commit changes**.

### Step 2 — Turn on GitHub Pages

1. In the repo, click **Settings** (top tab).
2. In the left sidebar, click **Pages**.
3. Under **Branch**, choose **main** and **/ (root)**, click **Save**.
4. Wait ~1 minute, then refresh. Pages shows a link like
   `https://YOUR-USERNAME.github.io/photobooth/`.

### Step 3 — Install on your iPhone

1. Open that link in **Safari** on your iPhone.
2. Tap **Share** (square with up-arrow) → **Add to Home Screen** → **Add**.
3. You now have a Photobooth icon. It opens full-screen and works offline.

That's it. Add 4-6 photos → pick a layout → Generate → Save / Share to drop the
strip into your Photos.

## Using it on a computer (no hosting needed)

On a desktop you can just double-click `index.html` and it opens in your
browser and works. (iPhones can't easily open local files, which is why the
phone route uses GitHub Pages.)

## Notes

- **Offline:** after the first load, the service worker caches everything, so
  the app works with no connection at all.
- **Updating:** if the app changes, re-upload `index.html` to the repo and
  bump the cache name in `sw.js` (e.g. `photobooth-local-v1` → `v2`) so phones
  pick up the new version.
- **Camera + Save/Share** are native browser features and need no server.
- **HEIC photos:** iPhone photos are often HEIC. Safari handles them; if a
  photo ever fails to load on another browser, take it as JPEG or convert it.

## How the filter compares to the server version

It's a direct port of the Python pipeline, same constants and same stage order
(B&W duotone → tone curve → flash → blur → grain → scan lines → dust/scratches
→ vignette). Output is visually identical to the server version; only the
random grain pattern differs run to run.
