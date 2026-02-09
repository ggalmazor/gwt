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

import { Checkbox } from '@cliffy/prompt';
import { basename, dirname, join } from '@std/path';
import { exists } from '@std/fs';
import { getRepoRoot, isGitRepo } from '../git/repo.ts';
import { listWorktrees } from '../git/worktree.ts';
import { NotInGitRepoError } from '../utils/errors.ts';

/**
 * Find potential orphaned worktree directories.
 * These are directories in the parent directory that:
 * - Start with the repo name (suggesting they were worktrees)
 * - Are not currently tracked as worktrees by git
 */
async function findOrphanedDirectories(): Promise<string[]> {
  const repoRoot = await getRepoRoot();
  const repoName = basename(repoRoot);
  const parentDir = dirname(repoRoot);

  // Get list of active worktrees
  const worktrees = await listWorktrees();
  const activeWorktreePaths = new Set(
    worktrees.map((wt) => wt.path),
  );

  // Scan parent directory for potential orphaned directories
  const orphaned: string[] = [];

  try {
    for await (const entry of Deno.readDir(parentDir)) {
      if (!entry.isDirectory) continue;

      const fullPath = join(parentDir, entry.name);

      // Skip if it's the main repo
      if (fullPath === repoRoot) continue;

      // Check if it starts with repo name (common worktree naming pattern)
      if (!entry.name.startsWith(repoName)) continue;

      // Skip if it's an active worktree
      if (activeWorktreePaths.has(fullPath)) continue;

      // Check if it looks like it was a worktree (has .git file)
      const gitFile = join(fullPath, '.git');
      if (await exists(gitFile)) {
        try {
          const stat = await Deno.stat(gitFile);
          // Worktrees have a .git file (not directory) pointing to the main repo
          if (stat.isFile) {
            orphaned.push(fullPath);
          }
        } catch {
          // Ignore errors
        }
      }
    }
  } catch {
    // If we can't read the parent directory, return empty list
  }

  return orphaned.sort();
}

/**
 * Non-interactive version for testing.
 * Cleans orphaned worktree directories by removing them.
 */
export async function cleanOrphanedWorktreesNonInteractive(
  pathsToClean: string[],
): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  if (pathsToClean.length === 0) {
    return;
  }

  // Get list of active worktrees to avoid deleting them
  const worktrees = await listWorktrees();
  const activeWorktreePaths = new Set(worktrees.map((wt) => wt.path));

  // Resolve real paths and filter out active worktrees from the list
  const pathsToRemove: string[] = [];
  for (const path of pathsToClean) {
    try {
      if (await exists(path)) {
        const realPath = await Deno.realPath(path);
        if (!activeWorktreePaths.has(realPath)) {
          pathsToRemove.push(path);
        }
      }
    } catch {
      // Ignore errors, skip this path
    }
  }

  // Remove the directories
  for (const path of pathsToRemove) {
    try {
      if (await exists(path)) {
        await Deno.remove(path, { recursive: true });
        console.log(`✓ Removed: ${path}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to remove ${path}: ${message}`);
    }
  }
}

/**
 * Interactive command to clean orphaned worktree directories.
 */
/**
 * Find orphaned directories (exported for non-interactive use).
 */
export { findOrphanedDirectories };

export async function cleanCommand(options?: { all?: boolean }): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  // Find orphaned directories
  console.log('Scanning for orphaned worktree directories...');
  const orphaned = await findOrphanedDirectories();

  if (orphaned.length === 0) {
    console.log('No orphaned worktree directories found.');
    return;
  }

  console.log(
    `Found ${orphaned.length} potential orphaned director${orphaned.length === 1 ? 'y' : 'ies'}:\n`,
  );

  if (options?.all) {
    // Non-interactive: clean all orphaned directories
    console.log(`\nRemoving ${orphaned.length} director${orphaned.length === 1 ? 'y' : 'ies'}...`);
    await cleanOrphanedWorktreesNonInteractive(orphaned);
    console.log('\n✓ Cleanup complete');
    return;
  }

  // Prompt user to select which ones to clean
  const selected = await Checkbox.prompt({
    message: 'Select directories to remove (use Space to select, Enter to confirm):',
    options: orphaned.map((path) => ({
      name: path,
      value: path,
    })),
  });

  if (selected.length === 0) {
    console.log('No directories selected.');
    return;
  }

  // Clean the selected directories
  console.log(`\nRemoving ${selected.length} director${selected.length === 1 ? 'y' : 'ies'}...`);
  await cleanOrphanedWorktreesNonInteractive(selected);
  console.log('\n✓ Cleanup complete');
}
