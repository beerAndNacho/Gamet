import { VaultboundGame } from './game.js';
import { installAdvancedSystems } from './advanced.js';

const game = new VaultboundGame();
installAdvancedSystems(game);
globalThis.__VAULTBOUND__ = game;

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
