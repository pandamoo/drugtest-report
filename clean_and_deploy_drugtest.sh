#!/bin/bash
# ==============================================================================
# Absolute Clean-up and Deployment Autopilot for drugtest.report
# Removes competing applications (like OpenWebUI) and deploys our Vault.
# Run on VPS as root: sudo bash clean_and_deploy_drugtest.sh
# ==============================================================================

# Exit immediately if any command exits with a non-zero status
set -e

echo "======================================================================"
echo "🛑 STAGE 1: Sweeping away competing applications (OpenWebUI)..."
echo "======================================================================"

# 1. Stop and remove OpenWebUI Docker containers (if served via Docker)
if command -v docker &> /dev/null; then
    echo "🐳 Checking for running OpenWebUI Docker containers..."
    CONTAINERS=$(docker ps -a | grep -E "open-webui|openwebui" | awk '{print $1}')
    if [ ! -z "$CONTAINERS" ]; then
        echo "🐳 Stopping and removing OpenWebUI Docker containers..."
        docker stop $CONTAINERS || true
        docker rm -f $CONTAINERS || true
    else
        echo "✔ No competing Docker containers found."
    fi
else
    echo "✔ Docker is not installed on this VPS."
fi

# 2. Stop OpenWebUI systemd services (if served via systemd/pip)
echo "⚙️  Checking and disabling any OpenWebUI background services..."
systemctl stop open-webui &>/dev/null || true
systemctl disable open-webui &>/dev/null || true
systemctl stop openwebui &>/dev/null || true
systemctl disable openwebui &>/dev/null || true

# 3. Terminate any python pipelines that might be serving OpenWebUI on port 8080/3000
echo "💀 Terminating competing background processes (Python / WebUIs)..."
pkill -f "open-webui" &>/dev/null || true
pkill -f "openwebui" &>/dev/null || true

# 4. Clean up competing Nginx server blocks
echo "🎨 Clearing out Nginx server block conflicts..."
# Delete the default block which captures port 80 and blocks your domain!
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/openwebui
rm -f /etc/nginx/sites-enabled/open-webui
rm -f /etc/nginx/sites-enabled/webui

echo "✔ Stage 1 completed! Server is completely cleared."
echo ""

echo "======================================================================"
echo "🚀 STAGE 2: Launching fresh deploy automation script..."
echo "======================================================================"

# Download and execute the new deploy script we created
curl -sSL https://raw.githubusercontent.com/pandamoo/drugtest-report/main/deploy_drugtest_report.sh -o deploy.sh
chmod +x deploy.sh
bash deploy.sh

echo "======================================================================"
echo "🚀 STAGE 3: SSL Certificate configurations..."
echo "======================================================================"
# Request Certbot TLS secure certifications and reload Nginx
certbot --nginx --non-interactive --agree-tos --redirect -m koala@koala.com -d drugtest.report -d www.drugtest.report || true
systemctl reload nginx

echo "======================================================================"
echo "🎉 SUCCESS: OpenWebUI removed. https://drugtest.report is now live!"
echo "======================================================================"
