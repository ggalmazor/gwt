#!/usr/bin/env bash
# gwt installer script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Installing gwt - Git Worktree Manager${NC}"
echo ""

# Detect platform
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS-$ARCH" in
  Darwin-arm64) FILE="gwt-macos-arm64" ;;
  Darwin-x86_64) FILE="gwt-macos-x64" ;;
  Linux-x86_64) FILE="gwt-linux-x64" ;;
  *)
    echo -e "${RED}❌ Unsupported platform: $OS-$ARCH${NC}"
    echo "Supported platforms:"
    echo "  - macOS (arm64, x86_64)"
    echo "  - Linux (x86_64)"
    exit 1
    ;;
esac

# Get latest version or use specified version
VERSION="${1:-latest}"
if [ "$VERSION" = "latest" ]; then
  echo -e "${BLUE}📡 Fetching latest version...${NC}"
  VERSION=$(curl -fsSL https://api.github.com/repos/ggalmazor/gwt/releases/latest | grep '"tag_name"' | sed -E 's/.*"v?([^"]+)".*/\1/')
  if [ -z "$VERSION" ]; then
    echo -e "${RED}❌ Failed to fetch latest version${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Latest version: v$VERSION${NC}"
  VERSION="v$VERSION"
else
  # Ensure version starts with 'v'
  if [[ ! "$VERSION" =~ ^v ]]; then
    VERSION="v$VERSION"
  fi
fi

URL="https://github.com/ggalmazor/gwt/releases/download/$VERSION/$FILE"

echo -e "${BLUE}📦 Downloading gwt $VERSION for $OS-$ARCH...${NC}"

# Download to temp location
TEMP_FILE="/tmp/gwt-$$"
if ! curl -fsSL "$URL" -o "$TEMP_FILE"; then
  echo -e "${RED}❌ Failed to download gwt${NC}"
  echo "URL: $URL"
  exit 1
fi

chmod +x "$TEMP_FILE"

# Determine install location
if [ -w /usr/local/bin ]; then
  INSTALL_DIR="/usr/local/bin"
elif [ -d "$HOME/bin" ]; then
  INSTALL_DIR="$HOME/bin"
else
  INSTALL_DIR="$HOME/.local/bin"
  mkdir -p "$INSTALL_DIR"
fi

INSTALL_PATH="$INSTALL_DIR/gwt"

# Move to install location
mv "$TEMP_FILE" "$INSTALL_PATH"

echo -e "${GREEN}✓ Installed to $INSTALL_PATH${NC}"
echo ""

# Check if in PATH
if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
  echo -e "${YELLOW}⚠️  $INSTALL_DIR is not in your PATH${NC}"
  echo "Add this to your shell profile (~/.zshrc, ~/.bashrc, etc.):"
  echo -e "  ${BLUE}export PATH=\"$INSTALL_DIR:\$PATH\"${NC}"
  echo ""
fi

# Test installation
if command -v gwt >/dev/null 2>&1; then
  echo -e "${GREEN}🎉 Installation complete!${NC}"
  echo ""
  gwt --version
  echo ""
  echo "Try it out:"
  echo "  gwt --help"
  echo "  gwt list"
  echo "  gwt create"
else
  echo -e "${YELLOW}⚠️  Installation complete, but gwt is not in PATH${NC}"
  echo "You may need to:"
  echo "  1. Add $INSTALL_DIR to your PATH"
  echo "  2. Restart your terminal"
  echo "  3. Run: export PATH=\"$INSTALL_DIR:\$PATH\""
fi
