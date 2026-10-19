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

## Supabase cloud sync setup

1. Create a Supabase project.
2. Open **SQL Editor** and run the full `supabase/schema.sql` file from this repository.
3. Open **Project Settings → API** (or the project's Connect/API section) and copy the **Project URL** and **publishable key**. A publishable key is safe for browser use when Row Level Security is enabled; never use a secret or `service_role` key in the website.
4. Put those two values in `supabase-config.js` and commit the file.
5. In **Authentication → URL Configuration**, add `https://estelernyonya88-sudo.github.io` to the allowed site URLs / redirect URLs.
6. In **Authentication → Providers → Email**, choose whether email confirmation is required. If enabled, users need to confirm their email before logging in.
7. Open the live site, create an account, and choose **Sinkronkan sekarang** to upload existing local data on the first sync.

The SQL enables Row Level Security and limits each authenticated user to their own row. Realtime is enabled for changes so logged-in devices can receive updates. Until the URL and publishable key are configured, the app continues in local-only mode.
