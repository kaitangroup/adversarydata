# Deploying adversarydata.com to a Digital Ocean Droplet

This app runs a Next.js 14 server on **port 4011**, fronted by **nginx** on
ports 80/443, with TLS issued by **certbot / Let's Encrypt**.

The flow is intentionally split into two nginx configs so certbot never sees a
broken `ssl_certificate` reference on first run:

1. **`adversarydata.com.pre-ssl.conf`** — plain HTTP only. Use this first.
2. Run certbot.
3. **`adversarydata.com.conf`** — full HTTPS config, swapped in afterwards.

---

## 0. Prerequisites

- Ubuntu 22.04+ droplet with sudo access
- DNS: `adversarydata.com` and `www.adversarydata.com` A-records pointing to the droplet's public IP
- A non-root user (e.g. `deploy`) — recommended

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install build-essential git ufw nginx
```

### Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Node.js 20 + PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs
sudo npm i -g pm2
```

---

## 1. Pull the code

```bash
sudo mkdir -p /var/www/adversarydata /var/www/adversarydata/data \
              /var/log/adversarydata /var/www/certbot
sudo chown -R "$USER":"$USER" /var/www/adversarydata /var/log/adversarydata
git clone https://github.com/<you>/adversarydata.git /var/www/adversarydata
cd /var/www/adversarydata
```

## 2. Configure environment

```bash
cp .env.example .env
nano .env
```

Set at minimum:
- `SESSION_SECRET` — `openssl rand -hex 32`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
- `DATABASE_PATH=/var/www/adversarydata/data/jones.sqlite`
- `NEXT_PUBLIC_SITE_URL=https://adversarydata.com`

## 3. Install, migrate, build

```bash
npm ci --omit=dev=false   # need devDeps for the build
npm run db:init           # migrations + seed (first time only)
npm run build
```

## 4. Start the app on port 4011 with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd        # follow the printed command to enable on boot
```

Sanity check:
```bash
curl -s http://127.0.0.1:4011/api/healthz
# → {"status":"ok",...}
```

---

## 5. Stage 1 — pre-SSL nginx (HTTP only)

> ⚠️ Use this config FIRST. It contains **no `ssl_certificate` directives**, so
> nginx will start cleanly even though no certs exist yet. This is exactly what
> certbot needs to complete the http-01 challenge.

```bash
sudo cp deploy/nginx/adversarydata.com.pre-ssl.conf \
        /etc/nginx/sites-available/adversarydata.com
sudo ln -sf /etc/nginx/sites-available/adversarydata.com \
            /etc/nginx/sites-enabled/adversarydata.com

# Disable the default site if it's still linked
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t && sudo systemctl reload nginx
```

Open `http://adversarydata.com` in a browser — you should see the site over plain HTTP.

---

## 6. Issue TLS certs with certbot

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo mkdir -p /var/www/certbot

sudo certbot certonly \
  --webroot -w /var/www/certbot \
  -d adversarydata.com -d www.adversarydata.com \
  --non-interactive --agree-tos -m you@yourdomain.com
```

You should see `Successfully received certificate`. Files are at
`/etc/letsencrypt/live/adversarydata.com/{fullchain,privkey}.pem`.

Confirm the nginx options/dhparam files exist (certbot creates them):
```bash
ls /etc/letsencrypt/options-ssl-nginx.conf /etc/letsencrypt/ssl-dhparams.pem
```

---

## 7. Stage 2 — post-SSL nginx (HTTPS)

Now swap in the full config:

```bash
sudo cp deploy/nginx/adversarydata.com.conf \
        /etc/nginx/sites-available/adversarydata.com
sudo nginx -t && sudo systemctl reload nginx
```

Visit `https://adversarydata.com` — you should be on HTTPS, with `www.` and plain
HTTP both 301-ing to the canonical URL.

### Auto-renewal sanity check
```bash
sudo systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

---

## 8. Updating the app

```bash
cd /var/www/adversarydata
git pull
npm ci --omit=dev=false
npm run db:migrate         # idempotent
npm run build
pm2 reload adversarydata
```

## 9. Useful one-liners

```bash
pm2 logs adversarydata          # live logs
pm2 restart adversarydata       # hard restart
pm2 status                      # process status

sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/adversarydata/err.log

# Backup the SQLite DB
sqlite3 /var/www/adversarydata/data/jones.sqlite ".backup '/root/jones-backup-$(date +%F).sqlite'"
```

---

## 10. Common pitfalls

- **`nginx: [emerg] cannot load certificate`** — you put the post-SSL config in
  before certs existed. Roll back to the pre-SSL config, run certbot, then swap.
- **502 Bad Gateway** — the app isn't running on 4011. Check `pm2 status` and
  `curl http://127.0.0.1:4011/api/healthz`.
- **Sessions reset on every request** — `SESSION_SECRET` must be at least 32
  characters and stable across restarts.
- **`better-sqlite3` failed to load** — you ran `npm ci --omit=dev` (no
  build toolchain). Use `npm ci --omit=dev=false` or install `build-essential`.
- **Database wiped after redeploy** — keep `DATABASE_PATH` outside the repo
  (e.g. `/var/www/adversarydata/data/jones.sqlite`) and back it up.
