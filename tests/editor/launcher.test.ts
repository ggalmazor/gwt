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

import { assertRejects } from '@std/assert';
import { launchEditor } from '../../src/editor/launcher.ts';
import type { EditorConfig } from '../../src/config/types.ts';

Deno.test('launchEditor skips when type is none', async () => {
  const config: EditorConfig = { type: 'none' };

  // Should not throw - just skip silently
  await launchEditor(config, '/tmp/test-path');
});

Deno.test('launchEditor throws when command not found', async () => {
  const config: EditorConfig = {
    type: 'custom',
    command: 'nonexistent-editor-12345',
  };

  await assertRejects(
    () => launchEditor(config, '/tmp/test-path'),
    Error,
    'not found',
  );
});

Deno.test('launchEditor throws when custom command not found', async () => {
  const config: EditorConfig = {
    type: 'custom',
    command: 'nonexistent-ide',
  };

  await assertRejects(
    () => launchEditor(config, '/tmp/test-path'),
    Error,
    'not found',
  );
});

// Note: Testing actual editor launches is difficult without mocking
// Manual testing required for:
// - Custom command launch with path
