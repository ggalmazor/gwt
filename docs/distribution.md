# gwt Distribution Options

This document outlines various approaches for distributing `gwt` to end-users.

## Quick Comparison

| Method          | Ease of Install | Auto-updates | Cross-platform | Best For       |
|-----------------|-----------------|--------------|----------------|----------------|
| Homebrew        | ⭐⭐⭐⭐⭐           | ⭐⭐⭐⭐         | macOS/Linux    | Mac users      |
| GitHub Releases | ⭐⭐⭐⭐            | ⭐⭐           | All            | General public |
| Deno Install    | ⭐⭐⭐⭐            | ⭐⭐           | All            | Deno users     |
| npm/npx         | ⭐⭐⭐⭐⭐           | ⭐⭐⭐⭐         | All            | Node users     |
| Shell Script    | ⭐⭐⭐⭐⭐           | ⭐⭐⭐          | macOS/Linux    | Quick install  |

## 1. Homebrew Tap (Recommended for macOS)

**Best for**: macOS users who want easy installation and updates

### Setup Process

1. **Create a Homebrew tap repository**: `homebrew-gwt`
2. **Create Formula**:

```ruby
# Formula/gwt.rb
class Gwt < Formula
  desc "Git Worktree Manager - Manage git worktrees with ease"
  homepage "https://github.com/yourusername/gwt"
  version "1.0.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/yourusername/gwt/releases/download/v1.0.0/gwt-macos-arm64"
      sha256 "..." # Calculate with: shasum -a 256 gwt-macos-arm64
    else
      url "https://github.com/yourusername/gwt/releases/download/v1.0.0/gwt-macos-x64"
      sha256 "..."
    end
  end

  on_linux do
    url "https://github.com/yourusername/gwt/releases/download/v1.0.0/gwt-linux-x64"
    sha256 "..."
  end

  def install
    bin.install "gwt-macos-arm64" => "gwt" if Hardware::CPU.arm?
    bin.install "gwt-macos-x64" => "gwt" if Hardware::CPU.intel?
    bin.install "gwt-linux-x64" => "gwt" if OS.linux?
  end

  test do
    system "#{bin}/gwt", "--version"
  end
end
```

### User Installation

```bash
# Add tap
brew tap yourusername/gwt

# Install
brew install gwt

# Update
brew upgrade gwt
```

### Pros

- Familiar to Mac users
- Automatic updates via `brew upgrade`
- Handles dependencies
- Easy uninstall

### Cons

- Requires maintaining a separate tap repository
- macOS/Linux only (no Windows)
- Need to update formula for each release

---

## 2. GitHub Releases with Pre-built Binaries

**Best for**: Cross-platform distribution, general public

### Setup Process

1. **Create release workflow** (`.github/workflows/release.yml`):

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        include:
          - os: macos-latest
            target: aarch64-apple-darwin
            name: gwt-macos-arm64
          - os: macos-latest
            target: x86_64-apple-darwin
            name: gwt-macos-x64
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
            name: gwt-linux-x64
          - os: windows-latest
            target: x86_64-pc-windows-msvc
            name: gwt-windows-x64.exe

    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v2.x

      - name: Compile
        run: |
          deno compile \
            --allow-run --allow-read --allow-write --allow-env \
            --target=${{ matrix.target }} \
            --output=${{ matrix.name }} \
            main.ts

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.name }}
          path: ${{ matrix.name }}

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            gwt-*/*
          generate_release_notes: true
```

2. **Add install script**:

```bash
# scripts/install.sh
#!/bin/bash
set -e

# Detect OS and architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS-$ARCH" in
  Darwin-arm64) FILE="gwt-macos-arm64" ;;
  Darwin-x86_64) FILE="gwt-macos-x64" ;;
  Linux-x86_64) FILE="gwt-linux-x64" ;;
  *) echo "Unsupported platform: $OS-$ARCH"; exit 1 ;;
esac

# Download latest release
VERSION="${1:-latest}"
URL="https://github.com/yourusername/gwt/releases/$VERSION/download/$FILE"

echo "Downloading gwt..."
curl -fsSL "$URL" -o /tmp/gwt
chmod +x /tmp/gwt

# Install to /usr/local/bin or ~/bin
if [ -w /usr/local/bin ]; then
  mv /tmp/gwt /usr/local/bin/gwt
  echo "Installed to /usr/local/bin/gwt"
else
  mkdir -p "$HOME/bin"
  mv /tmp/gwt "$HOME/bin/gwt"
  echo "Installed to $HOME/bin/gwt"
  echo "Add $HOME/bin to your PATH if not already there"
fi

gwt --version
```

### User Installation

```bash
# One-liner install
curl -fsSL https://raw.githubusercontent.com/yourusername/gwt/main/scripts/install.sh | bash

# Or manual download
wget https://github.com/yourusername/gwt/releases/download/v1.0.0/gwt-macos-arm64
chmod +x gwt-macos-arm64
sudo mv gwt-macos-arm64 /usr/local/bin/gwt
```

### Pros

- Cross-platform (macOS, Linux, Windows)
- No dependencies required
- Users can download directly from GitHub
- Version pinning is easy

### Cons

- Manual updates (no auto-update mechanism)
- Larger binary size (~95MB with Deno runtime)
- Need CI/CD setup for automated builds

---

## 3. Deno Install (deno.land/x)

**Best for**: Deno users, developers comfortable with Deno

### Setup Process

1. **Publish to deno.land/x** (automatic via GitHub webhook)
2. **Create install script**: Already have `scripts/install.ts`

### User Installation

```bash
# Install from deno.land/x
deno install --allow-run --allow-read --allow-write --allow-env \
  -n gwt https://deno.land/x/gwt@v1.0.0/main.ts

# Or compile and install locally
deno task install
```

### Pros

- Native to Deno ecosystem
- Source code always available
- Easy to inspect and modify
- Version management via Deno

### Cons

- Requires Deno to be installed
- Not compiled (slower startup)
- Less familiar to non-Deno users
- Requires permission flags

---

## 4. npm Package (with compiled binary)

**Best for**: Node.js/npm users, widest distribution

### Setup Process

1. **Create `package.json`**:

```json
{
  "name": "@yourusername/gwt",
  "version": "1.0.0",
  "description": "Git Worktree Manager",
  "bin": {
    "gwt": "./bin/gwt"
  },
  "scripts": {
    "postinstall": "node scripts/download-binary.js"
  },
  "files": [
    "bin/",
    "scripts/"
  ],
  "keywords": [
    "git",
    "worktree",
    "cli"
  ],
  "license": "MIT"
}
```

2. **Create binary downloader** (`scripts/download-binary.js`):

```javascript
const https = require('https');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const {pipeline} = require('stream');

const streamPipeline = promisify(pipeline);

const VERSION = '1.0.0';
const platform = process.platform;
const arch = process.arch;

const binaryMap = {
  'darwin-arm64': 'gwt-macos-arm64',
  'darwin-x64': 'gwt-macos-x64',
  'linux-x64': 'gwt-linux-x64',
  'win32-x64': 'gwt-windows-x64.exe',
};

const binaryName = binaryMap[`${platform}-${arch}`];
if (!binaryName) {
  console.error(`Unsupported platform: ${platform}-${arch}`);
  process.exit(1);
}

const url = `https://github.com/yourusername/gwt/releases/download/v${VERSION}/${binaryName}`;
const binDir = path.join(__dirname, '..', 'bin');
const binPath = path.join(binDir, platform === 'win32' ? 'gwt.exe' : 'gwt');

async function download() {
  fs.mkdirSync(binDir, {recursive: true});

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (res) => {
          const file = fs.createWriteStream(binPath);
          streamPipeline(res, file).then(resolve).catch(reject);
        });
      } else {
        const file = fs.createWriteStream(binPath);
        streamPipeline(response, file).then(resolve).catch(reject);
      }
    });
  });
}

download()
    .then(() => {
      fs.chmodSync(binPath, 0o755);
      console.log('gwt installed successfully!');
    })
    .catch((err) => {
      console.error('Failed to download gwt:', err);
      process.exit(1);
    });
```

### User Installation

```bash
# Global install
npm install -g @yourusername/gwt

# Or use npx (no install)
npx @yourusername/gwt create
```

### Pros

- Huge user base (npm users)
- Familiar installation method
- Works with `npx` for one-off usage
- Easy updates via `npm update -g`

### Cons

- Requires Node.js/npm
- Postinstall scripts can be blocked by corporate policies
- Binary download during install (slower)

---

## 5. Shell Install Script (Recommended for Quick Start)

**Best for**: One-liner installation, documentation examples

### Setup Process

Create `install.sh` in repository root:

```bash
#!/usr/bin/env bash
# gwt installer script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔨 Installing gwt - Git Worktree Manager"

# Detect platform
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS-$ARCH" in
  Darwin-arm64) FILE="gwt-macos-arm64" ;;
  Darwin-x86_64) FILE="gwt-macos-x64" ;;
  Linux-x86_64) FILE="gwt-linux-x64" ;;
  MINGW*|MSYS*|CYGWIN*) FILE="gwt-windows-x64.exe" ;;
  *)
    echo -e "${RED}❌ Unsupported platform: $OS-$ARCH${NC}"
    exit 1
    ;;
esac

# Get latest version or use specified version
VERSION="${1:-latest}"
if [ "$VERSION" = "latest" ]; then
  VERSION=$(curl -fsSL https://api.github.com/repos/yourusername/gwt/releases/latest | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/v\1/')
fi

URL="https://github.com/yourusername/gwt/releases/download/$VERSION/$FILE"

echo "📦 Downloading gwt $VERSION for $OS-$ARCH..."
curl -fsSL "$URL" -o /tmp/gwt

chmod +x /tmp/gwt

# Determine install location
if [ -w /usr/local/bin ]; then
  INSTALL_DIR="/usr/local/bin"
elif [ -d "$HOME/bin" ]; then
  INSTALL_DIR="$HOME/bin"
else
  INSTALL_DIR="$HOME/.local/bin"
  mkdir -p "$INSTALL_DIR"
fi

mv /tmp/gwt "$INSTALL_DIR/gwt"

echo -e "${GREEN}✓ Installed to $INSTALL_DIR/gwt${NC}"

# Check if in PATH
if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
  echo -e "${YELLOW}⚠️  $INSTALL_DIR is not in your PATH${NC}"
  echo "Add this to your shell profile (~/.zshrc, ~/.bashrc, etc.):"
  echo -e "  export PATH=\"$INSTALL_DIR:\$PATH\""
fi

# Test installation
if command -v gwt >/dev/null 2>&1; then
  echo ""
  gwt --version
  echo -e "${GREEN}🎉 Installation complete!${NC}"
  echo ""
  echo "Try it out:"
  echo "  gwt --help"
  echo "  gwt list"
  echo "  gwt create"
else
  echo -e "${YELLOW}Installation complete, but gwt is not in PATH${NC}"
fi
```

### User Installation

```bash
# One-liner
curl -fsSL https://raw.githubusercontent.com/yourusername/gwt/main/install.sh | bash

# Or with specific version
curl -fsSL https://raw.githubusercontent.com/yourusername/gwt/main/install.sh | bash -s v1.0.0
```

### Pros

- Dead simple for users
- One command to install
- No dependencies
- Works on CI/CD

### Cons

- Security concerns (running remote scripts)
- Requires curl/wget

---

## 6. Cargo (Rust ecosystem)

**Best for**: Rust users (though gwt is Deno, cargo can distribute binaries)

Would require wrapping or publishing to crates.io - not recommended for a Deno project.

---

## 7. System Package Managers

### Debian/Ubuntu (APT)

Create `.deb` package:

```bash
deno task build:deb
```

### RedHat/Fedora (RPM)

Create `.rpm` package:

```bash
deno task build:rpm
```

### Arch Linux (AUR)

Create PKGBUILD for AUR

### Pros

- Native to system package manager
- Easy updates via system tools
- Familiar to Linux users

### Cons

- Requires maintaining multiple package formats
- Different processes for each distro
- Slower to get accepted into repos

---

## Recommended Distribution Strategy

### Phase 1: Initial Release (Now)

1. **GitHub Releases** - Primary distribution
2. **Shell install script** - Easy onboarding
3. **Manual install docs** - For advanced users

### Phase 2: Broader Reach (After validation)

1. **Homebrew tap** - For Mac users
2. **npm package** - For Node/JS ecosystem
3. **deno.land/x** - For Deno users

### Phase 3: Full Distribution (If popular)

1. **Official Homebrew formula** (homebrew/core)
2. **Linux package repositories**
3. **Windows Package Manager (winget)**

---

## Documentation Additions

Add to `README.md`:

```markdown
## Installation

### Quick Install (macOS/Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/gwt/main/install.sh | bash
```

### Homebrew (macOS)

```bash
brew tap yourusername/gwt
brew install gwt
```

### Download Binary

Download from [GitHub Releases](https://github.com/yourusername/gwt/releases/latest)

### From Source (requires Deno)

```bash
git clone https://github.com/yourusername/gwt
cd gwt
deno task install
```

## Updating

### Homebrew

```bash
brew upgrade gwt
```

### Shell script

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/gwt/main/install.sh | bash
```

### Manual

Download the latest release and replace your binary.

```
```

---

## Next Steps

1. Push tag to GitHub: `git push origin v1.0.0`
2. Create GitHub Release with pre-built binaries
3. Write installation documentation
4. Create install.sh script
5. (Optional) Set up Homebrew tap
6. (Optional) Publish to npm
7. Announce on relevant communities

Let me know which distribution method(s) you'd like to implement first!
