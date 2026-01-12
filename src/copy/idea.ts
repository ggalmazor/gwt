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
