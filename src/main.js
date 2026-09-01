import { VaultboundGame } from './game.js';

const game = new VaultboundGame();
globalThis.__VAULTBOUND__ = game;

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
