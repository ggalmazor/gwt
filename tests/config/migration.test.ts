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
import { migrateConfig } from '../../src/config/migration.ts';
import type { Config, ConfigV1 } from '../../src/config/types.ts';

Deno.test('migrateConfig converts v1.0 config to v2.0 with empty file list', () => {
  const v1Config: ConfigV1 = {
    version: '1.0',
    ide: 'idea',
  };

  const result = migrateConfig(v1Config);

  assertEquals(result.version, '2.0');
  assertEquals(result.editor.type, 'custom');
  assertEquals(result.editor.command, 'idea');
  assertEquals(result.filesToCopy, []);
});

Deno.test('migrateConfig handles missing version field (assumes v1.0)', () => {
  const v1Config = {
    ide: 'rubymine',
  } as ConfigV1;

  const result = migrateConfig(v1Config);

  assertEquals(result.version, '2.0');
  assertEquals(result.editor.type, 'custom');
  assertEquals(result.editor.command, 'rubymine');
  assertEquals(result.filesToCopy, []);
});

Deno.test('migrateConfig returns v2.0 config unchanged', () => {
  const v2Config: Config = {
    version: '2.0',
    editor: {
      type: 'custom',
      command: 'code',
    },
    filesToCopy: ['.vscode', '.env'],
  };

  const result = migrateConfig(v2Config);

  assertEquals(result, v2Config);
});

Deno.test('migrateConfig handles different IDE commands', () => {
  const ides = ['idea', 'rubymine', 'goland', 'webstorm', 'pycharm', 'phpstorm', 'clion', 'rider'];

  for (const ide of ides) {
    const v1Config: ConfigV1 = {
      version: '1.0',
      ide,
    };

    const result = migrateConfig(v1Config);

    assertEquals(result.editor.type, 'custom');
    assertEquals(result.editor.command, ide);
  }
});
