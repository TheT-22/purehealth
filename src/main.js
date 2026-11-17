import { h, render } from 'preact';
import App from './logic.js';

render(h(App, {}), document.getElementById('app'));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* hors ligne indisponible */ });
  });
}
