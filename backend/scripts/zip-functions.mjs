import { createWriteStream, mkdirSync, readdirSync, statSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import archiver from "archiver";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist", "functions");
const FUNCTIONS_DIR = resolve(ROOT, "functions");

mkdirSync(DIST, { recursive: true });

function zipFunction(fnName) {
  const fnDir = resolve(FUNCTIONS_DIR, fnName);
  const outputPath = resolve(DIST, `${fnName}.zip`);

  return new Promise((resolvePromise, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      const sizeKB = (archive.pointer() / 1024).toFixed(2);
      console.log(`  ${fnName}.zip (${sizeKB} KB)`);
      resolvePromise();
    });

    archive.on("error", reject);
    archive.pipe(output);

    // Archive all files in the function folder at the zip root
    archive.directory(fnDir, false);

    archive.finalize();
  });
}

async function zipAllFunctions() {
  const entries = readdirSync(FUNCTIONS_DIR).filter((entry) =>
    statSync(join(FUNCTIONS_DIR, entry)).isDirectory()
  );

  if (entries.length === 0) {
    console.log("No function folders found in functions/");
    process.exit(1);
  }

  console.log(`Zipping ${entries.length} functions:`);

  for (const fn of entries) {
    await zipFunction(fn);
  }

  console.log(`\nAll functions zipped to dist/functions/`);
}

zipAllFunctions().catch((err) => {
  console.error("Failed to zip functions:", err.message);
  process.exit(1);
});
