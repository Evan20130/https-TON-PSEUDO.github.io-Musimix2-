export function filterSongs(songs, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [...songs];
  return songs.filter((song) => song.name.toLocaleLowerCase().includes(normalizedQuery));
}

export async function searchSpotify(token, query) {
  if (!token?.trim()) throw new Error('Un jeton Spotify est requis.');
  if (!query.trim()) return [];

  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'track');
  url.searchParams.set('limit', '20');

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`La recherche Spotify a échoué (${response.status}).`);
  }

  const data = await response.json();
  return data.tracks?.items ?? [];
}