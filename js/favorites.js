import { updateSong } from './indexeddb.js';

export function filterFavorites(songs) {
  return songs.filter((song) => song.favorite);
}

export async function toggleFavorite(database, song) {
  const previousValue = Boolean(song.favorite);
  song.favorite = !previousValue;

  try {
    await updateSong(database, song);
    return song.favorite;
  } catch (error) {
    song.favorite = previousValue;
    throw error;
  }
}
