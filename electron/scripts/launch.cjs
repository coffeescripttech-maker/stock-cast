/**
 * Cross-platform launcher for the Electron app.
 *
 * Deletes ELECTRON_RUN_AS_NODE before spawning the Electron binary. Some
 * environments (sandboxes, CI, certain shells) inherit ELECTRON_RUN_AS_NODE=1,
 * which makes the Electron binary boot as plain Node — `require('electron')`
 * then returns the npm package path instead of the Electron API and the app
 * crashes at startup. This wrapper guarantees a clean GUI launch everywhere.
 *
 * Usage (from package.json scripts):  node electron/scripts/launch.cjs .
 */
delete process.env.ELECTRON_RUN_AS_NODE;

const { spawnSync } = require('child_process');
// Under plain Node, `require('electron')` resolves to the Electron binary path.
const electronPath = require('electron');

const result = spawnSync(electronPath, process.argv.slice(2), {
  stdio: 'inherit',
});

process.exit(result.status === null ? 1 : result.status);
