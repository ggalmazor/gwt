# gwt - Git Worktree Manager

A CLI tool to manage git worktrees with ease. Automatically copies `.idea` configuration and `.env` files to new worktrees, and launches your JetBrains IDE.

## Features

- 🌳 **Interactive worktree creation** - Select branches with search, create new branches on the fly
- 📋 **List all worktrees** - See all your worktrees in a clean table format
- 🗑️ **Delete worktrees** - Remove worktrees interactively or by name
- 💡 **IDE Integration** - Automatically launch JetBrains IDEs (IntelliJ, RubyMine, GoLand, etc.)
- 📁 **Smart file copying** - Copies `.idea` directory and `.env*` files (excluding `.example` files)
- ⚙️ **Remembers your preferences** - Saves IDE choice per repository in `.gwt/config`

## Installation

### Quick Install (macOS/Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/main/install.sh | bash
```

### Manual Download

Download the appropriate binary for your platform from [GitHub Releases](https://github.com/OWNER/REPO/releases/latest):

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
git clone https://github.com/OWNER/REPO.git
cd gwt
deno task install
```

## Usage

### Create a New Worktree

```bash
gwt create
# or
gwt add
```

This will:

1. Show an interactive branch selector (type to search)
2. Let you create a new branch if needed
3. Prompt for the worktree path (with smart defaults)
4. Create the worktree
5. Copy `.idea` directory and `.env*` files
6. Launch your IDE (prompts on first use, remembers your choice)

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

### Configure IDE

```bash
# View current configuration
gwt config

# Set IDE preference
gwt config set idea        # IntelliJ IDEA
gwt config set rubymine    # RubyMine
gwt config set goland      # GoLand
gwt config set webstorm    # WebStorm
gwt config set pycharm     # PyCharm
gwt config set phpstorm    # PhpStorm
gwt config set clion       # CLion
gwt config set rider       # Rider
```

## How It Works

When you create a worktree, `gwt`:

1. Creates a git worktree at your specified path
2. Copies the `.idea` directory from your main worktree (preserves IDE settings)
3. Copies all `.env*` files from the root (excludes `.example` files)
4. Launches your configured JetBrains IDE at the new worktree path

## Configuration

Configuration is stored in `.gwt/config` in your repository root:

```json
{
  "version": "1.0",
  "ide": "idea"
}
```

This file is git-ignored by default.

## Requirements

- Git 2.5+ (for worktree support)
- macOS or Linux
- JetBrains IDE installed (if using IDE integration)

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
