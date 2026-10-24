import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const assets = "dist/assets";
const files = readdirSync(assets).filter((name) => name.endsWith(".js"));
const failures = [];
for (const name of files) {
  const path = join(assets, name);
  const raw = statSync(path).size;
  const gzip = gzipSync(readFileSync(path)).length;
  const isEntry = name.startsWith("index-");
  const gzipLimit = (isEntry ? 250 : 150) * 1024;
  if (raw > 500 * 1024)
    failures.push(
      `${name}: raw ${(raw / 1024).toFixed(1)} KiB exceeds 500 KiB`,
    );
  if (gzip > gzipLimit)
    failures.push(
      `${name}: gzip ${(gzip / 1024).toFixed(1)} KiB exceeds ${gzipLimit / 1024} KiB`,
    );
}
if (failures.length)
  throw new Error(`Bundle budget exceeded:\n${failures.join("\n")}`);
console.log(`Bundle budget passed for ${files.length} JavaScript chunks.`);
