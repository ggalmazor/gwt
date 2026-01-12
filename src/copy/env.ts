import { join } from '@std/path';
import { copy } from '@std/fs';

/**
 * Copy all .env* files from source to destination.
 * Only copies root-level .env* files (depth 1).
 * @param fromPath - the source path (repository root)
 * @param toPath - the destination path (new worktree root)
 */
export async function copyEnvFiles(fromPath: string, toPath: string): Promise<void> {
  // Read all entries in the source directory
  try {
    for await (const entry of Deno.readDir(fromPath)) {
      // Only process files (not directories) that start with .env
      if (entry.isFile && entry.name.startsWith('.env')) {
        const sourcePath = join(fromPath, entry.name);
        const destPath = join(toPath, entry.name);

        // Copy the file
        await copy(sourcePath, destPath, { overwrite: true });
      }
    }
  } catch (error) {
    // If directory doesn't exist or can't be read, silently skip
    if (error instanceof Deno.errors.NotFound) {
      return;
    }
    throw error;
  }
}
