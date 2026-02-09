# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-02-09

### Added

- Non-interactive mode for all commands via CLI flags, enabling scripting and automation
- `gwt create --branch <name> --path <dir>` to create worktrees without prompts
- `gwt create --new-branch <name> --base <branch> --path <dir>` to create new branches non-interactively
- `gwt create --no-editor` to skip editor launch
- `gwt delete <target> --force` to skip confirmation prompts
- `gwt open <target>` to open a worktree by path or branch name without selection prompt
- `gwt clean --all` to remove all orphaned directories without prompting

## [1.3.0] - 2026-02-09

### Changed

- `gwt delete` now supports multi-select when no target is provided, allowing deletion of multiple worktrees at once

## [1.2.4] - 2025-01-24

- Housekeeping: run ci and lint before release

## [1.2.3] - 2025-01-24

- Fix version number across all artifacts
- Housekeeping: automated version management and release automation

## [1.2.2] - 2025-01-24

### Fixed

- Commit the Deno lock file for reproducible builds

## [1.2.1] - 2025-01-23

### Fixed

- Detect both uncommitted and untracked files in delete command

## [1.2.0] - 2025-01-22

### Added

- `open` command to launch editor on existing worktrees
- `clean` command to remove orphaned worktree directories
- Automatic update checking (once per day, configurable)

### Changed

- Removed second confirmation from clean command

## [1.1.2] - 2025-01-21

### Fixed

- Improved error message handling
- Updated formatting rules

### Changed

- Removed unused JetBrains IDE selection functionality

## [1.1.1] - 2025-01-20

### Fixed

- Use empty file list as default for migrated configs

## [1.1.0] - 2025-01-19

### Added

- Force deletion for worktrees with uncommitted changes
- Recursive file discovery for file selector
- Show help when no arguments provided
- New error types for config system

### Changed

- Updated config command to support new config system
- Updated create command to use new config system

## [1.0.0] - 2025-01-18

### Added

- Initial release
- Interactive worktree creation with branch selection
- List all worktrees in table format
- Delete worktrees interactively or by name/path
- Configurable editor integration (VS Code, Vim, JetBrains IDEs, etc.)
- Per-repository configuration stored in `.gwt/config`
- Configurable file copying to new worktrees

[Unreleased]: https://github.com/ggalmazor/gwt/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/ggalmazor/gwt/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/ggalmazor/gwt/compare/v1.2.4...v1.3.0
[1.2.4]: https://github.com/ggalmazor/gwt/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/ggalmazor/gwt/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/ggalmazor/gwt/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/ggalmazor/gwt/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/ggalmazor/gwt/compare/v1.1.2...v1.2.0
[1.1.2]: https://github.com/ggalmazor/gwt/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/ggalmazor/gwt/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/ggalmazor/gwt/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ggalmazor/gwt/releases/tag/v1.0.0
