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

export interface FileEntry {
  name: string;
  isDirectory: boolean;
}

/**
 * Discovers all files and directories in a given path (non-recursive, depth 1).
 * Includes hidden files but excludes .git directory.
 * Returns entries sorted alphabetically (case-insensitive).
 *
 * @param path - The directory path to scan
 * @returns Array of file entries with name and type information
 */
export async function discoverFiles(path: string): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];

  try {
    for await (const entry of Deno.readDir(path)) {
      // Filter out .git directory
      if (entry.name === '.git') {
        continue;
      }

      entries.push({
        name: entry.name,
        isDirectory: entry.isDirectory,
      });
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return [];
    }
    throw error;
  }

  // Sort alphabetically (case-insensitive)
  entries.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  return entries;
}
