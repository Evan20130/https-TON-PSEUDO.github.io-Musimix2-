import {
  createPlaylistRecord,
  deletePlaylistRecord,
  getPlaylists as readPlaylists,
  getSongs,
  updatePlaylistRecord
} from './indexeddb.js';

export function getPlaylists(database) {
  return readPlaylists(database);
}

export async function createPlaylist(database, name) {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error('Le nom de la playlist est requis.');

  const playlists = await readPlaylists(database);
  if (playlists.some((playlist) => playlist.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
    throw new Error('Une playlist porte déjà ce nom.');
  }

  return createPlaylistRecord(database, {
    name: normalizedName,
    songIds: [],
    createdAt: Date.now()
  });
}

export async function addSongToPlaylist(database, playlistId, songId) {
  const playlists = await readPlaylists(database);
  const playlist = playlists.find((item) => item.id === Number(playlistId));
  if (!playlist) throw new Error('Cette playlist n’existe plus.');

  const songs = await getSongs(database);
  if (!songs.some((song) => song.id === Number(songId))) {
    throw new Error('Ce morceau n’existe plus dans la bibliothèque.');
  }

  if (!playlist.songIds.includes(Number(songId))) {
    playlist.songIds.push(Number(songId));
    await updatePlaylistRecord(database, playlist);
  }
  return playlist;
}

export async function removeSongFromPlaylist(database, playlistId, songId) {
  const playlists = await readPlaylists(database);
  const playlist = playlists.find((item) => item.id === Number(playlistId));
  if (!playlist) throw new Error('Cette playlist n’existe plus.');

  playlist.songIds = playlist.songIds.filter((id) => id !== Number(songId));
  await updatePlaylistRecord(database, playlist);
  return playlist;
}

export async function getPlaylistSongs(database, playlist) {
  const songs = await getSongs(database);
  const songsById = new Map(songs.map((song) => [song.id, song]));
  return playlist.songIds.map((id) => songsById.get(id)).filter(Boolean);
}

export function deletePlaylist(database, playlistId) {
  return deletePlaylistRecord(database, Number(playlistId));
}
