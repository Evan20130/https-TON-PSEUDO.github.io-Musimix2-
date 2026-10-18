export function registerOfflineSupport() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('./service-worker.js').catch((error) => {
    console.error('Le service hors ligne n’a pas pu être activé.', error);
  });
}