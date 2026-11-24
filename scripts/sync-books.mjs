import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const sourceDir = path.join(rootDir, "books");
const manifestPath = path.join(rootDir, "docs", ".vuepress", "books-data.json");

const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });

const formatSize = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

async function main() {
  let entries = [];
  try {
    entries = await fs.readdir(sourceDir, { withFileTypes: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    console.warn(`[sync-books] 未找到书籍目录：${sourceDir}`);
  }

  const pdfNames = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
    .map((entry) => entry.name)
    .sort((a, b) => collator.compare(a, b));

  const manifest = [];
  for (const name of pdfNames) {
    const { size } = await fs.stat(path.join(sourceDir, name));
    manifest.push({ file: name, size: formatSize(size) });
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`[sync-books] 已生成 ${manifest.length} 本书的清单（来源：books/）`);
}

main().catch((error) => {
  console.error("[sync-books] 同步失败：", error);
  process.exitCode = 1;
});
