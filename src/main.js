import { h, render } from 'preact';
import App from './logic.js';

// Demande au navigateur de ne pas effacer les données de l'app pour faire de la place
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

render(h(App, {}), document.getElementById('app'));

// Fenêtre « Nouvelle version disponible » : l'utilisateur choisit quand mettre à jour
let accepted = false;
function offerUpdate(worker) {
  if (!worker || document.getElementById('ph-update')) return;
  const wrap = document.createElement('div');
  wrap.id = 'ph-update';
  wrap.setAttribute('style', 'position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; display: flex; justify-content: center; padding: 0 12px calc(env(safe-area-inset-bottom) + 12px); pointer-events: none;');
  wrap.innerHTML =
    '<div role="dialog" aria-labelledby="ph-update-t" style="pointer-events: auto; width: 100%; max-width: 480px; box-sizing: border-box; background: #FFFFFF; border-radius: 20px; padding: 16px; box-shadow: 0 12px 32px rgba(22, 32, 27, 0.25); display: flex; flex-direction: column; gap: 12px; font-family: Inter, system-ui, sans-serif; color: #16201B">'
    + '<div style="display: flex; flex-direction: column; gap: 4px">'
    + '<span id="ph-update-t" style="font-size: 16px; font-weight: 700">Nouvelle version disponible</span>'
    + '<span style="font-size: 14px; line-height: 1.4; color: #55605A">Mettre à jour maintenant ? Tes données sont conservées.</span>'
    + '</div>'
    + '<div style="display: flex; gap: 10px">'
    + '<button type="button" data-a="later" style="flex: 1; height: 48px; border: 1.5px solid #CFD5CC; border-radius: 14px; background: #FFFFFF; color: #16201B; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer">Plus tard</button>'
    + '<button type="button" data-a="ok" style="flex: 1; height: 48px; border: none; border-radius: 14px; background: #1E6F52; color: #FFFFFF; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer">Mettre à jour</button>'
    + '</div></div>';
  wrap.addEventListener('click', (e) => {
    const a = e.target && e.target.getAttribute && e.target.getAttribute('data-a');
    if (a === 'later') wrap.remove();
    if (a === 'ok') {
      accepted = true;
      e.target.textContent = 'Mise à jour…';
      worker.postMessage({ type: 'SKIP_WAITING' });
      setTimeout(() => location.reload(), 4000); // filet de sécurité
    }
  });
  document.body.appendChild(wrap);
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
