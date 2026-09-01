import { VaultboundGame } from './game.js';
import { installAdvancedSystems } from './advanced.js';
import { installMovementSafety } from './movement-safety.js';

const game = new VaultboundGame();
installAdvancedSystems(game);
installMovementSafety(game);
globalThis.__VAULTBOUND__ = game;

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
