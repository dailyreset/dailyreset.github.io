# Daily Reset

A lightweight Indonesian-language habit tracker built with static HTML, CSS, and JavaScript. No build step or backend is required.

## Features

- Daily habit checklist and current streaks
- To-do list with due dates, priorities, and filters
- Monthly goals with progress controls
- Seven-day habit chart and weekly reflection
- Export data to a JSON backup
- Responsive layout for mobile and desktop
- Optional installable PWA experience and basic offline cache

## Run locally

Open `index.html` in a browser. Service-worker/offline and installable-app features require a local HTTP server or HTTPS.

## GitHub Pages

In the repository, open **Settings → Pages** and set the publishing source to **Deploy from a branch**, branch **main**, folder **/(root)**. The site is served from the static files at the repository root.

## Data and privacy

App data is stored in the browser's `localStorage` on the current device and browser. It is not automatically synced between devices or browsers. Use **Statistik → Ekspor backup data (.json)** to save a backup before clearing browser data or switching devices.

## Main files

- `index.html` — page structure
- `styles.css` — responsive design
- `app.js` — app state and interactions
- `manifest.webmanifest` — installable-app metadata
- `sw.js` — offline asset cache
- `icon.svg` — app icon
