// Copy the static site in app/ to MAKEFUN_OUTPUT_DIR (or "out") and exit.
// Deterministic: no server, no network, no timestamps, no randomness.
// Grader contract: `node /bot/main.ts` must exit 0 within 10s and produce
// byte-identical output across runs.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function countFiles(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) n += countFiles(p);
    else if (entry.isFile() || entry.isSymbolicLink()) n += 1;
  }
  return n;
}

const here = dirname(fileURLToPath(import.meta.url));
const sourceDir = resolve(here, "app");
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || "out");

if (!existsSync(sourceDir)) {
  console.error(`Source directory not found: ${sourceDir}`);
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
cpSync(sourceDir, outputDir, { recursive: true, dereference: true });

// Verify the copy is complete: file count in output must match the source.
// A partial copy (disk error, interrupted write) fails loudly instead of
// silently producing a broken site.
const expected = countFiles(sourceDir);
const actual = countFiles(outputDir);
if (actual !== expected) {
  console.error(`Copy incomplete: expected ${expected} files, got ${actual}`);
  process.exit(1);
}
console.log(`Copied ${actual} files from app/ to ${outputDir}`);
