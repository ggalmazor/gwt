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
import { isEditorAvailable } from '../../src/editor/detector.ts';

Deno.test('isEditorAvailable detects command in PATH via which', async () => {
  // Test with a command that should always exist
  const result = await isEditorAvailable('ls');
  assertEquals(result, true);
});

Deno.test('isEditorAvailable returns false for non-existent command', async () => {
  const result = await isEditorAvailable('nonexistent-command-12345');
  assertEquals(result, false);
});

Deno.test('isEditorAvailable validates full paths', async () => {
  // Test with full path to a system binary
  const result = await isEditorAvailable('/bin/ls');
  assertEquals(result, true);
});

Deno.test('isEditorAvailable returns false for non-existent path', async () => {
  const result = await isEditorAvailable('/nonexistent/path/to/editor');
  assertEquals(result, false);
});

Deno.test('isEditorAvailable handles relative paths', async () => {
  // Relative paths should be resolved relative to cwd
  const result = await isEditorAvailable('./nonexistent');
  assertEquals(result, false);
});
