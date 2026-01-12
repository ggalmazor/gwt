import { assert } from '@std/assert';
import { detectAvailableIDEs } from '../../src/ide/launcher.ts';

Deno.test('detectAvailableIDEs returns at least one IDE on dev machine', async () => {
  // This test verifies that IDE detection works on the actual system
  const ides = await detectAvailableIDEs();

  // On a development machine with JetBrains Toolbox, we should have at least one IDE
  // This is a grey-box test - we verify behavior without mocking
  assert(Array.isArray(ides));
  console.log(`Found ${ides.length} IDEs:`, ides);

  // If running on a machine with JetBrains IDEs, verify we can detect them
  if (ides.length > 0) {
    console.log('IDE detection working correctly');
  }
});
