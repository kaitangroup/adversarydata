#!/bin/bash
# =============================================================
#  adversarydata — Deploy / Update Script
# =============================================================

set -e

echo "=============================="
echo "  Deploying adversarydata..."
echo "=============================="

APP_DIR="/var/www/adversarydata"
cd "$APP_DIR"

# --- 1. Pull latest code ---
echo "[1/4] Pulling latest code..."
if [ -d ".git" ]; then
  git pull origin main
else
  echo "  (No git repo — skipping pull)"
fi

# --- 2. Install dependencies ---
echo "[2/4] Installing dependencies..."
npm ci

# --- 3. Build ---
echo "[3/4] Building production app..."
npm run build

# --- 4. Restart app with PM2 ---
echo "[4/4] Restarting app..."

if pm2 list | grep -q "adversarydata"; then
  pm2 reload ecosystem.config.cjs --env production
else
  pm2 start ecosystem.config.cjs --env production
fi

pm2 save

echo ""
echo "=============================="
echo "  Deploy complete!"
echo "  App running at: http://localhost:4002"
echo "  Public URL: https://adversarydata.com"
echo "=============================="