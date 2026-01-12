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

import { exists } from '@std/fs';
import { isAbsolute, resolve } from '@std/path';

/**
 * Checks if an editor command or path is available.
 * Handles both command names (via which) and full/relative paths (via file existence).
 *
 * @param commandOrPath - Command name (e.g., 'code'), full path (e.g., '/usr/bin/code'), or relative path
 * @returns true if the editor is available, false otherwise
 */
export async function isEditorAvailable(commandOrPath: string): Promise<boolean> {
  // Check if it's a path (absolute or relative)
  if (commandOrPath.includes('/') || commandOrPath.includes('\\')) {
    // Resolve relative paths
    const path = isAbsolute(commandOrPath) ? commandOrPath : resolve(commandOrPath);
    return await exists(path);
  }

  // It's a command name - check if it's in PATH using which
  try {
    const cmd = new Deno.Command('which', {
      args: [commandOrPath],
      stdout: 'null',
      stderr: 'null',
    });
    const output = await cmd.output();
    return output.success;
  } catch {
    return false;
  }
}
