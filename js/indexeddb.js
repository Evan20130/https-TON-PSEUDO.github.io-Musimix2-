const DATABASE_NAME = 'Musimix2DB';
const STORE_NAME = 'songs';
const PLAYLIST_STORE_NAME = 'playlists';

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 2);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!database.objectStoreNames.contains(PLAYLIST_STORE_NAME)) {
        database.createObjectStore(PLAYLIST_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getSongs(database) {
  return requestResult(database, STORE_NAME, 'readonly', (store) => store.getAll());
}

export function saveSong(database, song) {
  return requestResult(database, STORE_NAME, 'readwrite', (store) => store.add(song));
}

export function updateSong(database, song) {
  return requestResult(database, STORE_NAME, 'readwrite', (store) => store.put(song));
}

export function getPlaylists(database) {
  return requestResult(database, PLAYLIST_STORE_NAME, 'readonly', (store) => store.getAll());
}

export function createPlaylistRecord(database, playlist) {
  return requestResult(database, PLAYLIST_STORE_NAME, 'readwrite', (store) => store.add(playlist));
}

export function updatePlaylistRecord(database, playlist) {
  return requestResult(database, PLAYLIST_STORE_NAME, 'readwrite', (store) => store.put(playlist));
}

export function deletePlaylistRecord(database, playlistId) {
  return requestResult(database, PLAYLIST_STORE_NAME, 'readwrite', (store) => store.delete(playlistId));
}

function requestResult(database, storeName, mode, makeRequest) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = makeRequest(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onabort = () => reject(transaction.error);
  });
}