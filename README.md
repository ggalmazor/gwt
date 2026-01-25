# gwt - Git Worktree Manager

[![CI](https://github.com/ggalmazor/gwt/actions/workflows/ci.yml/badge.svg)](https://github.com/ggalmazor/gwt/actions/workflows/ci.yml) [![Release](https://github.com/ggalmazor/gwt/actions/workflows/release.yml/badge.svg)](https://github.com/ggalmazor/gwt/actions/workflows/release.yml)

A CLI tool to manage git worktrees with ease. Configure which files to copy and optionally launch your editor when creating new worktrees.

![Demo](docs/demo.gif)

## Features

- 🌳 **Interactive worktree creation** - Select branches with search, create new branches on the fly
- 📋 **List all worktrees** - See all your worktrees in a clean table format
- 🚀 **Open worktrees** - Quickly open existing worktrees in your editor
- 🗑️ **Delete worktrees** - Remove worktrees interactively with force option for uncommitted changes
- 🧹 **Clean orphaned directories** - Find and remove leftover worktree directories
- 💡 **Editor integration** - Optionally launch any editor (VS Code, Vim, JetBrains IDEs, etc.)
- 📁 **Configurable file copying** - Choose which files/directories to copy to new worktrees
- 🔄 **Automatic update checking** - Get notified when new versions are available (once per day)
- ⚙️ **Per-repository configuration** - Settings saved in `.gwt/config` and respected across worktrees

## Installation

Available for macOS(Apple Silicon and Intel processors) and Linux(x86_64):

```bash
curl -fsSL https://raw.githubusercontent.com/ggalmazor/gwt/main/install.sh | bash
```

## Usage

Run `gwt` without any arguments to see the available commands.

```shell
Usage:   gwt  
Version: 1.1.2

Description:

  Git Worktree Manager - Manage git worktrees with ease

Options:

  -h, --help     - Show this help.                            
  -V, --version  - Show the version number for this program.  

Commands:

  list, ls                  - List all worktrees                          
  create, add               - Create a new worktree interactively         
  delete, remove  [target]  - Delete a worktree (interactive if no target)
  open                      - Open a worktree in your configured editor   
  clean                     - Remove orphaned worktree directories        
  config                    - View or update configuration
```

### List Worktrees

Shows all worktrees with their paths, branches, and commit hashes.

```bash
gwt list
# or
gwt ls
```

### Create a New Worktree

Create a new worktree interactively.

```bash
gwt create
# or
gwt add
```

A wizard will guide you through the process.

### Delete a Worktree

Delete an existing worktree.

```bash
# Interactive selection
gwt delete

# Delete by branch name
gwt delete feature-branch

# Delete by path
gwt delete /path/to/worktree
```

If a worktree has uncommitted or untracked changes, `gwt` will warn you and ask for double confirmation before force-deleting it.

### Open a Worktree

```bash
gwt open
```

Interactively select an existing worktree to open in your configured editor. If no editor is configured, displays a `cd` command to navigate to the worktree.

### Clean Orphaned Directories

```bash
gwt clean
```

Scans for and removes orphaned worktree directories (directories that look like worktrees but are no longer tracked by git). Useful for cleaning up after manual deletions or failed operations.

### Configure

Configure GWT settings interactively.

```bash
# View current configuration
gwt config

# Run configuration wizard (reconfigure editor and files)
gwt config setup
```

The wizard will prompt you to:

1. Choose editor type (none or custom command)
2. Enter editor command (e.g., `code`, `vim`, `idea`, `/usr/bin/nvim`)
3. Enable/disable automatic update checking
4. Select files/directories to copy (with search support)

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
  "filesToCopy": [".idea", ".env"],
  "checkForUpdates": true
}
```

- `checkForUpdates`: Whether to check for updates automatically (default: `true`, checks at most once per day)

This file is git-ignored by default.

## Requirements

- Git 2.5+ (for worktree support)
- macOS or Linux
- Optional: Any editor installed for editor integration

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).

This means:

- You can use, modify, and distribute gwt freely
- If you modify gwt and make it available over a network (including as a service), you must make your source code available under AGPL-3.0
- Any derivative works must also be licensed under AGPL-3.0

See the [LICENSE](LICENSE) file for the full license text

## Contributing

Contributions welcome! Please open an issue or PR.
