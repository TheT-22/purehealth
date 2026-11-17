import { h, render } from 'preact';
import App from './logic.js';

// Demande au navigateur de ne pas effacer les données de l'app pour faire de la place
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

render(h(App, {}), document.getElementById('app'));

// Petite note « Nouvelle version disponible » : un appui redémarre l'app sur la nouvelle version
let accepted = false;
function offerUpdate(worker) {
  if (!worker || document.getElementById('ph-update')) return;
  const note = document.createElement('button');
  note.id = 'ph-update';
  note.type = 'button';
  note.setAttribute('aria-label', 'Nouvelle version disponible : toucher pour mettre à jour');
  note.setAttribute('style', 'position: fixed; top: calc(env(safe-area-inset-top) + 8px); left: 50%; transform: translateX(-50%); z-index: 50; width: calc(100% - 24px); max-width: 496px; box-sizing: border-box; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: none; border-radius: 16px; background: #16201B; color: #FFFFFF; font-family: Inter, system-ui, sans-serif; text-align: left; box-shadow: 0 8px 24px rgba(22, 32, 27, 0.25); cursor: pointer');
  note.innerHTML = '<span style="width: 8px; height: 8px; flex: none; border-radius: 50%; background: #9FD0B9"></span>'
    + '<span style="display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0">'
    + '<span style="font-size: 14px; font-weight: 600">Nouvelle version disponible</span>'
    + '<span data-sub style="font-size: 13px; color: #C9D6CF">Touche ici pour mettre à jour</span></span>'
    + '<span style="font-size: 18px; color: #9FD0B9">›</span>';
  note.addEventListener('click', () => {
    if (accepted) return;
    accepted = true;
    note.querySelector('[data-sub]').textContent = 'Mise à jour…';
    worker.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => location.reload(), 4000); // filet de sécurité
  });
  document.body.appendChild(note);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (accepted) location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      const watch = (w) => {
        if (!w) return;
        if (w.state === 'installed' && navigator.serviceWorker.controller) { offerUpdate(w); return; }
        w.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(reg.waiting || w);
        });
      };
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
      watch(reg.installing);
      reg.addEventListener('updatefound', () => watch(reg.installing));
      reg.update().catch(() => {});
      // Sur téléphone, l'app reste souvent en arrière-plan : on cherche une mise à jour à chaque retour
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    }).catch(() => { /* hors ligne indisponible */ });
  });
}
