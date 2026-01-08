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
    artistsText: artistsArr.map((a) => a?.name).filter(Boolean).join(", "),
    artistIds: artistsArr.map((a) => a?.id).filter(Boolean),
    album: t?.album?.name || "",
    albumId: t?.album?.id || "",
    duration_ms: t?.duration_ms ?? null,
    imageUrl,
  };
}

function uniqByUri(tracks) {
  const seen = new Set();
  const out = [];
  for (const t of tracks) {
    if (!t?.uri || seen.has(t.uri)) continue;
    seen.add(t.uri);
    out.push(t);
  }
  return out;
}

// deterministic-ish hash so mood/intent combos differ but stay stable
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickByHash(arr, key, count) {
  if (!arr?.length) return [];
  const h = hashString(key);
  const start = h % arr.length;
  const out = [];
  for (let i = 0; i < arr.length && out.length < count; i++) {
    out.push(arr[(start + i) % arr.length]);
  }
  return out;
}

export async function generatePlaylist({
  mood = "neutral",
  intent = "go-with-flow",
  limit = 15,
} = {}) {
  const targets = unwrapTargets(mood, intent);

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

  // if user is brand new / no history: fallback to recommendations from top artists only
  const topArtistIds = topArtists.map((a) => a?.id).filter(Boolean);

  const allowedArtistIds = new Set(tastePool.flatMap((t) => t.artistIds || []));
  const allowedAlbumIds = new Set(tastePool.map((t) => t.albumId).filter(Boolean));

  // 2) Choose DIFFERENT seeds per mood/intent
  const seedKey = `${mood}::${intent}`;

  const seedTracksPicked = pickByHash(tastePool.filter((t) => t.id), seedKey, 5);
  const seedTrackIds = seedTracksPicked.map((t) => t.id).filter(Boolean);

  const seedArtistIds = pickByHash(topArtistIds, seedKey + "::artists", 5);

  // 3) Start list from tastePool but different slice per mood/intent
  const baseTasteSlice = pickByHash(
    tastePool,
    seedKey + "::base",
    Math.min(8, Number(limit) || 15)
  );

  let result = [...baseTasteSlice];

  // 4) Recommendations as filler (mood/intent changes this)
  let recTracks = [];
  try {
    const rec = await spotify.getRecommendations({
      seed_tracks: seedTrackIds.slice(0, 5),
      seed_artists: seedArtistIds.slice(0, 5),
      limit: 60,
      ...targets,
    });

    recTracks = (rec?.tracks || []).map(toTrackObj);
  } catch (e) {
    console.warn("Recommendations failed:", e?.message || e);
  }

  // 5) Strict filter: only your artists OR your albums (keeps taste)
  const strict = recTracks.filter((t) => {
    const artistMatch = (t.artistIds || []).some((id) => allowedArtistIds.has(id));
    const albumMatch = t.albumId && allowedAlbumIds.has(t.albumId);
    return artistMatch || albumMatch;
  });

  result = uniqByUri([...result, ...strict]).slice(0, limit);

  // 6) Relax: allow anything from your top artists (still taste-ish)
  if (result.length < limit) {
    const topArtistSet = new Set(topArtistIds);
    const relaxed = recTracks.filter((t) => (t.artistIds || []).some((id) => topArtistSet.has(id)));
    result = uniqByUri([...result, ...relaxed]).slice(0, limit);
  }

  // 7) Final fallback: fill from tastePool (ensures always limit)
  if (result.length < limit) {
    result = uniqByUri([...result, ...tastePool]).slice(0, limit);
  }

  const name = `MoodTunes — ${titleCase(mood)} / ${intent.replace(/-/g, " ")}`;
  const description = `Generated from your listening history + mood intent (${mood}, ${intent}).`;

  // ✅ Return the exact shape the styled UI needs:
  return {
    name,
    description,
    tracks: result.slice(0, limit).map((t) => ({
      uri: t.uri,
      name: t.name,
      artists: t.artistsText,     // string is OK
      duration_ms: t.duration_ms, // for 3:15
      imageUrl: t.imageUrl,       // for album cover
      album: t.album,
    })),
  };
}
