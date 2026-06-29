# Apex Free

Apex Free is a dependency-free Formula 1 dashboard that uses free community APIs to show season calendars, standings, driver profiles, live/recent sessions, and historical race results.

## Open it locally

Because the app fetches data from remote APIs, run it from a small local web server instead of opening `index.html` directly.

```bash
npm start
```

Then open:

```text
http://localhost:4173
```

If you do not want to use npm, this is the same command:

```bash
python3 -m http.server 4173
```

## Push it to the web

This is a static app, so you can deploy it to any static host. Upload these files as-is:

- `index.html`
- `src/app.js`
- `src/styles.css`
- `package.json` is only needed if your host runs npm scripts.

Recommended free options:

1. **GitHub Pages**
   - Push this repository to GitHub.
   - In the repository settings, enable Pages for the current branch.
   - Use `/` as the publish folder.
2. **Netlify**
   - Create a new site from this repository.
   - Leave the build command blank, or use `npm run build` as a syntax check.
   - Set the publish directory to `.`.
3. **Vercel**
   - Import the repository.
   - Use no framework preset.
   - Set the output directory to `.`.

## Data sources

- Jolpica F1 API: calendars, standings, and race results.
- OpenF1 API: session metadata and driver profile details.

Both APIs are called directly from the browser, so availability depends on those public services and the user's network.

## Development checks

```bash
npm run build
```

The build script currently performs a JavaScript syntax check with Node.
