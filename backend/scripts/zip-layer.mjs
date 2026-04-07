import { createWriteStream, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import archiver from "archiver";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

mkdirSync(DIST, { recursive: true });

const OUTPUT_PATH = resolve(DIST, "layer.zip");
const LAYER_SOURCE = resolve(ROOT, "layers", "nodejs");

function zipLayer() {
  return new Promise((resolvePromise, reject) => {
    const output = createWriteStream(OUTPUT_PATH);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`Layer zipped: dist/layer.zip (${sizeMB} MB)`);
      resolvePromise();
    });

    archive.on("error", reject);
    archive.pipe(output);

    // Archive the nodejs/ folder so it extracts to /opt/nodejs/
    archive.directory(LAYER_SOURCE, "nodejs");

    archive.finalize();
  });
}

zipLayer().catch((err) => {
  console.error("Failed to zip layer:", err.message);
  process.exit(1);
});
