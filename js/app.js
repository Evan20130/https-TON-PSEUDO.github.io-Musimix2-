import { openDatabase, getSongs, saveSong } from './indexeddb.js';
import { createPlayer } from './player.js';
import { filterSongs } from './search.js';
import { searchDeezer } from '../api/deezer.js';
import { searchJamendo } from '../api/jamendo.js';
import { searchSpotify } from '../api/spotify.js';
import { filterFavorites, toggleFavorite } from './favorites.js';
import {
  addSongToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistSongs,
  getPlaylists,
  removeSongFromPlaylist
} from './playlist.js';
import { loadSettings, saveSettings } from './settings.js';
import { recommendSongs } from './ai.js';
import { registerOfflineSupport } from './offline.js';

const elements = {
  audio: document.querySelector('#audio'),
  video: document.querySelector('#video'),
  currentSong: document.querySelector('#currentSong'),
  fileInput: document.querySelector('#fileInput'),
  importStatus: document.querySelector('#import-status'),
  search: document.querySelector('#search'),
  localSearch: document.querySelector('.search-wrap'),
  songs: document.querySelector('#songs'),
  librarySection: document.querySelector('.library-section'),
  playlistSection: document.querySelector('#playlists-section'),
  playlistForm: document.querySelector('#playlist-form'),
  playlistName: document.querySelector('#playlist-name'),
  playlistList: document.querySelector('#playlist-list'),
  playlistTitle: document.querySelector('#playlist-title'),
  playlistAddForm: document.querySelector('#playlist-add-form'),
  playlistSongSelect: document.querySelector('#playlist-song-select'),
  playlistSongs: document.querySelector('#playlist-songs'),
  playlistStatus: document.querySelector('#playlist-status'),
  discoverySection: document.querySelector('#discovery-section'),
  discoveryForm: document.querySelector('#discovery-form'),
  musicProvider: document.querySelector('#music-provider'),
  discoveryQuery: document.querySelector('#spotify-query'),
  spotifyToken: document.querySelector('#spotify-token'),
  spotifyTokenField: document.querySelector('#spotify-token-field'),
  jamendoClientId: document.querySelector('#jamendo-client-id'),
  jamendoClientField: document.querySelector('#jamendo-client-field'),
  discoveryStatus: document.querySelector('#discovery-status'),
  results: document.querySelector('#results'),
  count: document.querySelector('#song-count'),
  title: document.querySelector('#library-title'),
  collectionLabel: document.querySelector('#collection-label'),
  aiText: document.querySelector('#aiText'),
  aiPanel: document.querySelector('#ai-panel')
};

const player = createPlayer(elements.audio, elements.video, elements.currentSong);
let database;
let songs = [];
let playlists = [];
let activePlaylistId = null;
let currentView = 'home';
let currentMood = '';

function visibleSongs() {
  let result = filterSongs(songs, elements.search.value);
  if (currentView === 'favorites') result = filterFavorites(result);
  if (currentMood) result = recommendSongs(result, currentMood);
  return result;
}

function renderSongs() {
  const displayedSongs = visibleSongs();
  elements.songs.replaceChildren();
  elements.count.textContent = String(displayedSongs.length);

  if (!displayedSongs.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = songs.length
      ? 'Aucun morceau ne correspond à cette sélection.'
      : 'Ta bibliothèque est vide. Ajoute tes premiers MP3 pour commencer.';
    elements.songs.append(empty);
    return;
  }

  for (const song of displayedSongs) {
    const row = document.createElement('article');
    row.className = 'track';
    const info = document.createElement('div');
    info.className = 'track-info';
    const cover = document.createElement('span');
    cover.className = 'cover-mark';
    cover.setAttribute('aria-hidden', 'true');
    cover.textContent = '♫';
    const name = document.createElement('span');
    name.className = 'track-name';
    name.textContent = song.name;
    info.append(cover, name);

    const actions = document.createElement('div');
    actions.className = 'track-actions';
    const playButton = document.createElement('button');
    playButton.className = 'icon-button';
    playButton.type = 'button';
    playButton.textContent = '▶';
    playButton.setAttribute('aria-label', `Lire ${song.name}`);
    playButton.addEventListener('click', () => player.play(song));

    const favoriteButton = document.createElement('button');
    favoriteButton.className = `icon-button favorite${song.favorite ? ' active' : ''}`;
    favoriteButton.type = 'button';
    favoriteButton.textContent = song.favorite ? '♥' : '♡';
    favoriteButton.setAttribute('aria-label', song.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris');
    favoriteButton.addEventListener('click', async () => {
      try {
        await toggleFavorite(database, song);
        renderSongs();
      } catch (error) {
        console.error('La mise à jour du favori a échoué.', error);
      }
    });

    actions.append(playButton, favoriteButton);
    row.append(info, actions);
    elements.songs.append(row);
  }
}

function renderPlaylistTrack(song, playlistId) {
  const row = document.createElement('article');
  row.className = 'track';
  const info = document.createElement('div');
  info.className = 'track-info';
  const cover = document.createElement('span');
  cover.className = 'cover-mark';
  cover.setAttribute('aria-hidden', 'true');
  cover.textContent = '♫';
  const name = document.createElement('span');
  name.className = 'track-name';
  name.textContent = song.name;
  info.append(cover, name);

  const actions = document.createElement('div');
  actions.className = 'track-actions';
  const playButton = document.createElement('button');
  playButton.className = 'icon-button';
  playButton.type = 'button';
  playButton.textContent = '▶';
  playButton.setAttribute('aria-label', `Lire ${song.name}`);
  playButton.addEventListener('click', () => player.play(song));
  const removeButton = document.createElement('button');
  removeButton.className = 'icon-button';
  removeButton.type = 'button';
  removeButton.textContent = '−';
  removeButton.setAttribute('aria-label', `Retirer ${song.name} de la playlist`);
  removeButton.addEventListener('click', async () => {
    await removeSongFromPlaylist(database, playlistId, song.id);
    await renderPlaylists();
  });
  actions.append(playButton, removeButton);
  row.append(info, actions);
  return row;
}

async function renderPlaylists() {
  playlists = await getPlaylists(database);
  if (!playlists.some((playlist) => playlist.id === activePlaylistId)) {
    activePlaylistId = playlists[0]?.id ?? null;
  }

  elements.playlistList.replaceChildren();
  if (!playlists.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Crée une playlist pour organiser tes morceaux.';
    elements.playlistList.append(empty);
  }

  for (const playlist of playlists) {
    const item = document.createElement('div');
    item.className = 'playlist-list-item';
    const selectButton = document.createElement('button');
    selectButton.className = `playlist-select${playlist.id === activePlaylistId ? ' active' : ''}`;
    selectButton.type = 'button';
    selectButton.textContent = `${playlist.name} · ${playlist.songIds.length}`;
    selectButton.setAttribute('aria-pressed', String(playlist.id === activePlaylistId));
    selectButton.addEventListener('click', async () => {
      activePlaylistId = playlist.id;
      await renderPlaylists();
    });
    const deleteButton = document.createElement('button');
    deleteButton.className = 'icon-button';
    deleteButton.type = 'button';
    deleteButton.textContent = '×';
    deleteButton.setAttribute('aria-label', `Supprimer la playlist ${playlist.name}`);
    deleteButton.addEventListener('click', async () => {
      await deletePlaylist(database, playlist.id);
      if (activePlaylistId === playlist.id) activePlaylistId = null;
      await renderPlaylists();
    });
    item.append(selectButton, deleteButton);
    elements.playlistList.append(item);
  }

  const activePlaylist = playlists.find((playlist) => playlist.id === activePlaylistId);
  elements.playlistTitle.textContent = activePlaylist?.name ?? 'Aucune playlist sélectionnée';
  elements.playlistAddForm.hidden = !activePlaylist;
  elements.playlistSongSelect.replaceChildren();
  for (const song of songs) {
    const option = document.createElement('option');
    option.value = String(song.id);
    option.textContent = song.name;
    elements.playlistSongSelect.append(option);
  }

  elements.playlistSongs.replaceChildren();
  if (activePlaylist) {
    const tracks = await getPlaylistSongs(database, activePlaylist);
    if (!tracks.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Cette playlist est vide.';
      elements.playlistSongs.append(empty);
    } else {
      for (const song of tracks) elements.playlistSongs.append(renderPlaylistTrack(song, activePlaylist.id));
    }
  }
}

function renderDiscoveryTracks(tracks) {
  elements.results.replaceChildren();

  if (!tracks.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Aucun résultat pour cette recherche.';
    elements.results.append(empty);
    return;
  }

  for (const track of tracks) {
    const row = document.createElement('article');
    row.className = 'track';
    const info = document.createElement('div');
    info.className = 'track-info';
    if (track.imageUrl) {
      const cover = document.createElement('img');
      cover.className = 'spotify-cover';
      cover.src = track.imageUrl;
      cover.alt = '';
      cover.loading = 'lazy';
      info.append(cover);
    } else {
      const cover = document.createElement('span');
      cover.className = 'cover-mark';
      cover.setAttribute('aria-hidden', 'true');
      cover.textContent = '♫';
      info.append(cover);
    }

    const copy = document.createElement('div');
    copy.className = 'track-copy';
    const name = document.createElement('span');
    name.className = 'track-name';
    name.textContent = track.name;
    const artists = document.createElement('span');
    artists.className = 'track-artist';
    artists.textContent = track.artists;
    copy.append(name, artists);
    info.append(copy);
    row.append(info);

    if (track.streamUrl) {
      const playButton = document.createElement('button');
      playButton.className = 'icon-button';
      playButton.type = 'button';
      playButton.textContent = '▶';
      playButton.setAttribute('aria-label', `${track.playLabel} : ${track.name}`);
      playButton.title = track.playLabel;
      playButton.addEventListener('click', () => player.play({
        name: `${track.name} · ${track.artists}`,
        streamUrl: track.streamUrl,
        mediaType: 'audio'
      }));
      row.append(playButton);
    } else if (track.url) {
      const link = document.createElement('a');
      link.className = 'icon-button spotify-link';
      link.href = track.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '↗';
      link.setAttribute('aria-label', `Ouvrir ${track.name} dans le service musical`);
      row.append(link);
    }
    if (track.sourceUrl) {
      const attributionLink = document.createElement('a');
      attributionLink.className = 'icon-button spotify-link';
      attributionLink.href = track.sourceUrl;
      attributionLink.target = '_blank';
      attributionLink.rel = 'noopener noreferrer';
      attributionLink.textContent = '↗';
      attributionLink.setAttribute('aria-label', `Voir ${track.name} sur Jamendo`);
      row.append(attributionLink);
    }
    elements.results.append(row);
  }
}

function displaySpotifyTracks(tracks) {
  renderDiscoveryTracks(tracks.map((track) => ({
    name: track.name ?? 'Titre sans nom',
    artists: track.artists?.map((artist) => artist.name).join(', ') ?? '',
    imageUrl: track.album?.images?.[2]?.url ?? track.album?.images?.[0]?.url,
    url: track.external_urls?.spotify
  })));
}

function displayDeezerTracks(tracks) {
  renderDiscoveryTracks(tracks.map((track) => ({
    name: track.title ?? 'Titre sans nom',
    artists: track.artist?.name ?? '',
    imageUrl: track.album?.cover_small,
    streamUrl: track.preview,
    playLabel: 'Écouter l’extrait Deezer (30 secondes)',
    url: track.link
  })));
}

function displayJamendoTracks(tracks) {
  renderDiscoveryTracks(tracks.map((track) => ({
    name: track.name ?? 'Titre sans nom',
    artists: track.artist_name ?? '',
    imageUrl: track.image,
    streamUrl: track.audio,
    playLabel: 'Écouter le morceau complet',
    sourceUrl: track.shareurl
  })));
}

function setView(view) {
  currentView = view;
  currentMood = '';
  elements.search.value = '';
  elements.librarySection.hidden = view === 'discover' || view === 'playlists';
  elements.playlistSection.hidden = view !== 'playlists';
  elements.discoverySection.hidden = view !== 'discover';
  elements.localSearch.hidden = view === 'discover' || view === 'playlists';
  elements.aiPanel.hidden = view !== 'home' && view !== 'ai';
  document.querySelectorAll('.nav-button').forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  const views = {
    home: ['Bibliothèque', 'TA COLLECTION'],
    ai: ['Sélection IA', 'SUGGESTIONS'],
    favorites: ['Favoris', 'TES MORCEAUX AIMÉS'],
    library: ['Tous les fichiers', 'TA COLLECTION'],
    playlists: ['Playlists', 'TES SÉLECTIONS'],
    discover: ['Découvrir', 'CATALOGUE MUSICAL'],
    offline: ['Hors ligne', 'DISPONIBLES SUR CET APPAREIL']
  };
  [elements.title.textContent, elements.collectionLabel.textContent] = views[view];
  renderSongs();
}

document.querySelectorAll('.nav-button').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

elements.search.addEventListener('input', renderSongs);
elements.musicProvider.addEventListener('change', () => {
  const provider = elements.musicProvider.value;
  updateProviderFields();
  saveSettings({ provider });
  elements.discoveryStatus.textContent = providerDescription(provider);
});
elements.playlistForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const playlistId = await createPlaylist(database, elements.playlistName.value);
    elements.playlistName.value = '';
    activePlaylistId = playlistId;
    elements.playlistStatus.textContent = 'Playlist créée.';
    await renderPlaylists();
  } catch (error) {
    elements.playlistStatus.textContent = error.message;
  }
});
elements.playlistAddForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activePlaylistId || !elements.playlistSongSelect.value) return;
  try {
    await addSongToPlaylist(database, activePlaylistId, elements.playlistSongSelect.value);
    elements.playlistStatus.textContent = 'Morceau ajouté à la playlist.';
    await renderPlaylists();
  } catch (error) {
    elements.playlistStatus.textContent = error.message;
  }
});
elements.discoveryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  elements.discoveryStatus.textContent = 'Recherche en cours...';
  elements.results.replaceChildren();

  try {
    const provider = elements.musicProvider.value;
    const query = elements.discoveryQuery.value;
    const tracks = provider === 'spotify'
      ? await searchSpotify(elements.spotifyToken.value, query)
      : provider === 'deezer'
        ? await searchDeezer(query)
        : await searchJamendo(elements.jamendoClientId.value, query);
    if (provider === 'spotify') displaySpotifyTracks(tracks);
    else if (provider === 'deezer') displayDeezerTracks(tracks);
    else displayJamendoTracks(tracks);
    elements.discoveryStatus.textContent = `${tracks.length} résultat${tracks.length === 1 ? '' : 's'}.`;
  } catch (error) {
    elements.discoveryStatus.textContent = error.message || 'La recherche a échoué.';
  }
});
elements.fileInput.addEventListener('change', async () => {
  const files = Array.from(elements.fileInput.files || []);
  let importedCount = 0;
  let importFailed = false;
  const rejectedFiles = [];

  try {
    for (const file of files) {
      const isVideo = file.type === 'video/mp4' || /\.mp4$/i.test(file.name);
      if (!file.type.startsWith('audio/') && !isVideo) {
        rejectedFiles.push(file.name);
        continue;
      }
      await saveSong(database, {
        name: file.name.replace(/\.[^.]+$/, ''),
        file,
        mediaType: isVideo ? 'video' : 'audio',
        favorite: false
      });
      importedCount += 1;
    }
  } catch (error) {
    importFailed = true;
    console.error('L’import de la bibliothèque a échoué.', error);
    elements.importStatus.textContent = 'Un fichier n’a pas pu être enregistré. Vérifie l’espace disponible dans le navigateur.';
  }

  if (!importFailed) {
    if (rejectedFiles.length) {
      elements.importStatus.textContent = `Format non pris en charge : ${rejectedFiles.join(', ')}.`;
    } else if (importedCount) {
      elements.importStatus.textContent = `${importedCount} fichier${importedCount === 1 ? '' : 's'} ajouté${importedCount === 1 ? '' : 's'} à la bibliothèque.`;
    }
  }
  songs = await getSongs(database);
  renderSongs();
  await renderPlaylists();
  elements.fileInput.value = '';
});

document.querySelectorAll('[data-mood]').forEach((button) => {
  button.addEventListener('click', () => {
    currentMood = button.dataset.mood;
    currentView = 'ai';
    elements.aiText.textContent = currentMood === 'gaming'
      ? 'Sélection Gaming : morceaux énergiques de ta bibliothèque.'
      : 'Sélection Chill : morceaux doux de ta bibliothèque.';
    renderSongs();
  });
});

async function initialize() {
  database = await openDatabase();
  songs = await getSongs(database);
  elements.musicProvider.value = loadSettings().provider;
  updateProviderFields();
  elements.discoveryStatus.textContent = providerDescription(elements.musicProvider.value);
  renderSongs();
  await renderPlaylists();
  registerOfflineSupport();
}

function updateProviderFields() {
  const provider = elements.musicProvider.value;
  const spotifySelected = provider === 'spotify';
  const jamendoSelected = provider === 'jamendo';
  elements.spotifyTokenField.hidden = !spotifySelected;
  elements.spotifyToken.required = spotifySelected;
  elements.jamendoClientField.hidden = !jamendoSelected;
  elements.jamendoClientId.required = jamendoSelected;
}

function providerDescription(provider) {
  if (provider === 'spotify') return 'Spotify nécessite un jeton OAuth.';
  if (provider === 'deezer') return 'Recherche Deezer : écoute des extraits de 30 secondes dans le lecteur intégré.';
  return 'Jamendo permet d’écouter les morceaux complets du catalogue. Saisis ton Client ID Jamendo.';
}

initialize().catch((error) => {
  console.error('Impossible de charger la bibliothèque.', error);
  elements.songs.textContent = 'Le stockage local est indisponible dans ce navigateur.';
  registerOfflineSupport();
});