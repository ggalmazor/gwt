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

import { Select } from '@cliffy/prompt';
import { IDE_COMMANDS, IDE_NAMES, type IdeCommand } from './types.ts';
import { IdeNotFoundError } from '../utils/errors.ts';

/**
 * Check if an IDE command is available in the PATH.
 * @param command - the IDE command to check
 * @returns true if the command exists, false otherwise
 */
async function isIdeAvailable(command: string): Promise<boolean> {
  try {
    const cmd = new Deno.Command('which', {
      args: [command],
      stdout: 'null',
      stderr: 'null',
    });
    const output = await cmd.output();
    return output.success;
  } catch {
    return false;
  }
}

/**
 * Detect which JetBrains IDEs are available in the PATH.
 * @returns array of available IDE command names
 */
export async function detectAvailableIDEs(): Promise<IdeCommand[]> {
  const available: IdeCommand[] = [];

  for (const [key, command] of Object.entries(IDE_COMMANDS)) {
    if (await isIdeAvailable(command)) {
      available.push(key as IdeCommand);
    }
  }

  return available;
}

/**
 * Prompt the user to select an IDE from available options.
 * @returns the selected IDE command name
 */
export async function promptForIDE(): Promise<IdeCommand> {
  const available = await detectAvailableIDEs();

  if (available.length === 0) {
    throw new IdeNotFoundError('No JetBrains IDEs found in PATH');
  }

  if (available.length === 1) {
    // Only one IDE available, use it without prompting
    return available[0];
  }

  const selection = await Select.prompt({
    message: 'Select JetBrains IDE to use:',
    options: available.map((ide) => ({
      name: IDE_NAMES[ide],
      value: ide,
    })),
  });

  return selection as IdeCommand;
}

/**
 * Launch a JetBrains IDE at the specified path.
 * @param ide - the IDE command name
 * @param path - the path to open in the IDE
 */
export async function launchIDE(ide: string, path: string): Promise<void> {
  // Verify IDE command exists
  if (!(await isIdeAvailable(ide))) {
    throw new IdeNotFoundError(ide);
  }

  // Use shell to properly background the process
  // This ensures the IDE continues running after gwt exits
  const cmd = new Deno.Command('sh', {
    args: ['-c', `${ide} "${path}" > /dev/null 2>&1 &`],
    stdout: 'null',
    stderr: 'null',
    stdin: 'null',
  });

  // Execute the command (it will background itself via &)
  await cmd.output();

  // Small delay to ensure the process has started
  await new Promise((resolve) => setTimeout(resolve, 200));
}
