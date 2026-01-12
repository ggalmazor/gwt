/**
 * gwt - Git Worktree Manager
 * Copyright (C) 2026 Guillermo G. Almazor <guille@ggalmazor.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

export class GwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotInGitRepoError extends GwtError {
  constructor() {
    super('Not in a git repository');
  }
}

export class WorktreeExistsError extends GwtError {
  constructor(path: string) {
    super(`Worktree already exists at: ${path}`);
  }
}

export class WorktreeNotFoundError extends GwtError {
  constructor(target: string) {
    super(`Worktree not found: ${target}`);
  }
}

export class IdeNotFoundError extends GwtError {
  constructor(ide: string) {
    super(`IDE command not found: ${ide}`);
  }
}

export class InvalidConfigVersionError extends GwtError {
  constructor(version: string) {
    super(`Unsupported config version: ${version}`);
  }
}

export class EditorNotFoundError extends GwtError {
  constructor(command: string) {
    super(`Editor command not found: ${command}. Install it or run 'gwt config setup'`);
  }
}

export class InvalidFilePatternError extends GwtError {
  constructor(pattern: string) {
    super(`Invalid file pattern: ${pattern}`);
  }
}
