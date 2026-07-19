# Days Until — countdownkit

A static site of countdown timers and date tools, generated programmatically to cover a
large long-tail of date-related search queries. Live at **https://countdown.elevatedprogress.com/** (GitHub Pages origin: countdownkit.github.io).

There is no framework, no database, and no runtime dependencies — a single Node script reads
a data file and writes ~690 static HTML pages. Countdowns compute live in the browser, so
pages never go stale.

## What it generates

| Page family | Example URL | Count |
|---|---|---|
| Holiday countdown (next occurrence) | `/days-until-christmas/` | ~35 |
| Holiday countdown (specific year) | `/days-until-christmas-2027/` | ~140 |
| Every calendar date | `/days-until-march-15/` | ~365 |
| N days from today | `/90-days-from-today/` | ~30 |
| N days ago | `/100-days-ago/` | ~16 |
| Date calculator (difference / add-subtract) | `/date-calculator/` | 1 |
| Homepage | `/` | 1 |

Plus `sitemap.xml`, `robots.txt`, `ads.txt`, and a `.nojekyll` marker.

## Project layout

```
.
├── data/
│   └── events.json         # ← the data source. Add holidays here to add pages.
├── assets/
│   ├── styles.css          # copied into the build as-is
│   ├── countdown.js        # live countdown logic (event + N-days pages)
│   └── tool.js             # the interactive date calculator
├── generate.js             # the generator: reads data + assets, writes ./public
├── server.js               # tiny static server for local preview (:5055)
├── package.json            # `npm run build`, `npm run preview`
└── .github/workflows/
    └── deploy.yml          # CI: build + deploy to GitHub Pages on every push
```

`public/` is **build output** — it is git-ignored and regenerated on every build. Never edit it by hand.

## Local development

No install step (zero dependencies).

```
npm run build     # node generate.js  -> writes ./public
npm run preview   # node server.js     -> http://localhost:5055
```

On Windows, set config via PowerShell env vars before building (see below) — Git Bash mangles
a leading-slash `BASE` value.

## Configuration

Two env vars control output; both have safe defaults.

| Var | Default | Purpose |
|---|---|---|
| `DOMAIN` | `https://YOURDOMAIN.com` | Origin used in `<link rel=canonical>` and `sitemap.xml`. |
| `BASE` | `""` | Sub-path the site is served under. Empty for a root domain (current). Set to e.g. `/days-until` only if serving from a GitHub *project* page. |

Production values are set in `.github/workflows/deploy.yml` (`DOMAIN=https://countdownkit.github.io`, `BASE=""`).

## Adding pages

Edit `data/events.json`. Each event supports one of these `rule` types:

- `fixed` — `{ "month": 12, "day": 25 }`
- `nth` — nth weekday of a month: `{ "month": 11, "weekday": 4, "n": 4 }` (weekday 0=Sun)
- `last` — last weekday of a month: `{ "month": 5, "weekday": 1 }`
- `easter` — Western Easter (computus)
- `easter-offset` — `{ "days": -2 }` relative to Easter
- `offset` — `{ "base": "thanksgiving", "days": 1 }` relative to another event
- `election` — US Election Day (Tue after 1st Mon of Nov)
- `table` — explicit dates per year: `{ "dates": { "2027": "02-06", "2028": "01-26" } }` (for lunar/irregular holidays)

Rebuild and the canonical page, per-year pages, and internal links are produced automatically.
The every-calendar-date and N-days families are generated independently of the data file.

> Lunar/observance holidays (Hanukkah, Ramadan, Eid, Diwali, etc.) are intentionally omitted —
> add them only with a verified `table` of dates, never a computed guess.

## Deployment

Fully automated. Push to `main` → GitHub Actions runs `node generate.js` and publishes `public/`
to GitHub Pages. No manual build-and-commit of output. See `.github/workflows/deploy.yml`.

Pages must be set to **Build source: GitHub Actions** (Settings → Pages).

## SEO

`sitemap.xml` (all pages) is submitted in Google Search Console for
`https://countdownkit.github.io/`. Ownership is verified via the HTML file
`google78307d8185e2853c.html`, which `generate.js` writes on every build — do not remove it.

## Monetization

Google AdSense, publisher `ca-pub-5580575158570188`.

- The AdSense loader script is injected into every page's `<head>` by `generate.js`.
- `ads.txt` is generated with the authorized-seller line.
- In-content ad placements are the `.ad-slot` divs in the layout. They are styled placeholders
  until real `<ins class="adsbygoogle">` units (created in the AdSense dashboard after approval)
  are pasted in.

## License

MIT — see [LICENSE](LICENSE).
