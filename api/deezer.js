let requestId = 0;

export async function searchDeezer(query) {
  if (!query.trim()) return [];

  const url = new URL('https://api.deezer.com/search');
  url.searchParams.set('q', query);
  url.searchParams.set('output', 'jsonp');

  const callbackName = `__musimixDeezerCallback${++requestId}`;
  url.searchParams.set('callback', callbackName);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const cleanup = () => {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('La recherche Deezer a expiré.'));
    }, 10000);

    window[callbackName] = (data) => {
      cleanup();
      if (data?.error) {
        reject(new Error(data.error.message ?? 'La recherche Deezer a échoué.'));
        return;
      }
      resolve(data?.data ?? []);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('La recherche Deezer a échoué.'));
    };
    script.src = url.toString();
    document.head.append(script);
  });
}
