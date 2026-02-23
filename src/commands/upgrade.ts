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

import { compareVersions, fetchLatestVersion } from '../utils/version-checker.ts';
import { VERSION } from '../version.ts';

const INSTALL_CMD =
  'curl -fsSL https://raw.githubusercontent.com/ggalmazor/gwt/main/install.sh | bash';

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
    const current = currentVersion;
    const latest = latestVersion;
    const versionLine = `  Update available: ${current} → ${latest}`;
    const versionPad = ' '.repeat(Math.max(0, 85 - versionLine.length));
    print('');
    print('\x1b[33m┌─────────────────────────────────────────────────────────────────────────────────────┐\x1b[0m');
    print('\x1b[33m│\x1b[0m                                                                                     \x1b[33m│\x1b[0m');
    print(`\x1b[33m│\x1b[0m  \x1b[1mUpdate available:\x1b[0m ${current} → ${latest}${versionPad}\x1b[33m│\x1b[0m`);
    print('\x1b[33m│\x1b[0m                                                                                     \x1b[33m│\x1b[0m');
    print('\x1b[33m│\x1b[0m  To update, run:                                                                    \x1b[33m│\x1b[0m');
    print(`\x1b[33m│\x1b[0m    \x1b[36m${INSTALL_CMD}\x1b[0m\x1b[33m│\x1b[0m`);
    print('\x1b[33m│\x1b[0m                                                                                     \x1b[33m│\x1b[0m');
    print('\x1b[33m└─────────────────────────────────────────────────────────────────────────────────────┘\x1b[0m');
    print('');
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
