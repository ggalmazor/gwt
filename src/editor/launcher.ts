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

import type { EditorConfig } from '../config/types.ts';
import { isEditorAvailable } from './detector.ts';

/**
 * Launches an editor based on the configuration.
 * Passes the path as the first argument to the editor command.
 * Backgrounds the process so it persists after gwt exits.
 *
 * @param config - Editor configuration (type and command)
 * @param path - Path to open in the editor
 */
export async function launchEditor(config: EditorConfig, path: string): Promise<void> {
  // Skip if type is 'none'
  if (config.type === 'none') {
    return;
  }

  // Validate that command is provided
  if (!config.command) {
    throw new Error(`Editor command is required for type '${config.type}'`);
  }

  // Check if editor is available
  if (!(await isEditorAvailable(config.command))) {
    throw new Error(`Editor not found: ${config.command}`);
  }

  // Launch the editor with path as argument, backgrounded
  const cmd = new Deno.Command('sh', {
    args: ['-c', `${config.command} "${path}" > /dev/null 2>&1 &`],
    stdout: 'null',
    stderr: 'null',
    stdin: 'null',
  });

  await cmd.output();

  // Small delay to ensure the process has started
  await new Promise(resolve => setTimeout(resolve, 200));
}
