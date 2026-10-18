import { openDatabase, getSongs, saveSong, updateSong } from './indexeddb.js';
import { createPlayer } from './player.js';
import { filterSongs } from './search.js';
import { recommendSongs } from './ai.js';
import { registerOfflineSupport } from './offline.js';

const elements = {
  audio: document.querySelector('#audio'),
  currentSong: document.querySelector('#currentSong'),
  fileInput: document.querySelector('#fileInput'),
  search: document.querySelector('#search'),
  songs: document.querySelector('#songs'),
  count: document.querySelector('#song-count'),
  title: document.querySelector('#library-title'),
  collectionLabel: document.querySelector('#collection-label'),
  aiText: document.querySelector('#aiText'),
  aiPanel: document.querySelector('#ai-panel')
};

const player = createPlayer(elements.audio, elements.currentSong);
let database;
let songs = [];
let currentView = 'home';
let currentMood = '';

function visibleSongs() {
  let result = filterSongs(songs, elements.search.value);
  if (currentView === 'favorites') result = result.filter((song) => song.favorite);
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
      song.favorite = !song.favorite;
      await updateSong(database, song);
      renderSongs();
    });

    actions.append(playButton, favoriteButton);
    row.append(info, actions);
    elements.songs.append(row);
  }
}

function setView(view) {
  currentView = view;
  currentMood = '';
  elements.search.value = '';
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
    library: ['Tous les MP3', 'TA COLLECTION'],
    offline: ['Hors ligne', 'DISPONIBLES SUR CET APPAREIL']
  };
  [elements.title.textContent, elements.collectionLabel.textContent] = views[view];
  renderSongs();
}

document.querySelectorAll('.nav-button').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

elements.search.addEventListener('input', renderSongs);
elements.fileInput.addEventListener('change', async () => {
  const files = Array.from(elements.fileInput.files || []);
  for (const file of files) {
    await saveSong(database, { name: file.name.replace(/\.[^.]+$/, ''), file, favorite: false });
  }
  songs = await getSongs(database);
  renderSongs();
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
  renderSongs();
  registerOfflineSupport();
}

initialize().catch((error) => {
  console.error('Impossible de charger la bibliothèque.', error);
  elements.songs.textContent = 'Le stockage local est indisponible dans ce navigateur.';
  registerOfflineSupport();
});