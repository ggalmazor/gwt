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

import { compareVersions, displayUpdateNotification, fetchLatestVersion } from '../utils/version-checker.ts';
import { VERSION } from '../version.ts';

/**
 * Core upgrade check logic, injectable for testing.
 */
export async function upgradeCommandWithVersions(
  currentVersion: string,
  latestVersion: string,
  print: (line: string) => void = console.log,
): Promise<void> {
  const comparison = compareVersions(currentVersion, latestVersion);

  if (comparison === 1) {
    displayUpdateNotification({ currentVersion, latestVersion, updateAvailable: true }, print);
  } else {
    print(`gwt ${currentVersion} is up to date`);
  }
}

/**
 * Check for a newer version and print the result.
 */
export async function upgradeCommand(): Promise<void> {
  const latestVersion = await fetchLatestVersion();

  if (!latestVersion) {
    console.error('Error: Could not reach GitHub to check for updates');
    Deno.exit(1);
  }

  await upgradeCommandWithVersions(VERSION, latestVersion);
}
