export function createPlayer(audio, currentSongLabel) {
  let currentUrl = '';

  return {
    play(song) {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      currentUrl = URL.createObjectURL(song.file);
      audio.src = currentUrl;
      currentSongLabel.textContent = song.name;
      audio.play().catch((error) => {
        console.error('La lecture du morceau a échoué.', error);
      });
    }
  };
}