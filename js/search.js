export function filterSongs(songs, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [...songs];
  return songs.filter((song) => song.name.toLocaleLowerCase().includes(normalizedQuery));
}