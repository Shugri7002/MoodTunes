// logic/generator.js
import { getTargets } from "../data/mapping.js";
import { MOCK_TRACKS } from "../data/mockTracks.js";

// Simple deterministic shuffle so MVP feels consistent per mood+intent
function seededRandom(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    // xorshift
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

function pickTracks({ mood, intent, limit = 20 }) {
  const rand = seededRandom(`${mood}:${intent}`);
  const arr = [...MOCK_TRACKS];

  // Fisher–Yates with seeded rand
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.slice(0, limit);
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generatePlaylist({ mood, intent, limit = 20 }) {
  const targets = getTargets(mood, intent);
  const tracks = pickTracks({ mood, intent, limit });

  const name = `MoodTunes — ${titleCase(mood)} / ${intent}`;
  const description = `Generated playlist for mood="${mood}" and intent="${intent}".`;

  return { name, description, targets, tracks };
}
