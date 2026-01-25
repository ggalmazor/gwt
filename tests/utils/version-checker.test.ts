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

import { assertEquals } from '@std/assert';
import {
  compareVersions,
  needsUpdateCheck,
  shouldCheckForUpdates,
} from '../../src/utils/version-checker.ts';

Deno.test('compareVersions returns 1 when remote is newer', () => {
  assertEquals(compareVersions('1.0.0', '1.1.0'), 1);
  assertEquals(compareVersions('1.1.0', '1.2.0'), 1);
  assertEquals(compareVersions('1.1.0', '2.0.0'), 1);
  assertEquals(compareVersions('1.1.9', '1.2.0'), 1);
});

Deno.test('compareVersions returns 0 when versions are equal', () => {
  assertEquals(compareVersions('1.0.0', '1.0.0'), 0);
  assertEquals(compareVersions('1.2.3', '1.2.3'), 0);
});

Deno.test('compareVersions returns -1 when remote is older', () => {
  assertEquals(compareVersions('1.1.0', '1.0.0'), -1);
  assertEquals(compareVersions('2.0.0', '1.9.9'), -1);
});

Deno.test('needsUpdateCheck returns true for non-existent config file', async () => {
  const nonExistentPath = '/tmp/non-existent-config-file';
  const result = await needsUpdateCheck(nonExistentPath);
  assertEquals(result, true);
});

Deno.test('needsUpdateCheck returns true for config older than 1 day', async () => {
  const tempFile = await Deno.makeTempFile();

  try {
    // Set mtime to 2 days ago
    const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
    await Deno.utime(tempFile, twoDaysAgo / 1000, twoDaysAgo / 1000);

    const result = await needsUpdateCheck(tempFile);
    assertEquals(result, true);
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test('needsUpdateCheck returns false for recently updated config', async () => {
  const tempFile = await Deno.makeTempFile();

  try {
    // Touch file (set mtime to now)
    await Deno.utime(tempFile, new Date(), new Date());

    const result = await needsUpdateCheck(tempFile);
    assertEquals(result, false);
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test('shouldCheckForUpdates returns false when config disables it', () => {
  const config = {
    version: '2.0',
    editor: { type: 'none' as const },
    filesToCopy: [],
    checkForUpdates: false,
  };
  assertEquals(shouldCheckForUpdates(config), false);
});

Deno.test('shouldCheckForUpdates returns true when config enables it', () => {
  const config = {
    version: '2.0',
    editor: { type: 'none' as const },
    filesToCopy: [],
    checkForUpdates: true,
  };
  assertEquals(shouldCheckForUpdates(config), true);
});

Deno.test('shouldCheckForUpdates returns true when config has no setting (default)', () => {
  const config = { version: '2.0', editor: { type: 'none' as const }, filesToCopy: [] };
  assertEquals(shouldCheckForUpdates(config), true);
});
