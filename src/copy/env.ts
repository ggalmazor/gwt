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
import { copy } from '@std/fs';

/**
 * Copy all .env* files from source to destination.
 * Only copies root-level .env* files (depth 1).
 * Excludes files ending with .example (e.g., .env.example, .env.test.example).
 * @param fromPath - the source path (repository root)
 * @param toPath - the destination path (new worktree root)
 */
export async function copyEnvFiles(fromPath: string, toPath: string): Promise<void> {
  // Read all entries in the source directory
  try {
    for await (const entry of Deno.readDir(fromPath)) {
      // Only process files (not directories) that start with .env
      // Exclude files ending with .example
      if (entry.isFile && entry.name.startsWith('.env') && !entry.name.endsWith('.example')) {
        const sourcePath = join(fromPath, entry.name);
        const destPath = join(toPath, entry.name);

        // Copy the file
        await copy(sourcePath, destPath, { overwrite: true });
      }
    }
  } catch (error) {
    // If directory doesn't exist or can't be read, silently skip
    if (error instanceof Deno.errors.NotFound) {
      return;
    }
    throw error;
  }
}
