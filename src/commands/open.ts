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

import { Confirm, Select } from '@cliffy/prompt';
import { exists } from '@std/fs';
import { isGitRepo } from '../git/repo.ts';
import { listWorktrees } from '../git/worktree.ts';
import { loadConfig } from '../config/manager.ts';
import { launchEditor } from '../editor/launcher.ts';
import { runConfigWizard } from '../config/wizard.ts';
import { NotInGitRepoError } from '../utils/errors.ts';

export interface OpenCommandOptions {
  /** Skip editor launch. */
  noEditor?: boolean;
  /** Launch editor without prompting (only in interactive flow). */
  openEditor?: boolean;
}

/**
 * Non-interactive version for testing.
 * Opens a worktree by launching the configured editor or outputting a cd command.
 */
export async function openCommandNonInteractive(
  worktreePath: string,
  opts: OpenCommandOptions = {},
): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  // Validate that the path exists and is a worktree
  if (!(await exists(worktreePath))) {
    throw new Error(`Path does not exist: ${worktreePath}`);
  }

  // Resolve real path to handle symlinks (e.g., /var -> /private/var on macOS)
  const realPath = await Deno.realPath(worktreePath);

  const worktrees = await listWorktrees();
  const isValidWorktree = worktrees.some((wt) => wt.path === realPath);

  if (!isValidWorktree) {
    throw new Error(`${worktreePath} is not a valid worktree`);
  }

  // Load configuration
  let config = await loadConfig();

  if (!config) {
    console.log('\nNo configuration found. Running setup wizard...\n');
    await runConfigWizard();
    config = await loadConfig();

    if (!config) {
      throw new Error('Configuration setup failed');
    }
  }

  // Launch editor or output cd command
  if (config.editor.type !== 'none' && !opts.noEditor) {
    const editorName = config.editor.command || 'editor';
    console.log(`Launching ${editorName}...`);
    await launchEditor(config.editor, worktreePath);
    console.log('✓ Editor launched');
  } else {
    console.log(`To navigate to this worktree, run:`);
    console.log(`  cd ${worktreePath}`);
  }
}

/**
 * Prompt the user whether to open the editor, honoring the flags.
 * Returns the resolved `noEditor` value.
 */
async function resolveEditorPrompt(
  editorCommand: string | undefined,
  opts: OpenCommandOptions,
): Promise<boolean> {
  if (opts.noEditor) return true;
  if (opts.openEditor) return false;
  // No TTY -> keep legacy behavior: launch without prompting
  if (!Deno.stdin.isTerminal()) return false;
  const editorName = editorCommand || 'editor';
  const confirmed = await Confirm.prompt({
    message: `Open ${editorName}?`,
    default: true,
  });
  return !confirmed;
}

/**
 * Interactive command to open a worktree.
 */
export async function openCommand(
  target?: string,
  opts: OpenCommandOptions = {},
): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  const config = await loadConfig();
  const editorCommand = config?.editor.command;
  const editorConfigured = config?.editor.type !== undefined && config.editor.type !== 'none';

  const promptAndResolve = async () => {
    if (!editorConfigured) return opts;
    const noEditor = await resolveEditorPrompt(editorCommand, opts);
    return { ...opts, noEditor };
  };

  if (target) {
    // Non-interactive: resolve target by path or branch name
    const worktrees = await listWorktrees();

    // Try resolving as a path first
    let resolvedTarget = target;
    try {
      const stat = await Deno.stat(target);
      if (stat.isDirectory) {
        resolvedTarget = await Deno.realPath(target);
      }
    } catch {
      // Not a path, might be a branch name
    }

    const worktree = worktrees.find((wt) => wt.path === resolvedTarget || wt.branch === target);
    if (worktree) {
      const resolved = await promptAndResolve();
      await openCommandNonInteractive(worktree.path, resolved);
      return;
    }

    throw new Error(`Worktree not found: ${target}`);
  }

  // Interactive flow
  const worktrees = await listWorktrees();

  if (worktrees.length === 0) {
    console.log('No worktrees found.');
    return;
  }

  const options = worktrees.map((wt) => ({
    name: `${wt.branch} (${wt.path})`,
    value: wt.path,
  }));

  const selectedPath = await Select.prompt({
    message: 'Select worktree to open:',
    options,
    search: true,
  });

  const resolved = await promptAndResolve();
  await openCommandNonInteractive(selectedPath, resolved);
}
