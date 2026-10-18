const MOOD_KEYWORDS = {
  gaming: ['game', 'gaming', 'enemy', 'warrior', 'power', 'rock', 'battle'],
  chill: ['chill', 'lofi', 'lo-fi', 'calm', 'piano', 'ambient', 'ocean', 'sleep']
};

export function recommendSongs(songs, mood) {
  const keywords = MOOD_KEYWORDS[mood] || [];
  const matches = songs.filter((song) => keywords.some((keyword) => song.name.toLowerCase().includes(keyword)));
  return matches.length ? matches : songs;
}