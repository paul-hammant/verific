#!/usr/bin/env bash
set -euo pipefail
set -x

step() { echo "\n====> $*"; }

step "Installing npm dependencies"
if [[ "${CI:-0}" == "1" ]]; then
  npm ci --foreground-scripts --loglevel=notice
else
  npm install --foreground-scripts --loglevel=notice
fi

step "Installing Playwright browsers"
npx playwright install --with-deps

step "Running unit tests (Jest)"
npm run test:unit

step "Running e2e tests (Playwright)"
npm run test:e2e

step "All done"
