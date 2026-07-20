/*
 * Static long-tail page generator for the "days until" site.
 * Run: node generate.js   ->   writes everything into ./public
 *
 * Page families produced:
 *   /days-until-<event>/            canonical, always counts to the next occurrence
 *   /days-until-<event>-<year>/     one page per upcoming year
 *   /<n>-days-from-today/           computed live in the browser
 *   /<n>-days-ago/                  computed live in the browser
 *   /date-calculator/               interactive difference + add/subtract tool
 *   /                               homepage with internal links to everything
 */
const fs = require("fs");
const path = require("path");

// ---- config -------------------------------------------------------------
const DOMAIN = process.env.DOMAIN || "https://YOURDOMAIN.com"; // real origin, no trailing slash
const BASE = process.env.BASE || ""; // subpath the site is served under, e.g. "/days-until" for GH project pages, "" for a root domain
const SITE = "Days Until";
const OUT = path.join(__dirname, "public");
const ASSETS = path.join(__dirname, "assets");

const FROM_TODAY_NS = [1,2,3,4,5,6,7,10,14,15,20,21,25,30,40,45,50,60,75,90,100,120,150,180,200,270,365,500,1000];
const AGO_NS = [1,7,10,14,21,30,45,60,90,100,120,180,200,365,500,1000];
const POPULAR = ["christmas","halloween","thanksgiving","new-years-day","valentines-day","independence-day","easter","mothers-day","fathers-day","st-patricks-day","first-day-of-summer","black-friday"];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ---- date math ----------------------------------------------------------
function nthWeekday(year, month1, weekday, n) {
  const first = new Date(year, month1 - 1, 1).getDay();
  const day = 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
  return new Date(year, month1 - 1, day);
}
function lastWeekday(year, month1, weekday) {
  const last = new Date(year, month1, 0);
  const day = last.getDate() - ((last.getDay() - weekday + 7) % 7);
  return new Date(year, month1 - 1, day);
}
function easter(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
function bySlug(slug) { return EVENTS.find(e => e.slug === slug); }
function computeDate(ev, year) {
  switch (ev.rule) {
    case "fixed": return new Date(year, ev.month - 1, ev.day);
    case "nth": return nthWeekday(year, ev.month, ev.weekday, ev.n);
    case "last": return lastWeekday(year, ev.month, ev.weekday);
    case "easter": return easter(year);
    case "easter-offset": { const d = easter(year); d.setDate(d.getDate() + ev.days); return d; }
    case "offset": { const d = computeDate(bySlug(ev.base), year); d.setDate(d.getDate() + ev.days); return d; }
    case "election": { const d = nthWeekday(year, 11, 1, 1); d.setDate(d.getDate() + 1); return d; } // Tue after 1st Mon
    case "table": { const s = ev.dates[year]; if (!s) return null; const p = s.split("-"); return new Date(year, +p[0] - 1, +p[1]); }
    default: throw new Error("unknown rule: " + ev.rule);
  }
}
function iso(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function fmtLong(d) { return WEEKDAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); }
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

// ---- html layout --------------------------------------------------------
function layout({ title, desc, urlPath, h1, hero, body, useTool }) {
  const canonical = DOMAIN + BASE + urlPath;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="${BASE}/styles.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5580575158570188" crossorigin="anonymous"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TJY4TRRKD6"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-TJY4TRRKD6');</script>
</head>
<body>
<header class="site-head"><div class="wrap">
  <a class="brand" href="${BASE}/">⏳ ${SITE}</a>
  <nav class="nav"><a href="${BASE}/date-calculator/">Date Calculator</a><a href="${BASE}/#all">All Countdowns</a></nav>
</div></header>
<main class="wrap">
  <div class="crumbs"><a href="${BASE}/">Home</a> ›&nbsp;${h1}</div>
  <h1>${h1}</h1>
  ${hero || ""}
  <div class="ad-slot">Advertisement</div>
  ${body}
  <div class="ad-slot">Advertisement</div>
</main>
<footer class="site-foot"><div class="wrap">
  <a href="${BASE}/">Home</a><a href="${BASE}/date-calculator/">Date Calculator</a><a href="${BASE}/#all">All Countdowns</a>
  <span>· ${SITE} — free countdown &amp; date tools. Part of <a href="https://elevatedprogress.com/">Elevated Progress</a>.</span>
</div></footer>
<script src="${BASE}/countdown.js" defer></script>
${useTool ? `<script src="${BASE}/tool.js" defer></script>` : ""}
</body>
</html>`;
}

function eventHero(datesCsv) {
  return `<div class="countdown" id="cd" data-dates="${datesCsv}">
  <div class="big-num"><span data-cd-days>—</span><span class="unit"><span data-cd-days-unit>days</span> to go</span></div>
  <div id="cd-clock" class="clock">
    <div class="seg"><b data-clk-h>0</b><span>hours</span></div>
    <div class="seg"><b data-clk-m>0</b><span>minutes</span></div>
    <div class="seg"><b data-clk-s>0</b><span>seconds</span></div>
  </div>
  <div class="sub">until <b data-cd-date>…</b></div>
</div>`;
}
function offsetHero(offset, verb) {
  return `<div class="countdown" id="cd" data-offset="${offset}">
  <div class="result-date" data-cd-date>…</div>
  <div class="sub">${verb} a <b data-cd-weekday>…</b></div>
</div>`;
}
function factsList() {
  return `<ul class="facts">
    <li><span class="k">Date</span><span class="v" data-cd-date>…</span></li>
    <li><span class="k">Day of the week</span><span class="v" data-cd-weekday>…</span></li>
    <li><span class="k">Days away</span><span class="v"><span data-cd-days>…</span> <span data-cd-days-unit>days</span></span></li>
    <li><span class="k">Weeks away</span><span class="v" data-cd-weeks>…</span></li>
    <li><span class="k">Months away</span><span class="v" data-cd-months>…</span></li>
  </ul>`;
}
function grid(links) {
  return `<div class="grid">` + links.map(l =>
    `<a href="${BASE}${l.href}">${l.emoji ? `<span class="chip-emoji">${l.emoji}</span>` : ""}${l.label}</a>`).join("") + `</div>`;
}

// ---- write helpers ------------------------------------------------------
function writePage(urlPath, html) {
  const dir = path.join(OUT, urlPath.replace(/^\/+|\/+$/g, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  urls.push(urlPath);
}

// ---- build --------------------------------------------------------------
const EVENTS = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "events.json"), "utf8"));
const urls = [];
const today = new Date(); today.setHours(0, 0, 0, 0);
const Y = today.getFullYear();

// clean output but preserve deploy metadata (.git for the pages repo, CNAME for a custom domain)
fs.mkdirSync(OUT, { recursive: true });
for (const entry of fs.readdirSync(OUT)) {
  if (entry === ".git" || entry === "CNAME") continue;
  fs.rmSync(path.join(OUT, entry), { recursive: true, force: true });
}
for (const f of fs.readdirSync(ASSETS)) fs.copyFileSync(path.join(ASSETS, f), path.join(OUT, f));

// -- event pages --
for (const ev of EVENTS) {
  // upcoming occurrences (this year through +5), keep those still in the future
  const occ = [];
  for (let y = Y; y <= Y + 5; y++) {
    const d = computeDate(ev, y);
    if (!d) continue;
    if (daysBetween(today, d) >= 0) occ.push({ y, d });
  }
  if (!occ.length) continue;
  const approxNote = ev.approx ? ` (date is approximate and can shift by a day between years)` : "";

  // canonical page -> counts to next occurrence
  const next = occ[0];
  const datesCsv = occ.map(o => iso(o.d)).join(",");
  {
    const h1 = `How many days until ${ev.name}?`;
    const title = `${h1} | Countdown to ${ev.name} ${next.y}`;
    const desc = `Live countdown to ${ev.name} ${next.y}. ${ev.name} is on ${fmtLong(next.d)} — see exactly how many days, weeks and months are left.`;
    const body = `<div class="prose">
      <p>The next <strong>${ev.name}</strong> is on <strong>${fmtLong(next.d)}</strong>${approxNote}. The countdown above updates every second.</p>
    </div>
    ${factsList()}
    <h2>Countdown to ${ev.name} by year</h2>
    ${grid(occ.map(o => ({ href: `/days-until-${ev.slug}-${o.y}/`, emoji: ev.emoji, label: `${ev.name} ${o.y}` })))}
    <h2>Other popular countdowns</h2>
    ${grid(POPULAR.filter(s => s !== ev.slug).slice(0, 8).map(s => { const e = bySlug(s); return { href: `/days-until-${s}/`, emoji: e.emoji, label: e.name }; }))}`;
    writePage(`/days-until-${ev.slug}/`, layout({ title, desc, urlPath: `/days-until-${ev.slug}/`, h1, hero: eventHero(datesCsv), body }));
  }

  // per-year pages -> count to that specific year only
  for (const o of occ) {
    const h1 = `How many days until ${ev.name} ${o.y}?`;
    const title = `${h1} | ${ev.name} ${o.y} Countdown`;
    const desc = `Countdown to ${ev.name} ${o.y}. ${ev.name} ${o.y} falls on ${fmtLong(o.d)} — days, weeks and months remaining, updated live.`;
    const others = occ.filter(x => x.y !== o.y).map(x => ({ href: `/days-until-${ev.slug}-${x.y}/`, emoji: ev.emoji, label: `${ev.name} ${x.y}` }));
    const body = `<div class="prose">
      <p><strong>${ev.name} ${o.y}</strong> is on <strong>${fmtLong(o.d)}</strong>${approxNote}.</p>
    </div>
    ${factsList()}
    <h2>More</h2>
    ${grid([{ href: `/days-until-${ev.slug}/`, emoji: ev.emoji, label: `Next ${ev.name}` }].concat(others))}`;
    writePage(`/days-until-${ev.slug}-${o.y}/`, layout({ title, desc, urlPath: `/days-until-${ev.slug}-${o.y}/`, h1, hero: eventHero(iso(o.d)), body }));
  }
}

// -- N days from today --
function neighbors(list, n, makeHref, label) {
  const idx = list.indexOf(n);
  const near = [];
  for (let k = Math.max(0, idx - 2); k <= Math.min(list.length - 1, idx + 2); k++)
    if (list[k] !== n) near.push({ href: makeHref(list[k]), label: label(list[k]) });
  return near;
}
for (const n of FROM_TODAY_NS) {
  const h1 = `What date is ${n} days from today?`;
  const title = `${h1} | ${n} Days From Now`;
  const desc = `Find out what date is ${n} days from today. ${n} days from now, including the exact day of the week, calculated live.`;
  const body = `<div class="prose">
    <p>${n} ${n === 1 ? "day" : "days"} from today lands on the date shown above. It updates automatically, so it is always correct for today's date.</p>
  </div>
  <h2>Nearby</h2>
  ${grid(neighbors(FROM_TODAY_NS, n, x => `/${x}-days-from-today/`, x => `${x} days from today`))}
  <h2>Try the other direction</h2>
  ${grid([{ href: `/${n}-days-ago/`, label: `${n} days ago` }, { href: `/date-calculator/`, label: "Full date calculator" }])}`;
  writePage(`/${n}-days-from-today/`, layout({ title, desc, urlPath: `/${n}-days-from-today/`, h1, hero: offsetHero(n, "falls on"), body }));
}
for (const n of AGO_NS) {
  const h1 = `What date was ${n} days ago?`;
  const title = `${h1} | ${n} Days Before Today`;
  const desc = `Find out what date was ${n} days ago from today, including the day of the week, calculated live.`;
  const body = `<div class="prose">
    <p>${n} ${n === 1 ? "day" : "days"} ago from today was the date shown above, calculated live from today's date.</p>
  </div>
  <h2>Nearby</h2>
  ${grid(neighbors(AGO_NS, n, x => `/${x}-days-ago/`, x => `${x} days ago`))}
  <h2>Try the other direction</h2>
  ${grid([{ href: `/${n}-days-from-today/`, label: `${n} days from today` }, { href: `/date-calculator/`, label: "Full date calculator" }])}`;
  writePage(`/${n}-days-ago/`, layout({ title, desc, urlPath: `/${n}-days-ago/`, h1, hero: offsetHero(-n, "was"), body }));
}

// -- generic "days until <Month Day>" for every calendar date --
const MONTH_LOWER = MONTHS.map(m => m.toLowerCase());
function monthDayOccurrences(m, d) {
  const occ = [];
  for (let y = Y; y <= Y + 5 && occ.length < 5; y++) {
    const dt = new Date(y, m - 1, d);
    if (dt.getMonth() !== m - 1 || dt.getDate() !== d) continue; // e.g. Feb 29 in a common year
    if (daysBetween(today, dt) >= 0) occ.push(dt);
  }
  return occ;
}
for (let m = 1; m <= 12; m++) {
  const maxDay = m === 2 ? 29 : new Date(2027, m, 0).getDate();
  for (let d = 1; d <= maxDay; d++) {
    const occ = monthDayOccurrences(m, d);
    if (!occ.length) continue;
    const label = `${MONTHS[m - 1]} ${d}`;
    const slug = `days-until-${MONTH_LOWER[m - 1]}-${d}`;
    const next = occ[0];
    const h1 = `How many days until ${label}?`;
    const title = `${h1} | Countdown to ${label}`;
    const desc = `How many days until ${label}? The next ${label} is ${fmtLong(next)} — see the exact day of the week plus weeks and months left, updated live.`;
    const prev = new Date(next.getFullYear(), m - 1, d); prev.setDate(prev.getDate() - 1);
    const nxt = new Date(next.getFullYear(), m - 1, d); nxt.setDate(nxt.getDate() + 1);
    const near = [prev, nxt].map(x => ({ href: `/days-until-${MONTH_LOWER[x.getMonth()]}-${x.getDate()}/`, label: `${MONTHS[x.getMonth()]} ${x.getDate()}` }));
    const body = `<div class="prose">
      <p>The next <strong>${label}</strong> is <strong>${fmtLong(next)}</strong>. The countdown above updates live, so it is always correct for today.</p>
    </div>
    ${factsList()}
    <h2>Nearby dates</h2>
    ${grid(near)}
    <h2>Tools</h2>
    ${grid([{ href: "/date-calculator/", emoji: "🧮", label: "Date Calculator" }, { href: "/", emoji: "⏳", label: "All countdowns" }])}`;
    writePage(`/${slug}/`, layout({ title, desc, urlPath: `/${slug}/`, h1, hero: eventHero(occ.map(iso).join(",")), body }));
  }
}

// -- date calculator tool --
{
  const h1 = "Date Calculator";
  const title = "Date Calculator | Days Between Dates & Add/Subtract Days";
  const desc = "Free date calculator: count the days between two dates, or add and subtract days from any date to find a new date.";
  const body = `<div class="tool">
    <h2 style="margin-top:0">Days between two dates</h2>
    <div class="row">
      <div><label for="diff-from">From</label><input type="date" id="diff-from"></div>
      <div><label for="diff-to">To</label><input type="date" id="diff-to"></div>
    </div>
    <div class="tool-out" id="diff-out"></div>
  </div>
  <div class="tool">
    <h2 style="margin-top:0">Add or subtract days</h2>
    <div class="row">
      <div><label for="add-base">Start date</label><input type="date" id="add-base"></div>
      <div><label for="add-amt">Days</label><input type="number" id="add-amt" min="0"></div>
      <div><label for="add-dir">Direction</label><select id="add-dir"><option value="after">after</option><option value="before">before</option></select></div>
    </div>
    <div class="tool-out" id="add-out"></div>
  </div>
  <h2>Popular countdowns</h2>
  ${grid(POPULAR.map(s => { const e = bySlug(s); return { href: `/days-until-${s}/`, emoji: e.emoji, label: e.name }; }))}`;
  writePage(`/date-calculator/`, layout({ title, desc, urlPath: `/date-calculator/`, h1, hero: "", body, useTool: true }));
}

// -- homepage --
{
  const title = `${SITE} — Free Countdown Timers & Date Calculators`;
  const desc = "Live countdowns to every holiday plus handy date tools: how many days until any event, what date is N days from today, and a full date calculator.";
  const popularGrid = grid(POPULAR.map(s => { const e = bySlug(s); return { href: `/days-until-${s}/`, emoji: e.emoji, label: e.name }; }));
  const allGrid = grid(EVENTS.slice().sort((a, b) => a.name.localeCompare(b.name)).map(e => ({ href: `/days-until-${e.slug}/`, emoji: e.emoji, label: e.name })));
  const fromGrid = grid(FROM_TODAY_NS.slice(0, 16).map(n => ({ href: `/${n}-days-from-today/`, label: `${n} days from today` })));
  const body = `<p class="lead">Live countdown timers to every major holiday, plus quick date math — always accurate for today.</p>
  <h2>Popular countdowns</h2>
  ${popularGrid}
  <h2>Date tools</h2>
  ${grid([{ href: "/date-calculator/", emoji: "🧮", label: "Date Calculator" }])}
  ${fromGrid}
  <h2 id="all">All countdowns</h2>
  ${allGrid}`;
  writePage(`/`, layout({ title, desc, urlPath: `/`, h1: `Countdowns &amp; Date Tools`, hero: "", body }));
}

// -- sitemap + robots --
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${DOMAIN}${BASE}${u}</loc></url>`).join("\n")}
</urlset>`;
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}${BASE}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, ".nojekyll"), ""); // tell GitHub Pages to skip Jekyll and serve files as-is
fs.writeFileSync(path.join(OUT, "CNAME"), "countdown.elevatedprogress.com\n"); // GitHub Pages custom domain
fs.writeFileSync(path.join(OUT, "ads.txt"), "google.com, pub-5580575158570188, DIRECT, f08c47fec0942fa0\n"); // AdSense authorized-sellers file
// Google Search Console ownership verification (HTML-file method). Must stay present to remain verified.
fs.writeFileSync(path.join(OUT, "google78307d8185e2853c.html"), "google-site-verification: google78307d8185e2853c.html");

console.log(`Generated ${urls.length} pages into ./public`);
