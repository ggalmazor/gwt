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

/**
 * Check if a query string fuzzy matches a target string.
 * Characters in the query must appear in the target in the same order (case-insensitive).
 * @param query - the search query
 * @param target - the string to match against
 * @returns true if query fuzzy matches target
 */
export function fuzzyMatch(query: string, target: string): boolean {
  if (query.length === 0) return true;

  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  let queryIndex = 0;
  let targetIndex = 0;

  while (queryIndex < queryLower.length && targetIndex < targetLower.length) {
    if (queryLower[queryIndex] === targetLower[targetIndex]) {
      queryIndex++;
    }
    targetIndex++;
  }

  return queryIndex === queryLower.length;
}

/**
 * Calculate a score for how well a query matches a target.
 * Higher scores indicate better matches.
 * @param query - the search query
 * @param target - the string to match against
 * @returns score (higher is better), or -1 if no match
 */
function calculateMatchScore(query: string, target: string): number {
  if (!fuzzyMatch(query, target)) return -1;
  if (query.length === 0) return 0;

  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  let score = 0;
  let queryIndex = 0;
  let targetIndex = 0;
  let consecutiveMatches = 0;

  while (queryIndex < queryLower.length && targetIndex < targetLower.length) {
    if (queryLower[queryIndex] === targetLower[targetIndex]) {
      // Bonus for consecutive matches
      consecutiveMatches++;
      score += 1 + consecutiveMatches;

      // Extra bonus for match at start of word
      if (targetIndex === 0 || targetLower[targetIndex - 1] === '/' || targetLower[targetIndex - 1] === '-') {
        score += 10;
      }

      queryIndex++;
    } else {
      consecutiveMatches = 0;
    }
    targetIndex++;
  }

  // Bonus for exact match
  if (targetLower === queryLower) {
    score += 100;
  }

  // Bonus for matching at the start
  if (targetLower.startsWith(queryLower)) {
    score += 50;
  }

  // Penalty for length difference (shorter strings score higher)
  score -= (target.length - query.length) * 0.1;

  return score;
}

/**
 * Fuzzy search through an array of strings.
 * Returns matches sorted by relevance.
 * @param query - the search query
 * @param items - array of strings to search through
 * @returns filtered and sorted array of matches
 */
export function fuzzySearch(query: string, items: string[]): string[] {
  if (query.length === 0) return items;

  // Calculate scores for all items
  const scoredItems = items
    .map((item) => ({
      item,
      score: calculateMatchScore(query, item),
    }))
    .filter((scored) => scored.score >= 0) // Remove non-matches
    .sort((a, b) => b.score - a.score); // Sort by score descending

  return scoredItems.map((scored) => scored.item);
}
