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

// Version 1.0 config (for backward compatibility and migration)
export interface ConfigV1 {
  version: string;
  ide: string;
}

// Version 2.0 config types
export type EditorType = 'custom' | 'none';

export interface EditorConfig {
  type: EditorType;
  command?: string; // For custom: command/path (e.g., 'idea', 'code', '/usr/bin/vim')
}

export interface Config {
  version: string;
  editor: EditorConfig;
  filesToCopy: string[]; // File/directory names or glob patterns
  checkForUpdates?: boolean; // Whether to check for updates (default: true)
}
