# Release Setup Guide

This guide walks through setting up GitHub releases for gwt.

## Prerequisites

- GitHub repository created
- Local repository pushed to GitHub
- Git tag `v1.0.0` exists locally

## Setup Steps

### 1. Update Placeholders

Before pushing, update the following files with your GitHub username/org and repo name:

**`install.sh`** (line 40 and 47):

```bash
# Change:
VERSION=$(curl -fsSL https://api.github.com/repos/OWNER/REPO/releases/latest ...)
URL="https://github.com/OWNER/REPO/releases/download/$VERSION/$FILE"

# To (example):
VERSION=$(curl -fsSL https://api.github.com/repos/yourusername/gwt/releases/latest ...)
URL="https://github.com/yourusername/gwt/releases/download/$VERSION/$FILE"
```

**`README.md`** (multiple locations):

```markdown
# Change all instances of:

https://github.com/OWNER/REPO

# To (example):

https://github.com/yourusername/gwt
```

### 2. Push to GitHub

```bash
# Add remote if not already added
git remote add origin git@github.com:yourusername/gwt.git

# Push main branch
git push -u origin main

# Push tags
git push origin v1.0.0
```

### 3. First Release

When you push the `v1.0.0` tag, GitHub Actions will automatically:

1. ✅ Checkout the code
2. ✅ Setup Deno 2.x
3. ✅ Compile binaries for:
   - macOS arm64 (Apple Silicon)
   - macOS x64 (Intel)
   - Linux x64
4. ✅ Create a GitHub Release
5. ✅ Upload all binaries to the release
6. ✅ Generate release notes from commits

### 4. Verify Release

After the workflow completes (~5-10 minutes):

1. Go to `https://github.com/yourusername/gwt/releases`
2. Verify v1.0.0 release exists
3. Verify all 3 binaries are attached:
   - `gwt-macos-arm64`
   - `gwt-macos-x64`
   - `gwt-linux-x64`

### 5. Test Installation

Test the install script:

```bash
# From a different directory
curl -fsSL https://raw.githubusercontent.com/yourusername/gwt/main/install.sh | bash

# Verify installation
gwt --version
```

## Future Releases

To create a new release:

```bash
# Update version in deno.json
vim deno.json

# Commit changes
git add deno.json
git commit -m "chore: bump version to 1.1.0"

# Create and push tag
git tag v1.1.0
git push origin main
git push origin v1.1.0
```

The GitHub Actions workflow will automatically build and release.

## Workflow Details

The release workflow (`.github/workflows/release.yml`):

- **Trigger**: Runs on any tag push matching `v*`
- **Build Job**:
  - Runs on macOS and Linux runners
  - Uses matrix strategy for parallel builds
  - Compiles with `deno compile` for each target
  - Uploads artifacts with 1-day retention
- **Release Job**:
  - Depends on build job completion
  - Downloads all artifacts
  - Creates GitHub release
  - Attaches all binaries
  - Auto-generates release notes from commits

## Troubleshooting

### Build Fails

Check the Actions tab on GitHub:

```
https://github.com/yourusername/gwt/actions
```

Common issues:

- **Deno version**: Workflow uses latest v2.x
- **Permissions**: Workflow has `contents: write` permission
- **Dependencies**: All dependencies are fetched from JSR

### Install Script Fails

- Verify the binary names match exactly
- Check release URL is correct
- Ensure binaries are executable (should be by default)

### Binary Won't Run

macOS users may see "unidentified developer" warning:

```bash
# Allow the binary
xattr -d com.apple.quarantine /usr/local/bin/gwt
```

Or right-click → Open in Finder first time.

## Install Script Hosting

The install script can be accessed via:

```bash
# GitHub raw URL (recommended for releases)
https://raw.githubusercontent.com/yourusername/gwt/main/install.sh

# Or specific version
https://raw.githubusercontent.com/yourusername/gwt/v1.0.0/install.sh
```

Users can install with:

```bash
curl -fsSL https://raw.githubusercontent.com/yourusername/gwt/main/install.sh | bash

# Or with specific version
curl -fsSL https://raw.githubusercontent.com/yourusername/gwt/main/install.sh | bash -s v1.0.0
```

## GitHub Permissions

The workflow requires these permissions (already configured):

- `contents: write` - Create releases and upload assets

These are granted via the `GITHUB_TOKEN` secret (automatically available).
