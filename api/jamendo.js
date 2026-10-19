export async function searchJamendo(clientId, query) {
  if (!clientId.trim()) throw new Error('Un Client ID Jamendo est requis.');
  if (!query.trim()) return [];

  const url = new URL('https://api.jamendo.com/v3.0/tracks/');
  url.searchParams.set('client_id', clientId.trim());
  url.searchParams.set('format', 'json');
  url.searchParams.set('namesearch', query.trim());
  url.searchParams.set('limit', '20');
  url.searchParams.set('audioformat', 'mp32');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`La recherche Jamendo a échoué (${response.status}).`);
  }

  const data = await response.json();
  if (data.headers?.status !== 'success') {
    throw new Error(data.headers?.error_message || 'La recherche Jamendo a échoué.');
  }
  return data.results ?? [];
}
