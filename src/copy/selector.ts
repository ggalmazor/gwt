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

export interface FileEntry {
  name: string;
  isDirectory: boolean;
}

/**
 * Discovers all files and directories in a given path recursively.
 * Includes hidden files but excludes .git directory.
 * Returns entries with relative paths sorted alphabetically (case-insensitive).
 *
 * @param path - The directory path to scan
 * @returns Array of file entries with relative paths and type information
 */
export async function discoverFiles(path: string): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];

  try {
    await walkDirectory(path, path, entries);
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

/**
 * Recursively walks a directory tree and collects file entries.
 *
 * @param rootPath - The root directory path (for building relative paths)
 * @param currentPath - The current directory being scanned
 * @param entries - Array to collect file entries
 */
async function walkDirectory(
  rootPath: string,
  currentPath: string,
  entries: FileEntry[]
): Promise<void> {
  for await (const entry of Deno.readDir(currentPath)) {
    // Filter out .git directory
    if (entry.name === '.git') {
      continue;
    }

    // Build relative path
    const relativePath = currentPath === rootPath
      ? entry.name
      : `${currentPath.substring(rootPath.length + 1)}/${entry.name}`;

    entries.push({
      name: relativePath,
      isDirectory: entry.isDirectory,
    });

    // Recurse into subdirectories
    if (entry.isDirectory) {
      const subPath = `${currentPath}/${entry.name}`;
      await walkDirectory(rootPath, subPath, entries);
    }
  }
}

/**
 * Select files to copy (non-interactive version for testing).
 * Filters selections to only include files that exist in the available list.
 *
 * @param availableFiles - List of available files from discoverFiles()
 * @param selections - Array of file names to select
 * @returns Array of selected file names that exist in availableFiles
 */
export async function selectFilesToCopyNonInteractive(
  availableFiles: FileEntry[],
  selections: string[]
): Promise<string[]> {
  const availableNames = availableFiles.map(f => f.name);

  // Filter to only include valid selections
  return selections.filter(name => availableNames.includes(name));
}

/**
 * Select files to copy interactively using a checkbox prompt.
 * Shows all files with icons indicating type (file/directory).
 * Supports fuzzy search to quickly find files.
 *
 * @param availableFiles - List of available files from discoverFiles()
 * @returns Array of selected file names
 */
export async function selectFilesToCopy(availableFiles: FileEntry[]): Promise<string[]> {
  if (availableFiles.length === 0) {
    console.log('No files found in repository root.');
    return [];
  }

  const selected = await Checkbox.prompt({
    message: 'Select files/directories to copy (space to toggle, enter to confirm):',
    options: availableFiles.map(f => ({
      name: f.isDirectory ? `📁 ${f.name}` : `📄 ${f.name}`,
      value: f.name,
    })),
    search: true,
    hint: 'Type to search, space to select/deselect, enter to confirm',
  });

  return selected as string[];
}
