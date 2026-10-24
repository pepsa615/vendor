import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const schema = "src/api/generated/schema.ts";
const contract = "contracts/openapi.json";
if (!existsSync(schema) || !existsSync(contract))
  throw new Error("OpenAPI contract or generated schema is missing");
JSON.parse(readFileSync(contract, "utf8"));

const directory = mkdtempSync(join(tmpdir(), "pepsa-contract-"));
const candidate = join(directory, "schema.ts");
try {
  execFileSync(
    "./node_modules/.bin/openapi-typescript",
    [contract, "-o", candidate],
    { stdio: "ignore" },
  );
  if (readFileSync(candidate, "utf8") !== readFileSync(schema, "utf8"))
    throw new Error(
      "Generated API types are stale; run pnpm contracts:generate",
    );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
console.log("OpenAPI snapshot is valid and generated TypeScript is current.");
