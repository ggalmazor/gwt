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

import { exists } from '@std/fs';
import type { Config } from '../config/types.ts';

const GITHUB_API_URL = 'https://api.github.com/repos/ggalmazor/gwt/releases/latest';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
}

/**
 * Compare two semantic versions.
 * @returns 1 if remote is newer, 0 if equal, -1 if remote is older
 */
export function compareVersions(current: string, remote: string): number {
  const parseCurrent = current.replace(/^v/, '').split('.').map(Number);
  const parseRemote = remote.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const c = parseCurrent[i] || 0;
    const r = parseRemote[i] || 0;

    if (r > c) return 1;
    if (r < c) return -1;
  }

  return 0;
}

/**
 * Check if an update check is needed based on file modification time.
 * Returns true if the file doesn't exist or was modified more than 1 day ago.
 */
export async function needsUpdateCheck(configPath: string): Promise<boolean> {
  try {
    if (!(await exists(configPath))) {
      return true;
    }

    const stat = await Deno.stat(configPath);
    const mtime = stat.mtime?.getTime() || 0;
    const now = Date.now();
    const daysSinceUpdate = (now - mtime) / ONE_DAY_MS;

    return daysSinceUpdate >= 1;
  } catch {
    return true;
  }
}

/**
 * Check if update checking is enabled in config.
 * Defaults to true if not specified.
 */
export function shouldCheckForUpdates(config: Config): boolean {
  return config.checkForUpdates !== false;
}

/**
 * Fetch the latest version from GitHub releases.
 */
export async function fetchLatestVersion(): Promise<string | null> {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        'User-Agent': 'gwt-cli',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.tag_name || null;
  } catch {
    return null;
  }
}

/**
 * Check for updates and return update info.
 */
export async function checkForUpdates(currentVersion: string): Promise<UpdateInfo | null> {
  const latestVersion = await fetchLatestVersion();

  if (!latestVersion) {
    return null;
  }

  const comparison = compareVersions(currentVersion, latestVersion);

  return {
    currentVersion,
    latestVersion,
    updateAvailable: comparison === 1,
  };
}

/**
 * Display update notification if an update is available.
 */
export function displayUpdateNotification(updateInfo: UpdateInfo): void {
  if (!updateInfo.updateAvailable) {
    return;
  }

  const current = updateInfo.currentVersion;
  const latest = updateInfo.latestVersion;
  const versionLine = `  Update available: ${current} → ${latest}`;
  const versionPad = ' '.repeat(Math.max(0, 85 - versionLine.length));
  console.log('');
  console.log('\x1b[33m┌─────────────────────────────────────────────────────────────────────────────────────┐\x1b[0m');
  console.log('\x1b[33m│\x1b[0m                                                                                     \x1b[33m│\x1b[0m');
  console.log(`\x1b[33m│\x1b[0m  \x1b[1mUpdate available:\x1b[0m ${current} → ${latest}${versionPad}\x1b[33m│\x1b[0m`);
  console.log('\x1b[33m│\x1b[0m                                                                                     \x1b[33m│\x1b[0m');
  console.log('\x1b[33m│\x1b[0m  To update, run:                                                                    \x1b[33m│\x1b[0m');
  console.log('\x1b[33m│\x1b[0m    \x1b[36mcurl -fsSL https://raw.githubusercontent.com/ggalmazor/gwt/main/install.sh | bash\x1b[0m\x1b[33m│\x1b[0m');
  console.log('\x1b[33m│\x1b[0m                                                                                     \x1b[33m│\x1b[0m');
  console.log('\x1b[33m└─────────────────────────────────────────────────────────────────────────────────────┘\x1b[0m');
  console.log('');
}

/**
 * Touch a file to update its modification time.
 */
export async function touchFile(filePath: string): Promise<void> {
  try {
    await Deno.utime(filePath, new Date(), new Date());
  } catch {
    // Ignore errors
  }
}
