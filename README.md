# Musimix 2

Musimix 2 est une application web statique : bibliothèque locale MP3/MP4, lecteurs audio et vidéo, favoris, playlists IndexedDB, recherche Spotify/Deezer/Jamendo, suggestions Musimix AI et prise en charge hors ligne.

## Démarrer

L’application utilise des modules JavaScript, IndexedDB et un service worker. Ouvre le dépôt avec un serveur HTTP local, par exemple l’extension Live Server de VS Code ou `python3 -m http.server 8000`, puis visite `http://localhost:8000`.

## Services musicaux

- Spotify utilise l’API officielle et demande un jeton OAuth valide dans la vue Découvrir. Le jeton reste dans le formulaire et n’est pas enregistré.
- Deezer utilise son endpoint officiel en JSONP pour fonctionner depuis l’hébergement statique. Les résultats avec aperçu peuvent être écoutés dans le lecteur intégré (extraits de 30 secondes).
- Jamendo permet de chercher et d’écouter les morceaux complets disponibles dans son catalogue Creative Commons. Obtiens un Client ID sur [le portail développeur Jamendo](https://developer.jamendo.com/v3.0) et saisis-le dans la vue Découvrir ; il reste dans le formulaire et n’est pas enregistré.
- La recherche Spotify propose des liens vers son service. La lecture locale concerne les fichiers ajoutés à la bibliothèque.
- Les fichiers MP3 et MP4 locaux peuvent être ajoutés à la bibliothèque et sont conservés dans IndexedDB pour une lecture hors connexion.

## Données

Les fichiers audio, favoris et playlists sont conservés dans IndexedDB du navigateur, magasin `Musimix2DB`. Le schéma version 2 ajoute le magasin `playlists` sans supprimer les morceaux existants. Les réglages non sensibles, comme le fournisseur sélectionné, sont conservés dans `localStorage`.

## Structure

```text
index.html
manifest.json
service-worker.js
assets/
	logo.png
	icons/
	covers/
css/
	style.css
	player.css
	rgb.css
	mobile.css
js/
	app.js
	player.js
	search.js
	indexeddb.js
	favorites.js
	playlist.js
	offline.js
	ai.js
	settings.js
database/indexeddb/
api/
	spotify.js
	deezer.js
```
