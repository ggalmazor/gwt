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

export interface BranchList {
  local: string[];
  remote: string[];
}

/**
 * List all local and remote branches.
 * @returns object containing local and remote branch arrays
 */
export async function listBranches(): Promise<BranchList> {
  // Get local branches
  const localCmd = new Deno.Command('git', {
    args: ['branch', '--list', '--format=%(refname:short)'],
    stdout: 'piped',
    stderr: 'piped',
  });

  const localOutput = await localCmd.output();
  const local: string[] = [];

  if (localOutput.success) {
    const stdout = new TextDecoder().decode(localOutput.stdout);
    local.push(
      ...stdout
        .trim()
        .split('\n')
        .filter((line) => line.length > 0)
    );
  }

  // Get remote branches
  const remoteCmd = new Deno.Command('git', {
    args: ['branch', '-r', '--format=%(refname:short)'],
    stdout: 'piped',
    stderr: 'piped',
  });

  const remoteOutput = await remoteCmd.output();
  const remote: string[] = [];

  if (remoteOutput.success) {
    const stdout = new TextDecoder().decode(remoteOutput.stdout);
    remote.push(
      ...stdout
        .trim()
        .split('\n')
        .filter((line) => line.length > 0)
        // Filter out HEAD references like "origin/HEAD -> origin/main"
        .filter((line) => !line.includes('HEAD'))
    );
  }

  return { local, remote };
}
