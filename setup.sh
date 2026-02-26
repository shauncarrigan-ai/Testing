#!/bin/bash
# DailyDo — one-command setup & run
set -e

# ── Check Node.js ────────────────────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "Node.js is not installed. Get it from https://nodejs.org (v18+)"
  exit 1
fi

NODE_VERSION=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Node.js v18+ required (you have v$NODE_VERSION). Upgrade at https://nodejs.org"
  exit 1
fi

# ── Pull latest code ─────────────────────────────────────────────────────────
echo "Pulling latest code..."
git pull origin claude/ios-todo-app-HY1Wv

# ── Install dependencies ─────────────────────────────────────────────────────
echo "Installing dependencies..."
npm install

# ── Start Expo (clear cache so you always get the latest build) ───────────────
echo ""
echo "Starting DailyDo..."
echo ""
echo "  Press  i  →  iOS Simulator    (macOS + Xcode required)"
echo "  Press  a  →  Android Emulator (Android Studio required)"
echo "  Scan QR   →  Expo Go on your phone (no simulator needed)"
echo ""
npx expo start --clear
