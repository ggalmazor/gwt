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

import { join } from '@std/path';
import { ensureDir, exists } from '@std/fs';
import { getRepoRoot, isGitRepo } from '../git/repo.ts';
import type { Config } from './types.ts';

const CONFIG_DIR = '.gwt';
const CONFIG_FILE = 'config';

/**
 * Get the path to the config file.
 * @returns the absolute path to the config file, or null if not in a git repo
 */
async function getConfigPath(): Promise<string | null> {
  if (!(await isGitRepo())) {
    return null;
  }

  const repoRoot = await getRepoRoot();
  return join(repoRoot, CONFIG_DIR, CONFIG_FILE);
}

/**
 * Load the configuration from .gwt/config.
 * @returns the config object, or null if it doesn't exist or not in a git repo
 */
export async function loadConfig(): Promise<Config | null> {
  const configPath = await getConfigPath();

  if (!configPath) {
    return null;
  }

  if (!(await exists(configPath))) {
    return null;
  }

  try {
    const content = await Deno.readTextFile(configPath);
    const config = JSON.parse(content) as Config;
    return config;
  } catch {
    return null;
  }
}

/**
 * Save the configuration to .gwt/config.
 * @param config - the config object to save (only IDE preference for now)
 */
export async function saveConfig(config: { ide: string }): Promise<void> {
  const configPath = await getConfigPath();

  if (!configPath) {
    throw new Error('Not in a git repository');
  }

  const repoRoot = await getRepoRoot();
  const configDir = join(repoRoot, CONFIG_DIR);

  // Ensure .gwt directory exists
  await ensureDir(configDir);

  // Create full config object
  const fullConfig: Config = {
    version: '1.0',
    ide: config.ide,
  };

  // Write config file
  await Deno.writeTextFile(configPath, JSON.stringify(fullConfig, null, 2));
}
