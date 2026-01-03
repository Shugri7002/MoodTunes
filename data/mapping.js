export const MOODS = ["happy", "chill", "sad", "focus"];
export const INTENTS = ["turn-it-up", "take-it-easy", "stay-focused", "go-with-flow"];

export const MAPPING = {
  happy: {
    "turn-it-up": {
      target_energy: 0.9,
      target_valence: 0.85,
      target_danceability: 0.8,
      target_tempo: 128,
      target_acousticness: 0.15,
      target_instrumentalness: 0.05,
    },
    "take-it-easy": {
      target_energy: 0.55,
      target_valence: 0.75,
      target_danceability: 0.55,
      target_tempo: 105,
      target_acousticness: 0.35,
      target_instrumentalness: 0.1,
    },
    "stay-focused": {
      target_energy: 0.65,
      target_valence: 0.6,
      target_danceability: 0.45,
      target_tempo: 115,
      target_acousticness: 0.25,
      target_instrumentalness: 0.45,
    },
    "go-with-flow": {
      target_energy: 0.7,
      target_valence: 0.7,
      target_danceability: 0.65,
      target_tempo: 118,
      target_acousticness: 0.2,
      target_instrumentalness: 0.2,
    },
  },

  chill: {
    "turn-it-up": {
      target_energy: 0.75,
      target_valence: 0.7,
      target_danceability: 0.75,
      target_tempo: 122,
      target_acousticness: 0.2,
      target_instrumentalness: 0.1,
    },
    "take-it-easy": {
      target_energy: 0.4,
      target_valence: 0.55,
      target_danceability: 0.5,
      target_tempo: 95,
      target_acousticness: 0.5,
      target_instrumentalness: 0.35,
    },
    "stay-focused": {
      target_energy: 0.55,
      target_valence: 0.5,
      target_danceability: 0.4,
      target_tempo: 108,
      target_acousticness: 0.35,
      target_instrumentalness: 0.6,
    },
    "go-with-flow": {
      target_energy: 0.5,
      target_valence: 0.6,
      target_danceability: 0.55,
      target_tempo: 110,
      target_acousticness: 0.4,
      target_instrumentalness: 0.4,
    },
  },

  sad: {
    "turn-it-up": {
      target_energy: 0.7,
      target_valence: 0.45,
      target_danceability: 0.65,
      target_tempo: 120,
      target_acousticness: 0.2,
      target_instrumentalness: 0.1,
    },
    "take-it-easy": {
      target_energy: 0.35,
      target_valence: 0.25,
      target_danceability: 0.35,
      target_tempo: 85,
      target_acousticness: 0.65,
      target_instrumentalness: 0.35,
    },
    "stay-focused": {
      target_energy: 0.5,
      target_valence: 0.35,
      target_danceability: 0.3,
      target_tempo: 100,
      target_acousticness: 0.35,
      target_instrumentalness: 0.7,
    },
    "go-with-flow": {
      target_energy: 0.45,
      target_valence: 0.4,
      target_danceability: 0.45,
      target_tempo: 104,
      target_acousticness: 0.45,
      target_instrumentalness: 0.5,
    },
  },

  focus: {
    "turn-it-up": {
      target_energy: 0.8,
      target_valence: 0.55,
      target_danceability: 0.6,
      target_tempo: 130,
      target_acousticness: 0.15,
      target_instrumentalness: 0.45,
    },
    "take-it-easy": {
      target_energy: 0.45,
      target_valence: 0.45,
      target_danceability: 0.35,
      target_tempo: 96,
      target_acousticness: 0.3,
      target_instrumentalness: 0.75,
    },
    "stay-focused": {
      target_energy: 0.6,
      target_valence: 0.5,
      target_danceability: 0.35,
      target_tempo: 112,
      target_acousticness: 0.25,
      target_instrumentalness: 0.85,
    },
    "go-with-flow": {
      target_energy: 0.55,
      target_valence: 0.55,
      target_danceability: 0.45,
      target_tempo: 118,
      target_acousticness: 0.2,
      target_instrumentalness: 0.7,
    },
  },
};

// Helper: get targets safely
export function getTargets(mood, intent) {
  const targets = MAPPING?.[mood]?.[intent];
  if (!targets) {
    throw new Error(`No mapping found for mood="${mood}" intent="${intent}"`);
  }
  return targets;
}
