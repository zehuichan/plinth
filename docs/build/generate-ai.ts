import { emitSite } from '@internal/build';
import lib from '../../lib.config';

// Without a site URL (`docsUrl` in lib.config.ts or LLM_SITE_URL) links stay root-relative.
const { outputDir, pages } = emitSite(lib, {
  siteUrl: process.env.LLM_SITE_URL,
  outputDir: process.env.LLM_OUTPUT_DIR,
});

console.log(
  `Generated llms.txt, llms-full.txt, design.md and ${pages} markdown pages in ${outputDir}`,
);
