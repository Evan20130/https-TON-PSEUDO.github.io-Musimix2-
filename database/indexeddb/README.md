# Stockage IndexedDB

La base `Musimix2DB` est créée par le navigateur, pas stockée dans le dépôt.
Le module `js/indexeddb.js` définit les magasins `songs` et `playlists` et effectue la migration de schéma à l’ouverture.
Les données restent propres à l’origine du site et à chaque navigateur.
