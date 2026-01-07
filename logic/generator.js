// logic/generator.js
import { getTargets } from "../data/mapping.js";
import { spotify } from "../spotify/spotify.adapter.js";

function titleCase(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function toTrackObj(t) {
  return {
    id: t?.id,
    uri: t?.uri,
    name: t?.name,
    artistsText: (t?.artists || []).map((a) => a.name).join(", "),
    artistIds: (t?.artists || []).map((a) => a.id).filter(Boolean),
    album: t?.album?.name || "",
    albumId: t?.album?.id || "",
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

// deterministic-ish hash so mood/intent picks differ but stay stable per combo
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

export async function generatePlaylist({ mood = "happy", intent = "go-with-flow", limit = 15 } = {}) {
  const targets = getTargets(mood, intent);

  // 1) Fetch user taste
  let topTracks = [];
  let recentTracks = [];
  let topArtists = [];

  try {
    const top = await spotify.getTopTracks(30, "medium_term");
    topTracks = (top?.items || []).map(toTrackObj);
  } catch {}

  try {
    const recent = await spotify.getRecentlyPlayed(30);
    recentTracks = (recent?.items || []).map((x) => toTrackObj(x.track));
  } catch {}

  try {
    const artists = await spotify.getTopArtists(20, "medium_term");
    topArtists = (artists?.items || []).filter(Boolean);
  } catch {}

  const tastePool = uniqByUri([...recentTracks, ...topTracks]); // recent first = more variety
  const allowedArtistIds = new Set(tastePool.flatMap((t) => t.artistIds || []));
  const allowedAlbumIds = new Set(tastePool.map((t) => t.albumId).filter(Boolean));

  // 2) Choose DIFFERENT seeds per mood/intent
  const seedKey = `${mood}::${intent}`;

  const seedTracksPicked = pickByHash(tastePool.filter(t => t.id), seedKey, 5);
  const seedTrackIds = seedTracksPicked.map((t) => t.id).filter(Boolean);

  const topArtistIds = topArtists.map((a) => a.id).filter(Boolean);
  const seedArtistIds = pickByHash(topArtistIds, seedKey + "::artists", 5);

  // 3) Start list from tastePool, but different slice per mood/intent
  // (this alone already changes playlist per combo)
  const baseTasteSlice = pickByHash(tastePool, seedKey + "::base", Math.min(8, limit));
  let result = [...baseTasteSlice];

  // 4) Recommendations as filler (mood/intent now actually affects this)
  let recTracks = [];
  try {
    const rec = await spotify.getRecommendations({
      seed_tracks: seedTrackIds.slice(0, 5),
      seed_artists: seedArtistIds.slice(0, 5),
      limit: 50,
      ...targets,
    });

    recTracks = (rec?.tracks || []).map(toTrackObj);
  } catch (e) {
    console.warn("Recommendations failed:", e?.message || e);
  }

  // 5) Strict filter first: only your artists OR your albums
  const strict = recTracks.filter((t) => {
    const artistMatch = (t.artistIds || []).some((id) => allowedArtistIds.has(id));
    const albumMatch = t.albumId && allowedAlbumIds.has(t.albumId);
    return artistMatch || albumMatch;
  });

  result = uniqByUri([...result, ...strict]).slice(0, limit);

  // 6) If still not enough, relax a bit: allow tracks from your top artists (not necessarily in tastePool)
  if (result.length < limit) {
    const topArtistSet = new Set(topArtistIds);
    const relaxed = recTracks.filter((t) => (t.artistIds || []).some((id) => topArtistSet.has(id)));
    result = uniqByUri([...result, ...relaxed]).slice(0, limit);
  }

  // 7) Last fallback: fill from tastePool (ensures always limit)
  if (result.length < limit) {
    result = uniqByUri([...result, ...tastePool]).slice(0, limit);
  }

  const name = `MoodTunes — ${titleCase(mood)} / ${intent.replace(/-/g, " ")}`;
  const description = `Generated from your listening history + mood intent (${mood}, ${intent}).`;

  return {
    name,
    description,
    tracks: result.slice(0, limit).map((t) => ({
      uri: t.uri,
      name: t.name,
      artists: t.artistsText,
      album: t.album,
    })),
  };
}
