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

export interface Worktree {
  path: string;
  commit: string;
  branch: string;
}

/**
 * Parse the output of `git worktree list --porcelain`.
 * Format:
 * worktree /path/to/worktree
 * HEAD <commit-sha>
 * branch refs/heads/<branch-name>
 * (blank line)
 */
function parseWorktreeList(output: string): Worktree[] {
  const worktrees: Worktree[] = [];
  const entries = output.trim().split('\n\n');

  for (const entry of entries) {
    const lines = entry.split('\n');
    let path = '';
    let commit = '';
    let branch = '';

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        path = line.substring('worktree '.length);
      } else if (line.startsWith('HEAD ')) {
        commit = line.substring('HEAD '.length);
      } else if (line.startsWith('branch ')) {
        const branchRef = line.substring('branch '.length);
        // Extract branch name from refs/heads/<branch-name>
        branch = branchRef.replace('refs/heads/', '');
      }
    }

    if (path && commit && branch) {
      worktrees.push({ path, commit, branch });
    }
  }

  return worktrees;
}

/**
 * List all git worktrees.
 * @returns array of worktrees
 */
export async function listWorktrees(): Promise<Worktree[]> {
  const cmd = new Deno.Command('git', {
    args: ['worktree', 'list', '--porcelain'],
    stdout: 'piped',
    stderr: 'piped',
  });

  const output = await cmd.output();

  if (!output.success) {
    throw new Error('Failed to list worktrees');
  }

  const stdout = new TextDecoder().decode(output.stdout);
  return parseWorktreeList(stdout);
}

/**
 * Add a new worktree.
 * @param path - the path where the worktree will be created
 * @param branch - the branch to checkout in the worktree
 * @param newBranch - optional name for a new branch to create
 */
export async function addWorktree(
  path: string,
  branch: string,
  newBranch?: string,
): Promise<void> {
  const args = ['worktree', 'add'];

  if (newBranch) {
    args.push('-b', newBranch);
  }

  args.push(path, branch);

  const cmd = new Deno.Command('git', {
    args,
    stdout: 'piped',
    stderr: 'piped',
  });

  const output = await cmd.output();

  if (!output.success) {
    const stderr = new TextDecoder().decode(output.stderr);
    throw new Error(`Failed to create worktree: ${stderr}`);
  }
}

/**
 * Remove a worktree.
 * @param path - the path to the worktree to remove
 */
export async function removeWorktree(path: string): Promise<void> {
  const cmd = new Deno.Command('git', {
    args: ['worktree', 'remove', path],
    stdout: 'piped',
    stderr: 'piped',
  });

  const output = await cmd.output();

  if (!output.success) {
    const stderr = new TextDecoder().decode(output.stderr);
    throw new Error(`Failed to remove worktree: ${stderr}`);
  }
}
