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

/**
 * Check if the current directory is inside a git repository.
 * @returns true if inside a git repository, false otherwise
 */
export async function isGitRepo(): Promise<boolean> {
  try {
    const cmd = new Deno.Command('git', {
      args: ['rev-parse', '--git-dir'],
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
 * Get the absolute path to the root of the git repository.
 * @returns the absolute path to the repository root
 * @throws Error if not in a git repository
 */
export async function getRepoRoot(): Promise<string> {
  try {
    const cmd = new Deno.Command('git', {
      args: ['rev-parse', '--show-toplevel'],
      stdout: 'piped',
      stderr: 'piped',
    });
    const output = await cmd.output();

    if (!output.success) {
      throw new Error('Not in a git repository');
    }

    const path = new TextDecoder().decode(output.stdout).trim();
    return path;
  } catch (error) {
    if (error instanceof Error && error.message === 'Not in a git repository') {
      throw error;
    }
    throw new Error('Not in a git repository');
  }
}
