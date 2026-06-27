#!/bin/bash
# ==============================================================================
# Full-Stack Deployment Script for Review Portfolio Vault on drugtest.report
# Target OS: Ubuntu / Debian Linux VPS
# Make sure you run this script as root: sudo bash deploy_drugtest_report.sh
# ==============================================================================

# Exit immediately if any command exits with a non-zero status
set -e

# Configuration Variables
APP_DIR="/var/www/drugtest.report"
DOMAIN="drugtest.report"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
ADMIN_PASSCODE="$Kool321"

echo "======================================================================"
echo "🚀 Beginning deployment automation for https://$DOMAIN..."
echo "======================================================================"

# 1. Ensure the script is run with sudo/root permissions
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: Please execute this script as root: sudo bash $0"
    exit 1
fi

# 2. Update system packages
echo "🔄 Updating system package indexes (apt)..."
apt-get update -y

# 3. Ensure Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo "🟢 Node.js not found. Installing Node.js LTS release..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "✔ Node.js is already installed: $(node -v)"
fi

# 4. Ensure Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "🟢 Installing Nginx web server..."
    apt-get install -y nginx
else
    echo "✔ Nginx is already installed."
fi

# 5. Ensure Certbot (SSL) is installed
if ! command -v certbot &> /dev/null; then
    echo "🟢 Installing Let's Encrypt Certbot Nginx package..."
    apt-get install -y certbot python3-certbot-nginx
else
    echo "✔ Certbot is already installed."
fi

# 6. Create Application directory and manage backups
echo "📁 Preparing application directories at $APP_DIR..."

BACKUP_DIR="/tmp/drugtest_vault_backup"
rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Persist files across deployments so database writeups and product cover images are never lost!
if [ -f "$APP_DIR/database/db.json" ]; then
    echo "💾 Backing up existing database (db.json)..."
    cp "$APP_DIR/database/db.json" "$BACKUP_DIR/db.json"
fi

if [ -d "$APP_DIR/public/uploads" ] && [ "$(ls -A "$APP_DIR/public/uploads" 2>/dev/null)" ]; then
    echo "💾 Backing up uploaded cover art images..."
    cp -r "$APP_DIR/public/uploads" "$BACKUP_DIR/uploads"
fi

# 7. Sync codebase dynamically via Git (Production Devops Workflow)
echo "📝 Fetching fresh codebase from GitHub..."
GIT_REPO_URL="https://github.com/pandamoo/drugtest-report.git"

if [ "$GIT_REPO_URL" == "https://github.com/YOUR_GITHUB_USERNAME/drugtest-report.git" ]; then
    echo "⚠️  WARNING: You need to set your actual GIT_REPO_URL inside this script!"
    echo "Please specify your public GitHub repository URL:"
    read -r -p "GitHub Repository URL: " inputted_url
    if [ ! -z "$inputted_url" ]; then
        GIT_REPO_URL="$inputted_url"
    fi
fi

# Create target directory if missing
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Initialize Git locally inside target directory to bypass folder-exist collisions!
if [ ! -d ".git" ]; then
    echo "🟢 Initializing Git local repository inside $APP_DIR..."
    git init
    git remote add origin "$GIT_REPO_URL" || git remote set-url origin "$GIT_REPO_URL"
fi

# Force fetch and overwrite local files to align with main completely
echo "🍿 Overwriting the directory to align with GitHub main branch..."
git fetch origin main
git reset --hard origin/main

# Create database and uploads targets
mkdir -p "$APP_DIR/public/uploads"
mkdir -p "$APP_DIR/database"

# Restore backups if they exist
if [ -f "$BACKUP_DIR/db.json" ]; then
    echo "💾 Restoring database (db.json)..."
    cp "$BACKUP_DIR/db.json" "$APP_DIR/database/db.json"
fi

if [ -d "$BACKUP_DIR/uploads" ] && [ "$(ls -A "$BACKUP_DIR/uploads" 2>/dev/null)" ]; then
    echo "💾 Restoring uploaded cover art images..."
    cp -r "$BACKUP_DIR/uploads"/* "$APP_DIR/public/uploads/" 2>/dev/null || true
fi

# Clean up local temp backup space
rm -rf "$BACKUP_DIR"

# 8. Clean install Server dependencies
echo "📦 Installing server npm packages (Express, BcryptJS, JWT, Multer)..."
cd "$APP_DIR"
npm install --production

# Ensure uploads and database folders have full write permissions for app's file persistence
chmod -R 775 "$APP_DIR/public/uploads"
chmod -R 775 "$APP_DIR/database"
chown -R www-data:www-data "$APP_DIR"

# 9. Configure Nginx Server Block Reverse Proxy
echo "🌐 Constructing Nginx Virtual Host block at $NGINX_CONF..."
cat << 'EOF' > "$NGINX_CONF"
server {
    listen 80;
    listen [::]:80;

    server_name drugtest.report www.drugtest.report;

    # Maximum file upload size through Nginx (Handles your 30MB covers)
    client_max_body_size 35M;

    # Log Locations
    access_log /var/log/nginx/drugtest_report_access.log;
    error_log /var/log/nginx/drugtest_report_error.log;

    # Match Static Uploads directly
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Reverse Proxy all traffic to the Node.js Express server running on port 3000
    location / {
        proxy_pass http://127.0.0.1:3000;
        
        # Crucial proxy headers to preserve user IP addresses & JWT session state
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable Nginx block by symlinking to sites-enabled
if [ ! -f /etc/nginx/sites-enabled/drugtest.report ]; then
    echo "🔗 Symlinking Virtual Host to sites-enabled..."
    ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/
fi

# Verify Nginx configuration syntax is OK
echo "🩺 Inspecting Nginx configuration integrity..."
nginx -t

# Reload Nginx securely to host changes live
echo "🔄 Reloading Nginx..."
systemctl reload nginx

# 10. Install PM2 globally and start/keep-alive Node.js app
if ! command -v pm2 &> /dev/null; then
    echo "🟢 Installing PM2 globally for continuous Node daemon keeping..."
    npm install -g pm2
else
    echo "✔ PM2 is already installed."
fi

echo "🟢 Launching Node.js continuous process inside PM2..."
cd "$APP_DIR"
pm2 delete drugtest-vault &> /dev/null || true
pm2 start server.js --name "drugtest-vault"

# Save PM2 process list to auto-resume on server restarts
pm2 save
pm2 startup | tail -n 1 | bash || true

echo "======================================================================"
echo "✔ SUCCESS: Review Portfolio Vault is now deployed and running live!"
echo "📈 Express server is daemonized on PM2 port 3000."
echo "🌐 Nginx reverse proxy is actively directing http://$DOMAIN traffic."
echo "======================================================================"
echo ""
echo "🔥 FINAL STEP TO RUN INTERACTIVELY (SSL CERTIFICATE):"
echo "To get your free Let's Encrypt HTTPS green lock for drugtest.report,"
echo "execute this command and follow the prompts:"
echo ""
echo "   sudo certbot --nginx -d drugtest.report -d www.drugtest.report"
echo ""
echo "======================================================================"
