#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Deploy POS System to OMV (192.168.1.36)
#  Run this ON the OMV server in the project directory
# ─────────────────────────────────────────────────────────────
#  Prerequisites:
#  1. Clone/copy the project to /mnt/data/pos-system on OMV
#  2. Create .env file with your PayMongo keys:
#     echo "PAYMONGO_SECRET_KEY=*** >> /mnt/data/pos-system/.env
#     echo "PAYMONGO_PUBLIC_KEY=pk_live_xxxxxxxxx" >> /mnt/data/pos-system/.env
#  3. Run: cd /mnt/data/pos-system && bash deploy-omv.sh
# ─────────────────────────────────────────────────────────────

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "🚀 Deploying POS System to OMV at 192.168.1.36"
echo "   Directory: $APP_DIR"
echo ""

# 1. Check .env exists with PayMongo keys
if [ ! -f "$APP_DIR/.env" ]; then
    echo "❌ .env file not found! Creating from .env.example..."
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo ""
    echo "⚠️  Edit $APP_DIR/.env and add your PayMongo keys:"
    echo "   PAYMONGO_SECRET_KEY=*** >> .env
    echo "   PAYMONGO_PUBLIC_KEY=pk_live_xxxxxxxxx"
    echo "   Then re-run this script."
    exit 1
fi

# 2. Build the React frontend
echo "📦 Building React frontend..."
cd "$APP_DIR/pos-frontend"

# Check node_modules
if [ ! -d "node_modules" ]; then
    npm ci
fi
npm run build

# 3. Build & start Docker services
echo "🐳 Building & starting Docker containers..."
cd "$APP_DIR"
docker compose build
docker compose up -d

# 4. Run migrations
echo "🗄️  Running database migrations..."
docker compose exec -T laravel php artisan migrate --force

# 5. Clear config/route cache (already done in container startup, but just in case)
docker compose exec -T laravel php artisan config:cache
docker compose exec -T laravel php artisan route:cache

echo ""
echo "✅ Deployment complete!"
echo "   ┌─────────────────────────────────────┐"
echo "   │  Frontend:  http://192.168.1.36:8888 │"
echo "   │  API:       http://192.168.1.36:8888 |"
echo "   │  phpMyAdmin: http://192.168.1.36:8081 │"
echo "   └─────────────────────────────────────┘"
echo ""
echo "🔑 PayMongo test mode uses keys starting with sk_test_/pk_test_"
echo "   Live mode uses sk_live_/pk_live_"
echo ""