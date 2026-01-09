// logic/generator.js
import { getTargets } from "../data/mapping.js";
import { spotify } from "../spotify/spotify.adapter.js";

function titleCase(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

// supports both mapping styles:
// - getTargets() returns targets object
// - OR returns { targets, ...meta }
function unwrapTargets(mood, intent) {
  const res = getTargets(mood, intent);
  if (res && typeof res === "object" && res.targets) return res.targets;
  return res || {};
}

function toTrackObj(t) {
  const artistsArr = Array.isArray(t?.artists) ? t.artists : [];
  const imageUrl =
    t?.album?.images?.[0]?.url ||
    t?.album?.images?.[1]?.url ||
    t?.album?.images?.[2]?.url ||
    "";

  return {
    id: t?.id,
    uri: t?.uri,
    name: t?.name || "",
    artistsText: artistsArr
      .map((a) => a?.name)
      .filter(Boolean)
      .join(", "),
    artistIds: artistsArr.map((a) => a?.id).filter(Boolean),
    album: t?.album?.name || "",
    albumId: t?.album?.id || "",
    duration_ms: t?.duration_ms ?? null,
    imageUrl,
  };
}

function uniqByUri(tracks) {
  const seenUri = new Set();
  const seenName = new Set();
  const out = [];
  for (const t of tracks) {
    if (!t?.uri) continue;
    // Check both URI and name+artist to catch duplicates from different albums
    const nameKey = `${t.name?.toLowerCase()}-${t.artistsText?.toLowerCase()}`;
    if (seenUri.has(t.uri) || seenName.has(nameKey)) continue;
    seenUri.add(t.uri);
    seenName.add(nameKey);
    out.push(t);
  }
  return out;
}

// Shuffle array randomly
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick random items from array
function pickRandom(arr, count) {
  if (!arr?.length) return [];
  return shuffle(arr).slice(0, count);
}

export async function generatePlaylist({
  mood = "neutral",
  intent = "go-with-flow",
  limit = 15,
} = {}) {
  const targets = unwrapTargets(mood, intent);

  console.log("🎵 generatePlaylist called with:", { mood, intent, limit });
  console.log("🎯 Mood targets:", targets);

  // 1) Fetch user taste
  let topTracks = [];
  let recentTracks = [];
  let topArtists = [];

  try {
    const top = await spotify.getTopTracks(30, "medium_term");
    topTracks = (top?.items || []).map(toTrackObj);
  } catch (e) {
    console.warn("getTopTracks failed", e?.message || e);
  }

  try {
    const recent = await spotify.getRecentlyPlayed(30);
    recentTracks = (recent?.items || []).map((x) => toTrackObj(x?.track));
  } catch (e) {
    console.warn("getRecentlyPlayed failed", e?.message || e);
  }

  try {
    const artists = await spotify.getTopArtists(20, "medium_term");
    topArtists = (artists?.items || []).filter(Boolean);
  } catch (e) {
    console.warn("getTopArtists failed", e?.message || e);
  }

  // recent first = more variety
  const tastePool = uniqByUri([...recentTracks, ...topTracks]);
  const topArtistIds = topArtists.map((a) => a?.id).filter(Boolean);

  console.log(
    `📊 Taste pool: ${tastePool.length} tracks, ${topArtistIds.length} top artists`
  );

  // 2) Pick RANDOM seeds (not deterministic) - use only 1-2 to give mood targets more influence
  const seedTracksPicked = pickRandom(
    tastePool.filter((t) => t.id),
    2
  );
  const seedTrackIds = seedTracksPicked.map((t) => t.id).filter(Boolean);
  const seedArtistIds = pickRandom(topArtistIds, 1);

  // 3) Start with NO tracks from taste pool - let recommendations do the work
  let result = [];
  console.log(`📀 Starting fresh (no taste pool tracks)`);

  // 4) Recommendations - use user's TOP TRACKS as seeds + mood audio features
  let recTracks = [];
  try {
    let recParams;

    // Always use user's tracks as seeds - more reliable than genre seeds
    const userSeeds = seedTrackIds.slice(0, 3);

    if (userSeeds.length === 0) {
      console.warn("⚠️ No user seeds available");
    }

    if (intent === "turn-it-up") {
      // HIGH ENERGY params
      recParams = {
        seed_tracks: userSeeds,
        limit: 100,
        min_energy: 0.7,
        min_valence: 0.5,
        target_danceability: 0.8,
        target_tempo: 128,
      };
      console.log("🔥 Using HIGH ENERGY with user seeds:", userSeeds);
    } else if (intent === "take-it-easy") {
      // CHILL params
      recParams = {
        seed_tracks: userSeeds,
        limit: 100,
        max_energy: 0.5,
        max_tempo: 100,
        target_valence: 0.4,
      };
      console.log("😌 Using CHILL with user seeds:", userSeeds);
    } else if (intent === "stay-focused") {
      // FOCUS params
      recParams = {
        seed_tracks: userSeeds,
        limit: 100,
        target_instrumentalness: 0.5,
        max_speechiness: 0.3,
        target_energy: 0.4,
      };
      console.log("🎯 Using FOCUS with user seeds:", userSeeds);
    } else {
      // Default: go-with-flow
      recParams = {
        seed_tracks: userSeeds.slice(0, 2),
        seed_artists: seedArtistIds.slice(0, 1),
        limit: 50,
        ...targets,
      };
    }

    console.log("🎵 Calling getRecommendations with:", recParams);

    const rec = await spotify.getRecommendations(recParams);
    recTracks = (rec?.tracks || []).map(toTrackObj);
    console.log(`✅ Got ${recTracks.length} recommendations`);
  } catch (e) {
    console.warn("❌ Recommendations failed:", e?.message || e);
  }

  // 5) Use recommendations (mood-based)
  result = uniqByUri([...recTracks]).slice(0, limit);
  console.log(`🎵 Got ${result.length} mood-based tracks`);

  // 6) Fallback: search for songs FROM USER'S TOP ARTISTS + intent keywords
  if (result.length < limit) {
    console.log(
      `🔍 Using artist search fallback (recs returned ${result.length})`
    );

    // Get artist names from user's top artists
    const artistNames = topArtists
      .slice(0, 6)
      .map((a) => a?.name)
      .filter(Boolean);
    console.log(`🎤 Searching songs from YOUR artists:`, artistNames);

    // Intent keywords to find the RIGHT vibe
    const intentKeywords = {
      "turn-it-up": ["hype", "party"],
      "take-it-easy": ["chill", "slow"],
      "stay-focused": ["instrumental"],
      "go-with-flow": [""],
    };

    const keywords = intentKeywords[intent] || [""];
    let searchTracks = [];

    // Search for songs by each artist WITH mood keywords
    for (const artist of artistNames) {
      if (searchTracks.length >= limit * 3) break;
      for (const keyword of keywords) {
        try {
          const query = keyword
            ? `artist:"${artist}" ${keyword}`
            : `artist:"${artist}"`;
          console.log(`🔍 Searching: ${query}`);
          const searchResult = await spotify.searchTracks(query, 8);
          const tracks = (searchResult?.tracks?.items || []).map(toTrackObj);
          searchTracks.push(...tracks);
        } catch (e) {
          console.warn(`Search failed for "${artist} ${keyword}":`, e?.message);
        }
      }
    }

    // If not enough, add from taste pool
    if (searchTracks.length < limit) {
      console.log(`📀 Adding from your listening history to fill gaps`);
      searchTracks.push(...shuffle(tastePool));
    }

    result = uniqByUri([...result, ...shuffle(searchTracks)]).slice(0, limit);
    console.log(`🔍 After artist search fallback: ${result.length} tracks`);
  }

  // 7) Final shuffle so order varies each time
  result = shuffle(result);

  const name = `MoodTunes — ${titleCase(mood)} / ${intent.replace(/-/g, " ")}`;
  const description = `Generated from your listening history + mood intent (${mood}, ${intent}).`;

  // ✅ Return the exact shape the styled UI needs:
  return {
    name,
    description,
    tracks: result.slice(0, limit).map((t) => ({
      uri: t.uri,
      name: t.name,
      artists: t.artistsText, // string is OK
      duration_ms: t.duration_ms, // for 3:15
      imageUrl: t.imageUrl, // for album cover
      album: t.album,
    })),
  };
}
