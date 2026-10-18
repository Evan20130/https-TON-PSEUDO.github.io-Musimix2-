const DATABASE_NAME = 'Musimix2DB';
const STORE_NAME = 'songs';

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getSongs(database) {
  return requestResult(database, 'readonly', (store) => store.getAll());
}

export function saveSong(database, song) {
  return requestResult(database, 'readwrite', (store) => store.add(song));
}

export function updateSong(database, song) {
  return requestResult(database, 'readwrite', (store) => store.put(song));
}

function requestResult(database, mode, makeRequest) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = makeRequest(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onabort = () => reject(transaction.error);
  });
}