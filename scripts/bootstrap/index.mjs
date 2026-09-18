import { fileURLToPath } from 'node:url';
import { collectOptions } from './options.mjs';
import { renameTokens } from './rename.mjs';
import { editManifests } from './manifests.mjs';
import { prune } from './prune.mjs';
import { finalize } from './finalize.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));

const opts = await collectOptions();
renameTokens(root, opts);
editManifests(root, opts);
prune(root, opts);
finalize(root);
