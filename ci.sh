#!/usr/bin/env bash
set -euo pipefail
set -x

step() { echo "\n====> $*"; }

step "Checking OpenCV (Ubuntu/Debian)"
if command -v apt-get >/dev/null 2>&1; then
  if dpkg -s libopencv-dev >/dev/null 2>&1; then
    echo "libopencv-dev already installed"
  else
    sudo apt-get update
    sudo apt-get install -y libopencv-dev
  fi
else
  echo "apt-get not found; please install OpenCV dev libs manually"
fi

step "Installing npm dependencies"
if [[ "${CI:-0}" == "1" ]]; then
  npm ci --foreground-scripts --loglevel=notice
else
  npm install --foreground-scripts --loglevel=notice
fi

step "Running web (Playwright) tests"
npm run test:web

step "All done"
