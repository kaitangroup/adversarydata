# adversarydata.com

Next.js 14 (App Router, TypeScript) app for **Jones & Associates**, with a
SQLite-backed admin dashboard, client portal, and public site. Designed to run
behind nginx on a Digital Ocean droplet on **port 4011** with TLS issued by
certbot.

```
adversarydata/
├── src/
│   ├── app/                # routes (App Router)
│   │   ├── page.tsx        # public homepage (server-rendered, dynamic)
│   │   ├── admin/          # admin SPA
│   │   ├── portal/         # client portal SPA
│   │   └── api/            # all API routes
│   ├── lib/                # db, session, auth, audit, crud, rate-limit
│   └── components/         # SiteHeader, ContactForm
├── db/migrations/001_init.sql
├── scripts/                # migrate.mjs, seed.mjs, create-admin.mjs
├── deploy/
│   ├── nginx/
│   │   ├── adversarydata.com.pre-ssl.conf  ← STAGE 1 (HTTP only, before certbot)
│   │   └── adversarydata.com.conf          ← STAGE 2 (HTTPS, after certbot)
│   ├── systemd/adversarydata.service       ← optional alt to PM2
│   └── DEPLOY.md                           ← full droplet walk-through
├── ecosystem.config.cjs    # PM2 process file (port 4011)
└── .env.example
```

## Quickstart (local dev)

```bash
npm install
cp .env.example .env
# edit .env — at minimum set SESSION_SECRET (>=32 chars), ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:init
npm run dev   # http://localhost:4011
```

Default credentials from `.env.example`:
- **Admin:** `rgj@rolandjones.com` / `Admin12345`

Routes:
- `/` — public site (data-driven from SQLite)
- `/admin` — admin dashboard (login required)
- `/portal` — client portal (login required)
- `/api/healthz` — health check
- `/api/public/*`, `/api/auth/*`, `/api/admin/*`, `/api/portal/*`

## Production build

```bash
npm run build
npm start             # listens on port 4011
```

## Deploy to a Digital Ocean droplet

The full guide — Node setup, PM2, nginx (pre-SSL → certbot → post-SSL), systemd
alternative, backups — lives in [`deploy/DEPLOY.md`](deploy/DEPLOY.md).

The TL;DR:

```bash
# on the droplet
git clone https://github.com/<you>/adversarydata.git /var/www/adversarydata
cd /var/www/adversarydata
cp .env.example .env && nano .env
npm ci --omit=dev=false
npm run db:init
npm run build
pm2 start ecosystem.config.cjs && pm2 save && pm2 startup

# nginx — pre-SSL first
sudo cp deploy/nginx/adversarydata.com.pre-ssl.conf /etc/nginx/sites-available/adversarydata.com
sudo ln -sf /etc/nginx/sites-available/adversarydata.com /etc/nginx/sites-enabled/adversarydata.com
sudo nginx -t && sudo systemctl reload nginx

# certbot
sudo certbot certonly --webroot -w /var/www/certbot \
  -d adversarydata.com -d www.adversarydata.com

# nginx — swap in HTTPS config
sudo cp deploy/nginx/adversarydata.com.conf /etc/nginx/sites-available/adversarydata.com
sudo nginx -t && sudo systemctl reload nginx
```

## Security & data

- Sessions: `iron-session` cookies, `httpOnly` + `secure` in production
- Passwords: bcrypt (cost 12)
- All HTML rendered through React (auto-escaped); no `dangerouslySetInnerHTML`
- All SQL through prepared statements (`better-sqlite3`)
- Rate limits on `/api/auth/login` (10 / 15 min) and `/api/public/contact` (5 / 10 min)
- Audit log captures every admin write
- SQLite file lives at `DATABASE_PATH` (recommend `/var/www/adversarydata/data/jones.sqlite`)

## License

MIT — see [LICENSE](LICENSE).
