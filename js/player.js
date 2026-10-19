export function createPlayer(audio, video, currentSongLabel) {
  let currentObjectUrl = '';

  return {
    play(song) {
      const isVideo = song.mediaType === 'video'
        || song.file?.type === 'video/mp4'
        || /\.mp4$/i.test(song.file?.name || '');
      const media = isVideo ? video : audio;
      const inactiveMedia = isVideo ? audio : video;

      inactiveMedia.pause();
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = song.file ? URL.createObjectURL(song.file) : '';
      media.src = currentObjectUrl || song.streamUrl;
      media.load();
      media.hidden = false;
      inactiveMedia.hidden = true;
      document.querySelector('.player').classList.toggle('video-active', isVideo);
      currentSongLabel.textContent = song.name;
      media.play().catch((error) => {
        console.error('La lecture du fichier a échoué.', error);
      });
    }
  };
}