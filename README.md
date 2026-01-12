# gwt - Git Worktree Manager

[![CI](https://github.com/ggalmazor/gwt/actions/workflows/ci.yml/badge.svg)](https://github.com/ggalmazor/gwt/actions/workflows/ci.yml) [![Release](https://github.com/ggalmazor/gwt/actions/workflows/release.yml/badge.svg)](https://github.com/ggalmazor/gwt/actions/workflows/release.yml)

A CLI tool to manage git worktrees with ease. Configure which files to copy and optionally launch your editor when creating new worktrees.

## Features

- 🌳 **Interactive worktree creation** - Select branches with search, create new branches on the fly
- 📋 **List all worktrees** - See all your worktrees in a clean table format
- 🗑️ **Delete worktrees** - Remove worktrees interactively or by name
- 💡 **Editor integration** - Optionally launch any editor (VS Code, Vim, JetBrains IDEs, etc.)
- 📁 **Configurable file copying** - Choose which files/directories to copy to new worktrees
- ⚙️ **Per-repository configuration** - Settings saved in `.gwt/config` and respected across worktrees

## Installation

### Quick Install (macOS/Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/ggalmazor/gwt/main/install.sh | bash
```

### Manual Download

Download the appropriate binary for your platform from [GitHub Releases](https://github.com/ggalmazor/gwt/releases/latest):

- **macOS (Apple Silicon)**: `gwt-macos-arm64`
- **macOS (Intel)**: `gwt-macos-x64`
- **Linux (x86_64)**: `gwt-linux-x64`

Then install:

```bash
# Make it executable
chmod +x gwt-*

# Move to a directory in your PATH
sudo mv gwt-* /usr/local/bin/gwt

# Or to your user bin directory
mkdir -p ~/bin
mv gwt-* ~/bin/gwt
export PATH="$HOME/bin:$PATH"  # Add to your shell profile
```

### From Source (requires Deno)

```bash
git clone https://github.com/ggalmazor/gwt.git
cd gwt
deno task compile
sudo mv gwt /usr/local/bin/
```

## Usage

### Create a New Worktree

```bash
gwt create
# or
gwt add
```

On first use, `gwt` will run an interactive configuration wizard to set up:

- Editor preference (none, or any command like `code`, `vim`, `idea`, etc.)
- Files/directories to copy (select from your repository with search)

After configuration, creating a worktree will:

1. Show an interactive branch selector (type to search)
2. Let you create a new branch if needed
3. Prompt for the worktree path (with smart defaults)
4. Create the worktree
5. Copy your configured files/directories
6. Launch your configured editor (if not set to "none")

### List Worktrees

```bash
gwt list
# or
gwt ls
```

Shows all worktrees with their paths, branches, and commit hashes.

### Delete a Worktree

```bash
# Interactive selection
gwt delete

# Delete by branch name
gwt delete feature-branch

# Delete by path
gwt delete /path/to/worktree
```

### Configure

```bash
# View current configuration
gwt config

# Run configuration wizard (reconfigure editor and files)
gwt config setup
```

The wizard will prompt you to:

1. Choose editor type (none or custom command)
2. Enter editor command (e.g., `code`, `vim`, `idea`, `/usr/bin/nvim`)
3. Select files/directories to copy (with search support)

## How It Works

When you create a worktree, `gwt`:

1. Creates a git worktree at your specified path
2. Copies your configured files/directories from the main worktree
3. Launches your configured editor (if enabled) with the worktree path

All settings are per-repository, so each project can have different editor and file preferences.

## Configuration

Configuration is stored in `.gwt/config` in your repository root:

```json
{
  "version": "2.0",
  "editor": {
    "type": "custom",
    "command": "idea"
  },
  "filesToCopy": [".idea", ".env"]
}
```

This file is git-ignored by default.

## Requirements

- Git 2.5+ (for worktree support)
- macOS or Linux
- Optional: Any editor installed for editor integration

## Development

Built with [Deno](https://deno.com/) and TypeScript.

```bash
# Run tests
deno task test

# Run in development mode
deno task dev list

# Compile binary
deno task compile
```

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).

This means:

- You can use, modify, and distribute gwt freely
- If you modify gwt and make it available over a network (including as a service), you must make your source code available under AGPL-3.0
- Any derivative works must also be licensed under AGPL-3.0

See the [LICENSE](LICENSE) file for the full license text

## Contributing

Contributions welcome! Please open an issue or PR.
