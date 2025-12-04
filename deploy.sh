#!/bin/bash
set -e

# Base directory
BASE_DIR="/var/www/html/UTA"

FRONTEND_DIR="$BASE_DIR/frontend"
ADMIN_DIR="$BASE_DIR/admin"
BACKEND_DIR="$BASE_DIR/backend"

BACKEND_PROCESS="utennisa-backend"

echo "Starting deployment..."

deploy_node_app() {
  APP_DIR=$1
  BUILD=$2
  PM2_NAME=$3

  echo "---------------------------------------"
  echo "Deploying $APP_DIR ..."
  cd "$APP_DIR"

  # Install dependencies only if node_modules missing
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies (fresh install)..."
    npm install --legacy-peer-deps
  else
    echo "Dependencies exist, running npm install to update..."
    npm install --legacy-peer-deps
  fi

  # Build if required (frontend, admin)
  if [ "$BUILD" == "y" ]; then
    echo "Running build..."
    npm run build
  fi

  # Backend specific restart
  if [ -n "$PM2_NAME" ]; then
    echo "Restarting backend via PM2 properly..."

    pm2 stop "$PM2_NAME" || true
    pm2 delete "$PM2_NAME" || true

    # 👇 Start backend directly, NOT via npm
    pm2 start index.js --name "$PM2_NAME"

    pm2 save
  fi

  echo "$APP_DIR deployment done."
  echo "---------------------------------------"
}

# Deploy frontend & admin with build
deploy_node_app "$FRONTEND_DIR" "y"
deploy_node_app "$ADMIN_DIR" "y"

# Deploy backend without build
deploy_node_app "$BACKEND_DIR" "n" "$BACKEND_PROCESS"

# Restart nginx after builds
sudo systemctl restart nginx

echo "Deployment completed successfully!"
