# Building and Testing

This project is a static web app plus Jest tests. Browser CV uses OpenCV.js (WASM) from a CDN; Node tests use native bindings via `@u4/opencv4nodejs` for image-based detection.

Goal: CI should not compile OpenCV. To achieve this, CI uses system packages so `@u4/opencv4nodejs` links without running its own build.

## Prerequisites

- Node.js 18+ and npm
- For Node detection tests locally, install OpenCV dev libs or run a one-time bundled build (see below).

## Install

```bash
npm install
```

If `@u4/opencv4nodejs` fails to load with “No build found… you should launch opencv-build-npm once”, choose ONE of the following:

### Option A: Use system OpenCV (recommended for CI)

- Ubuntu/Debian:
  ```bash
  sudo apt-get update
  sudo apt-get install -y libopencv-dev
  rm -rf node_modules package-lock.json
  npm install
  ```

- macOS (Homebrew):
  ```bash
  brew update && brew install opencv
  rm -rf node_modules package-lock.json
  npm install
  ```

This avoids compiling OpenCV and keeps CI fast and deterministic.

### Option B: Local bundled build (developers only)

If you do not wish to install OpenCV system-wide, you can build the vendored copy once:

```bash
npx opencv-build-npm
```

This downloads and compiles OpenCV inside `node_modules`. It can take several minutes and requires build tools (cmake, make, C++ compiler, Python).

### One-time smooth setup (Debian/Ubuntu)

If you want a single command to get native tests working locally on Debian/Ubuntu:

```bash
npm run setup:node-cv
```

This will:
- Install system deps (build-essential, cmake, pkg-config, libopencv-dev)
- Export PKG_CONFIG_PATH for pkg-config discovery
- Run the local OpenCV build for the binding
- Reinstall node modules and verify the binding loads

## Tests

```bash
npm test
```

- Pure logic tests run fast.
- Node CV tests look for PNG fixtures under `test/fixtures/`:
  - `should-detect-*.png` — must contain a clear registration square
  - `should-not-detect-*.png` — must not contain a proper square
  - If no fixtures are present, those cases are skipped.

## GitHub Actions Guidance

In CI, prefer system packages and avoid building OpenCV. Example steps (Ubuntu):

```yaml
- name: Install OpenCV
  run: |
    sudo apt-get update
    sudo apt-get install -y libopencv-dev

- name: Install deps and run tests
  run: |
    npm ci
    npm test
```

Do NOT run `opencv-build-npm` in CI unless you specifically need a custom OpenCV build; it increases build times significantly and may introduce variability.
