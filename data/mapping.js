// data/mapping.js
// MoodTunes mapping
// - Supports UI dropdown moods/intents
// - Maps them to 4 internal buckets: happy / chill / sad / focus
// - getTargets NEVER throws; always returns fallback.
// - Also returns meta so generator/UI can stay consistent.

export const UI_MOODS = [
  "happy",
  "angry",
  "sad",
  "fearful",
  "disgusted",
  "surprised",
  "neutral",
];

export const UI_INTENTS = [
  "go-with-flow",
  "turn-it-up",
  "take-it-easy",
  "stay-focused",
  "change-the-mood",
];

// Internal buckets
export const CORE_MOODS = ["happy", "chill", "sad", "focus"];
export const CORE_INTENTS = [
  "turn-it-up",
  "take-it-easy",
  "stay-focused",
  "go-with-flow",
];

// -------------------- Core mapping with min/max constraints --------------------
// target_* = preference, min_*/max_* = hard requirements
export const MAPPING = {
  happy: {
    "turn-it-up": {
      target_energy: 0.9,
      target_valence: 0.85,
      target_danceability: 0.8,
      target_tempo: 128,
      min_energy: 0.7, // FORCE high energy
      min_valence: 0.6, // FORCE happy vibes
      min_danceability: 0.6, // FORCE danceable
      max_acousticness: 0.4,
    },
    "take-it-easy": {
      target_energy: 0.55,
      target_valence: 0.75,
      target_danceability: 0.55,
      target_tempo: 105,
      min_valence: 0.5, // Keep it positive
      max_energy: 0.7, // Not too intense
    },
    "stay-focused": {
      target_energy: 0.65,
      target_valence: 0.6,
      target_danceability: 0.45,
      target_tempo: 115,
      min_valence: 0.4,
      max_speechiness: 0.3, // Less vocals for focus
    },
    "go-with-flow": {
      target_energy: 0.7,
      target_valence: 0.7,
      target_danceability: 0.65,
      target_tempo: 118,
      min_valence: 0.5,
    },
  },

  chill: {
    "turn-it-up": {
      target_energy: 0.75,
      target_valence: 0.7,
      target_danceability: 0.75,
      target_tempo: 122,
      min_energy: 0.6,
      min_danceability: 0.5,
    },
    "take-it-easy": {
      target_energy: 0.4,
      target_valence: 0.55,
      target_danceability: 0.5,
      target_tempo: 95,
      max_energy: 0.6, // FORCE relaxed
      min_acousticness: 0.25,
    },
    "stay-focused": {
      target_energy: 0.55,
      target_valence: 0.5,
      target_danceability: 0.4,
      target_tempo: 108,
      min_instrumentalness: 0.3,
      max_speechiness: 0.25,
    },
    "go-with-flow": {
      target_energy: 0.5,
      target_valence: 0.6,
      target_danceability: 0.55,
      target_tempo: 110,
    },
  },

  sad: {
    "turn-it-up": {
      target_energy: 0.7,
      target_valence: 0.45,
      target_danceability: 0.65,
      target_tempo: 120,
      max_valence: 0.6, // Keep melancholic edge
      min_energy: 0.5, // But still energetic
    },
    "take-it-easy": {
      target_energy: 0.35,
      target_valence: 0.25,
      target_danceability: 0.35,
      target_tempo: 85,
      max_energy: 0.5, // FORCE mellow
      max_valence: 0.45, // FORCE sad vibes
      min_acousticness: 0.3,
    },
    "stay-focused": {
      target_energy: 0.5,
      target_valence: 0.35,
      target_danceability: 0.3,
      target_tempo: 100,
      max_valence: 0.5,
      min_instrumentalness: 0.3,
    },
    "go-with-flow": {
      target_energy: 0.45,
      target_valence: 0.4,
      target_danceability: 0.45,
      target_tempo: 104,
      max_valence: 0.55,
    },
  },

  focus: {
    "turn-it-up": {
      target_energy: 0.8,
      target_valence: 0.55,
      target_danceability: 0.6,
      target_tempo: 130,
      min_energy: 0.65,
      min_instrumentalness: 0.2,
      max_speechiness: 0.3,
    },
    "take-it-easy": {
      target_energy: 0.45,
      target_valence: 0.45,
      target_danceability: 0.35,
      target_tempo: 96,
      max_energy: 0.6,
      min_instrumentalness: 0.4,
    },
    "stay-focused": {
      target_energy: 0.6,
      target_valence: 0.5,
      target_danceability: 0.35,
      target_tempo: 112,
      min_instrumentalness: 0.5, // FORCE instrumental
      max_speechiness: 0.2, // Less lyrics
    },
    "go-with-flow": {
      target_energy: 0.55,
      target_valence: 0.55,
      target_danceability: 0.45,
      target_tempo: 118,
      min_instrumentalness: 0.3,
    },
  },
};

// -------------------- UI -> Core normalization --------------------
const MOOD_ALIAS = {
  happy: "happy",
  sad: "sad",

  neutral: "chill",
  fearful: "chill",

  surprised: "happy",

  angry: "focus",
  disgusted: "focus",
};

const INTENT_ALIAS = {
  "go-with-flow": "go-with-flow",
  "turn-it-up": "turn-it-up",
  "take-it-easy": "take-it-easy",
  "stay-focused": "stay-focused",
  // "change-the-mood" will be handled specially by generator (change mood direction)
  "change-the-mood": "go-with-flow",
};

function normalizeMood(mood) {
  const m = String(mood || "")
    .toLowerCase()
    .trim();
  return MOOD_ALIAS[m] || "chill";
}

function normalizeIntent(intent) {
  const i = String(intent || "")
    .toLowerCase()
    .trim();
  return INTENT_ALIAS[i] || "go-with-flow";
}

function genericFallback() {
  return {
    target_energy: 0.55,
    target_valence: 0.55,
    target_danceability: 0.5,
    target_tempo: 110,
    target_acousticness: 0.35,
    target_instrumentalness: 0.35,
  };
}

function fallbackTargets(coreMood) {
  return MAPPING?.[coreMood]?.["go-with-flow"] || genericFallback();
}

/**
 * getTargets(mood, intent)
 * - mood/intent are UI values
 * - returns { targets, coreMood, coreIntent, uiMood, uiIntent, isChangeMood }
 */
export function getTargets(mood, intent) {
  const uiMood = String(mood || "neutral")
    .toLowerCase()
    .trim();
  const uiIntent = String(intent || "go-with-flow")
    .toLowerCase()
    .trim();

  const isChangeMood = uiIntent === "change-the-mood";

  const coreMood = normalizeMood(uiMood);
  const coreIntent = normalizeIntent(uiIntent);

  const targets = MAPPING?.[coreMood]?.[coreIntent];

  if (targets) {
    return { targets, coreMood, coreIntent, uiMood, uiIntent, isChangeMood };
  }

  console.warn(
    `No mapping found for mood="${uiMood}" intent="${uiIntent}" -> fallback`,
    {
      coreMood,
      coreIntent,
    }
  );

  return {
    targets: fallbackTargets(coreMood),
    coreMood,
    coreIntent,
    uiMood,
    uiIntent,
    isChangeMood,
  };
}
