#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/budgetly"
ZIP_PATH="/opt/budgetly-deploy.zip"

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "Errore: zip non trovato in $ZIP_PATH"
  exit 1
fi

mkdir -p "$APP_DIR"
unzip -o "$ZIP_PATH" -d "$APP_DIR" >/dev/null

cd "$APP_DIR"
docker compose up -d --build

echo "Deploy completato."
echo "Health check:"
curl -fsS http://127.0.0.1:3001/api/health || true
