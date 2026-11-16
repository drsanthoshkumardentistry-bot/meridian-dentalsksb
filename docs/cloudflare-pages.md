# Hosting on Cloudflare Pages

The site is a Vite build (`dist`) plus server routes in `functions/api/*` (they run the same code as `api/*`).

## Create the project (once)
1. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git > `meridian-dentalsksb`.
2. Production branch `main`. Build command `npm run build`. Output folder `dist`.
3. Settings > Environment variables > add the values below for **Production** (and Preview if you test sign-in there).
4. Firebase console > Authentication > Settings > Authorized domains: add the `*.pages.dev` address and later the real domain.

## Environment variables (copy values from Vercel; never paste them in chat or commit them)
Build time: the public `VITE_FIREBASE_*` values live in `.env.production` in the repo (they ship inside the website to every visitor by design). Because `wrangler.toml` exists, the dashboard only accepts Secrets, and secrets are not available to the build, so do not put VITE_ values in the dashboard.

Server routes:
- `FIREBASE_SERVICE_ACCOUNT` (the service-account JSON, as secret text)
- `FIREBASE_API_KEY`
- `FOUNDER_EMAILS`
- `SITE_URL` (the public address, for example https://www.meridiandentalos.com)
- `RESEND_API_KEY`, `MAIL_FROM`, `LOGIN_ALERT_TO`
- `GEMINI_API_KEY`, `GEMINI_MODEL`, `ANTHROPIC_API_KEY`, `AI_SITE_DAILY` (only the AI ones you use)
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TEMPLATE_LANG`, `WHATSAPP_SITE_DAILY` (only if WhatsApp is on)

## Switch the domain
Pages project > Custom domains > add `meridiandentalos.com` and `www`. Cloudflare updates the two A records itself.
Keep the Vercel project for a week as the fallback, then remove the domain from it.

## Notes
- `wrangler.toml` turns on `nodejs_compat` (needed for Buffer, hashing and HMAC). RSA signing uses Web Crypto because Cloudflare has no `crypto.createSign`.
- Headers live in `public/_headers`; page refreshes on any path fall back to `index.html` automatically.
