import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

/** 书籍 PDF 的唯一存放目录：项目根目录下的 books/ */
const booksDir = path.resolve(fileURLToPath(new URL("../../../books/", import.meta.url)));

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
};

const notFound = (res: ServerResponse) => {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("Not Found");
};

const sendFile = (
  req: IncomingMessage,
  res: ServerResponse,
  filePath: string,
  size: number,
) => {
  res.setHeader("Content-Type", MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream");
  res.setHeader("Accept-Ranges", "bytes");

  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : size - 1;
      if (start >= size || end < start) {
        res.statusCode = 416;
        res.setHeader("Content-Range", `bytes */${size}`);
        res.end();
        return;
      }
      const safeEnd = Math.min(end, size - 1);
      res.statusCode = 206;
      res.setHeader("Content-Range", `bytes ${start}-${safeEnd}/${size}`);
      res.setHeader("Content-Length", safeEnd - start + 1);
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      fs.createReadStream(filePath, { start, end: safeEnd }).pipe(res);
      return;
    }
  }

  res.setHeader("Content-Length", size);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
};

/**
 * 开发服务器直接把 /books/*.pdf 映射到项目根目录的 books/，
 * 生产构建由 scripts/copy-books.mjs 把 PDF 复制到 dist/books/。
 */
export const booksStaticPlugin = (): Plugin => ({
  name: "vuepress-books-static",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const rawUrl = req.url ?? "";
      if (!rawUrl.startsWith("/books/")) {
        next();
        return;
      }

      const relative = decodeURIComponent(rawUrl.slice("/books/".length).split(/[?#]/)[0]);
      const filePath = path.resolve(booksDir, relative);
      const outside = path.relative(booksDir, filePath);

      if (!relative || outside.startsWith("..") || path.isAbsolute(outside)) {
        notFound(res);
        return;
      }

      const stat = fs.statSync(filePath, { throwIfNoEntry: false });
      if (!stat?.isFile()) {
        notFound(res);
        return;
      }

      if (req.method !== "GET" && req.method !== "HEAD") {
        res.statusCode = 405;
        res.setHeader("Allow", "GET, HEAD");
        res.end();
        return;
      }

      sendFile(req, res, filePath, stat.size);
    });
  },
});
