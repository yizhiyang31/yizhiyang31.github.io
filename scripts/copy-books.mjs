import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const sourceDir = path.join(rootDir, "books");
const distDir = path.join(rootDir, "docs", ".vuepress", "dist");
const targetDir = path.join(distDir, "books");

async function main() {
  if (!(await fs.stat(distDir).catch(() => null))) {
    throw new Error(`[copy-books] 构建产物不存在：${distDir}`);
  }

  let entries = [];
  try {
    entries = await fs.readdir(sourceDir, { withFileTypes: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const pdfNames = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
    .map((entry) => entry.name);

  await fs.mkdir(targetDir, { recursive: true });

  for (const name of pdfNames) {
    await fs.copyFile(path.join(sourceDir, name), path.join(targetDir, name));
  }

  console.log(`[copy-books] 已将 ${pdfNames.length} 本书复制到 dist/books`);
}

main().catch((error) => {
  console.error("[copy-books] 复制失败：", error);
  process.exitCode = 1;
});
