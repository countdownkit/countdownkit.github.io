# Deploy

Deployment is automated via GitHub Actions — see `.github/workflows/deploy.yml`.

**To deploy:** commit and push to `main`. That's it. The workflow runs `node generate.js`
and publishes `public/` to GitHub Pages at https://countdownkit.github.io/.

```
git add -A
git commit -m "..."
git push
```

## One-time setup (already done)

- Repo: `countdownkit/countdownkit.github.io` (org Pages repo → serves at the root domain).
- Settings → Pages → **Build source: GitHub Actions**.
- Production config lives in the workflow env: `DOMAIN=https://countdownkit.github.io`, `BASE=""`.

## Custom domain (optional, later)

1. Buy a domain, create a `CNAME` file in the repo root containing the domain.
   (`generate.js` preserves a `public/CNAME` across local builds; for CI, add it as a repo file
   and copy it into `public/` in the build step, or set it in Pages settings.)
2. Point the domain's DNS at GitHub Pages.
3. `DOMAIN` stays the custom domain; `BASE` stays `""`.

## After AdSense approval

Create ad units in the AdSense dashboard, paste the `<ins class="adsbygoogle">` markup into the
`.ad-slot` placeholders in `generate.js`'s `layout()`, then push.
