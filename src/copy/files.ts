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

import { join } from '@std/path';
import { copy, exists, expandGlob } from '@std/fs';

/**
 * Copies files and directories from source to destination.
 * Supports glob patterns (e.g., '.env*').
 * Skips files/directories that don't exist.
 *
 * @param fromPath - Source directory path
 * @param toPath - Destination directory path
 * @param fileList - Array of file/directory names or glob patterns
 */
export async function copyFiles(
  fromPath: string,
  toPath: string,
  fileList: string[],
): Promise<void> {
  for (const item of fileList) {
    // Check if it's a glob pattern
    if (item.includes('*') || item.includes('?') || item.includes('[')) {
      await copyGlobPattern(fromPath, toPath, item);
    } else {
      await copySingleItem(fromPath, toPath, item);
    }
  }
}

/**
 * Copies a single file or directory.
 */
async function copySingleItem(
  fromPath: string,
  toPath: string,
  name: string,
): Promise<void> {
  const sourcePath = join(fromPath, name);
  const destPath = join(toPath, name);

  // Skip if source doesn't exist
  if (!(await exists(sourcePath))) {
    return;
  }

  try {
    await copy(sourcePath, destPath, { overwrite: true });
  } catch (error) {
    // Silently skip if copy fails (e.g., permission issues)
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Could not copy ${name}: ${message}`);
  }
}

/**
 * Copies all files matching a glob pattern.
 */
async function copyGlobPattern(
  fromPath: string,
  toPath: string,
  pattern: string,
): Promise<void> {
  try {
    for await (
      const entry of expandGlob(pattern, {
        root: fromPath,
        globstar: false, // Only match at current level
      })
    ) {
      // Get the relative name from the source path
      const name = entry.name;
      const destPath = join(toPath, name);

      await copy(entry.path, destPath, { overwrite: true });
    }
  } catch {
    // Silently skip if pattern doesn't match anything
  }
}
