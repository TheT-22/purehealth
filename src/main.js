import { h, render } from 'preact';
import App from './logic.js';

// Demande au navigateur de ne pas effacer les données de l'app pour faire de la place
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

render(h(App, {}), document.getElementById('app'));

if ('serviceWorker' in navigator) {
  // Quand une nouvelle version vient d'être installée, on recharge une fois pour l'utiliser tout de suite
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      reg.update().catch(() => {});
      // Sur téléphone, l'app reste souvent en arrière-plan : on cherche une mise à jour à chaque retour
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    }).catch(() => { /* hors ligne indisponible */ });
  });
}
