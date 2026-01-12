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

import type { Config, ConfigV1 } from './types.ts';

/**
 * Migrates a config from any version to the latest version (2.0).
 *
 * @param config - The config object to migrate (v1.0 or v2.0)
 * @returns A v2.0 config object
 */
export function migrateConfig(config: ConfigV1 | Config): Config {
  // Check if it's already v2.0
  if (isV2Config(config)) {
    return config;
  }

  // Migrate from v1.0 to v2.0
  const v1Config = config as ConfigV1;

  return {
    version: '2.0',
    editor: {
      type: 'jetbrains',
      command: v1Config.ide,
    },
    filesToCopy: ['.idea', '.env*'], // Default files for migrated configs
  };
}

/**
 * Type guard to check if a config is v2.0 format.
 */
function isV2Config(config: ConfigV1 | Config): config is Config {
  return 'editor' in config && 'filesToCopy' in config;
}
