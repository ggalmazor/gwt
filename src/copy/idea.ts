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
import { exists } from '@std/fs';
import { copy } from '@std/fs';

/**
 * Copy the .idea directory from source to destination.
 * @param fromPath - the source path (repository root)
 * @param toPath - the destination path (new worktree root)
 */
export async function copyIdeaDir(fromPath: string, toPath: string): Promise<void> {
  const sourceIdeaDir = join(fromPath, '.idea');

  // Check if .idea directory exists in source
  if (!(await exists(sourceIdeaDir))) {
    return; // Nothing to copy
  }

  const destIdeaDir = join(toPath, '.idea');

  // Copy the entire .idea directory
  await copy(sourceIdeaDir, destIdeaDir, { overwrite: true });
}
