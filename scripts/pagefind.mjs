import { existsSync, readdirSync } from "node:fs";
import * as pagefind from "pagefind";

// `next build` writes prerendered HTML to .next/server/app, but with a build
// adapter in play (Vercel) it writes it to
// .next/server/route-cache/APP_PAGE/<route hash>/$/<pathname>.html instead.
// Every directory below is a site root, so page URLs stay /iphone/air.html.
const cacheDir = ".next/server/route-cache/APP_PAGE";
const roots = [".next/server/app"];
if (existsSync(cacheDir)) {
  for (const hash of readdirSync(cacheDir)) roots.push(`${cacheDir}/${hash}/$`);
}

const { index } = await pagefind.createIndex();
let pages = 0;
for (const path of roots.filter((root) => existsSync(root))) {
  const { page_count } = await index.addDirectory({ path });
  pages += page_count;
}
if (pages === 0) throw new Error(`pagefind: no HTML found under ${roots}`);
await index.writeFiles({ outputPath: "public/_pagefind" });
await pagefind.close();
console.log(`pagefind: indexed ${pages} pages`);
