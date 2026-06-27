#!/bin/bash
# ==============================================================================
# Light-speed, Safe Update & Redeploy Script for drugtest.report
# Safely preserves user databases, custom uploads, and re-draws updated code.
# Run on VPS inside SSH as root: sudo bash update_drugtest_report.sh
# ==============================================================================

# Exit immediately if any command exits with a non-zero status
set -e

APP_DIR="/var/www/drugtest.report"
BACKUP_DIR="/tmp/drugtest_vault_update_backup"

echo "======================================================================"
echo "🔄 STAGE 1: Backing up your reviews database and custom uploaded covers..."
echo "======================================================================"

rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

if [ -f "$APP_DIR/database/db.json" ]; then
    echo "💾 Database found. Backing up db.json..."
    cp "$APP_DIR/database/db.json" "$BACKUP_DIR/db.json"
else
    echo "⚠️  WARNING: No existing database found to back up."
fi

if [ -d "$APP_DIR/public/uploads" ] && [ "$(ls -A "$APP_DIR/public/uploads" 2>/dev/null)" ]; then
    echo "💾 Uploads found. Backing up product thumbnail cover images..."
    cp -r "$APP_DIR/public/uploads" "$BACKUP_DIR/uploads"
else
    echo "💬 Info: No custom uploads found to back up."
fi

echo "======================================================================"
echo "🗑️  STAGE 2: Wiping previous source code structures safely..."
echo "======================================================================"

if [ -d "$APP_DIR" ]; then
    # Delete everything inside APP_DIR except .git to make pull extremely fast and clean!
    echo "🧹 Purging matching source code directories..."
    find "$APP_DIR" -maxdepth 1 -not -name '.git' -not -name 'your-domain.com' -not -name 'drugtest.report' -not -name '..' -not -name '.' -exec rm -rf {} +
else
    echo "❌ Error: App folder not found at $APP_DIR. Did you run deploy_drugtest_report.sh first?"
    exit 1
fi

echo "======================================================================"
echo "🍿 STAGE 3: Fetching and force-aligning updated codebase from GitHub..."
echo "======================================================================"

cd "$APP_DIR"

# Ensure origin remote is set correctly to pandamoo repo
git remote set-url origin https://github.com/pandamoo/drugtest-report.git || git remote add origin https://github.com/pandamoo/drugtest-report.git

echo "🍿 Overwriting the workspace directory to align with GitHub main branch..."
git fetch origin main
git reset --hard origin/main

# Re-create static files directories
mkdir -p "$APP_DIR/public/uploads"
mkdir -p "$APP_DIR/database"

echo "======================================================================"
echo "💾 STAGE 4: Restoring your database writeups and product cover images..."
echo "======================================================================"

if [ -f "$BACKUP_DIR/db.json" ]; then
    echo "💾 Restoring database (db.json)..."
    cp "$BACKUP_DIR/db.json" "$APP_DIR/database/db.json"
fi

if [ -d "$BACKUP_DIR/uploads" ] && [ "$(ls -A "$BACKUP_DIR/uploads" 2>/dev/null)" ]; then
    echo "💾 Restoring product thumbnail cover images..."
    cp -r "$BACKUP_DIR/uploads"/* "$APP_DIR/public/uploads/" 2>/dev/null || true
fi

# Clean temp backup
rm -rf "$BACKUP_DIR"

echo "======================================================================"
echo "📦 STAGE 5: Syncing dependencies and restarting PM2 daemon server..."
echo "======================================================================"

cd "$APP_DIR"
npm install --production

# Confirm folder write/read permissions
chmod -R 775 "$APP_DIR/public/uploads"
chmod -R 775 "$APP_DIR/database"
chown -R www-data:www-data "$APP_DIR"

# Restart Nginx and daemon thread seamlessly
echo "🔄 Reloading Nginx service..."
systemctl reload nginx

if command -v pm2 &> /dev/null; then
    echo "🔄 Seaming and restarting PM2 daemon..."
    pm2 restart "drugtest-vault" || pm2 start server.js --name "drugtest-vault"
    pm2 save
else
    echo "🟢 Launching core server via Node..."
    node server.js &
fi

echo "======================================================================"
echo "🎉 SUCCESS: drugtest.report updated to latest version successfully! 🎉"
echo "======================================================================"
