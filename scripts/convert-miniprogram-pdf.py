# -*- coding: utf-8 -*-
"""将《小程序基础.pdf》转换为博客文章（docs/posts/frontend/miniprogram/）。

规则：
- 按 PDF 书签（一级目录）拆分章节文件，二/三级目录还原为 ##/### 标题；
- LucidaConsole/NSimSun(8.8pt) 还原为代码块，行内 LucidaConsole 还原为行内代码；
- 表格（加粗多列表头）按绘制竖线列边界还原为 Markdown 表格，支持跨页合并；
- 页面内嵌图片按出现位置提取到 images/，重复 xref 复用同一文件；
- PDF 链接还原为 Markdown 链接；每页起始处插入 <!-- PDF 第 N 页 --> 标记；
- 与下一章共享的交界页按章标题行拆分，避免上一章结尾内容混入下一章。
"""
import os
import re
import shutil

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_PATH = os.path.join(ROOT, "小程序基础.pdf")
OUT_DIR = os.path.join(ROOT, "docs", "posts", "frontend", "miniprogram")
IMG_DIR = os.path.join(OUT_DIR, "images")
IMG_REL = "./images"

CHAPTERS = [
    {
        "slug": "01-basics",
        "title": "第 1 章 小程序基础知识",
        "excerpt": "认识小程序、账号注册与信息完善、开发者 ID、成员管理、微信开发者工具，以及项目创建、目录结构、调试与页面新建。",
    },
    {
        "slug": "02-config-files",
        "title": "第 2 章 小程序配置文件",
        "excerpt": "配置文件介绍、全局配置（pages、window、tabBar）、页面配置、项目配置文件、sass/less 支持与 sitemap.json。",
    },
    {
        "slug": "03-styles-and-components",
        "title": "第 3 章 常用样式和组件",
        "excerpt": "rpx 尺寸单位、全局与局部样式，以及 view、swiper、image、text、navigator、scroll-view 等常用组件与字体图标、背景图片的使用。",
    },
    {
        "slug": "04-events",
        "title": "第 4 章 事件处理",
        "excerpt": "事件绑定与事件对象、绑定并阻止事件冒泡，以及 data-* 与 mark 两种自定义数据传参方式。",
    },
    {
        "slug": "05-template-syntax",
        "title": "第 5 章 模板语法",
        "excerpt": "数据的声明与绑定、setData 修改对象和数组、简易双向绑定、列表渲染与条件渲染。",
    },
    {
        "slug": "06-lifecycle",
        "title": "第 6 章 生命周期",
        "excerpt": "小程序运行机制与更新机制、生命周期介绍、应用级别与页面级别生命周期，以及两个细节补充说明。",
    },
    {
        "slug": "07-native-api",
        "title": "第 7 章 微信原生 API",
        "excerpt": "API 基础、网络请求、loading 提示框与模态对话框、本地存储、路由与通信、上拉加载与下拉刷新、增强 scroll-view。",
    },
    {
        "slug": "08-custom-components",
        "title": "第 8 章 自定义组件",
        "excerpt": "组件的创建注册与使用、数据方法与属性、slot、样式隔离、数据监听器、组件间通信与事件、组件生命周期、behaviors 等进阶用法。",
    },
    {
        "slug": "09-npm-support",
        "title": "第 9 章 npm 支持",
        "excerpt": "构建 npm、自定义构建 npm，以及 Vant 组件的使用方式与样式覆盖。",
    },
    {
        "slug": "10-subpackages",
        "title": "第 10 章 分包加载",
        "excerpt": "分包加载的概念与基本使用、打包和引用原则、独立分包的配置与分包预下载。",
    },
    {
        "slug": "11-capabilities",
        "title": "第 11 章 小程序开发能力",
        "excerpt": "获取用户头像与昵称、转发功能、分享到朋友圈、手机号验证组件与客服能力。",
    },
    {
        "slug": "12-getapp",
        "title": "第 12 章 框架接口 getApp",
        "excerpt": "getApp 全局对象、小程序页面间通信与自定义导航栏。",
    },
    {
        "slug": "13-release",
        "title": "第 13 章 上线发布",
        "excerpt": "小程序上传代码、提交审核与发布上线的完整流程。",
    },
]

AUTHOR = "yizhiyang"
DATE = "2026-11-27"
TAGS = ["微信小程序", "前端", "学习笔记"]

LIST_RE = re.compile(r"^\s*(?:\d+[.、．]|\d+️?⃣|[①-⑳]|[-*•●])")
BOLD_JOIN_RE = re.compile(r"\*\*([^*]+)\*\*\*\*([^*]+)\*\*")


def merge_adjacent_bolds(s: str) -> str:
    prev = None
    while prev != s:
        prev = s
        s = BOLD_JOIN_RE.sub(r"**\1\2**", s)
    return s


def norm(s: str) -> str:
    return re.sub(r"[\s.。:：,，()（）-]+", "", s).lower()


def guess_lang(code: str) -> str:
    head = code.strip()
    if re.search(r"<\/?[a-zA-Z-]+[\s>]", head):
        return "xml"
    if re.search(r"^\s*[.#a-zA-Z][\w-]*\s*\{", head, re.M) and "function" not in head:
        return "css"
    if re.search(r"^\s*\{?\s*\"[\w-]+\"\s*:", head) or head.startswith("{") or head.startswith("["):
        return "json"
    if re.search(r"\b(Page|App|Component|Behavior)\s*\(|wx\.|this\.setData|console\.log|=>|function\s|const\s|let\s|var\s", head):
        return "javascript"
    if re.search(r"^\s*(npm|node|yarn|pnpm|cd|git|mkdir)\b", head, re.M):
        return "bash"
    return ""


def is_bold_span(span) -> bool:
    return bool(span["flags"] & 16) or "Bold" in span["font"]


def collect_rows(page):
    """把页面内容整理为按 y 排序的视觉行。"""
    d = page.get_text("dict")
    links = [l for l in page.get_links() if l.get("uri")]
    raw_lines = []
    for b in d["blocks"]:
        if b["type"] != 0:
            continue
        for l in b["lines"]:
            spans = [s for s in l["spans"] if s["text"] != ""]
            if not spans:
                continue
            raw_lines.append(
                {
                    "y": (l["bbox"][1] + l["bbox"][3]) / 2,
                    "x0": l["bbox"][0],
                    "spans": spans,
                }
            )
    raw_lines.sort(key=lambda l: (round(l["y"], 1), l["x0"]))
    rows = []
    for l in raw_lines:
        for r in rows:
            if abs(r["y"] - l["y"]) <= 4:
                r["lines"].append(l)
                r["y"] = sum(x["y"] for x in r["lines"]) / len(r["lines"])
                break
        else:
            rows.append({"y": l["y"], "lines": [l]})
    rows.sort(key=lambda r: r["y"])
    out = []
    for r in rows:
        segs = []
        for l in sorted(r["lines"], key=lambda x: x["x0"]):
            for s in l["spans"]:
                segs.append(
                    (
                        s["text"].replace("\xa0", " "),
                        s["font"],
                        round(s["size"], 1),
                        is_bold_span(s),
                        pymupdf.Rect(s["bbox"]),
                    )
                )
        out.append({"y": r["y"], "segs": segs, "text": "".join(t for t, *_ in segs)})
    return out, links


def classify_row(row):
    total = sum(len(t) for t, _, _, _, _ in row["segs"] if t.strip())
    small = sum(len(t) for t, _, s, _, _ in row["segs"] if t.strip() and s < 9.4)
    if total == 0 or not row["text"].strip():
        return "blank"
    if small / total > 0.8:
        return "code"
    return "text"


def inline_md(row, links):
    """把一行的 span 序列转为 Markdown 文本（行内代码/加粗/链接）。"""
    parts = []
    for t, f, sz, bold, rect in row["segs"]:
        if t == "":
            continue
        txt = t.replace("\xa0", " ")
        if not txt.strip():
            parts.append(" ")
            continue
        uri = None
        for l in links:
            r = pymupdf.Rect(l["from"])
            if r.intersects(rect) and abs((rect.y0 + rect.y1) / 2 - (r.y0 + r.y1) / 2) < 10:
                uri = l["uri"]
                break
        if uri:
            parts.append(f"[{txt.strip()}]({uri})" + (" " if txt.endswith(" ") else ""))
        elif "LucidaConsole" in f and sz >= 9.4:
            parts.append(f"`{txt.strip()}`" + (" " if txt.endswith(" ") else ""))
        elif bold and sz >= 9.4:
            parts.append(f"**{txt.strip()}**" + (" " if txt.endswith(" ") else ""))
        else:
            parts.append(txt)
    return "".join(parts)


def page_tables(page):
    """识别页面中的表格区域：竖线按 x 链式合并、按 y 范围聚簇。

    返回 [(xs 列边界列表, y0, y1), ...]，仅保留 ≥4 条竖线（≥3 列）的簇。
    """
    segs = []
    for d in page.get_drawings():
        for item in d["items"]:
            if item[0] == "l":
                p1, p2 = item[1], item[2]
                if abs(p1.x - p2.x) < 1.5 and abs(p1.y - p2.y) > 8:
                    segs.append((p1.x, min(p1.y, p2.y), max(p1.y, p2.y)))
            elif item[0] == "re":
                r = item[1]
                if r.width < 2.5 and r.height > 8:
                    segs.append((r.x0, r.y0, r.y1))
    if not segs:
        return []
    segs.sort(key=lambda s: (round(s[0]), s[1]))
    # 同 x 的分段链式合并为完整列线
    merged = []
    for x, y0, y1 in segs:
        for m in merged:
            if abs(m[0] - x) < 3 and y0 <= m[2] + 5 and y1 >= m[1] - 5:
                m[1] = min(m[1], y0)
                m[2] = max(m[2], y1)
                break
        else:
            merged.append([x, y0, y1])
    # 按 y 范围聚簇成表格
    clusters = []
    for x, y0, y1 in sorted(merged, key=lambda m: (m[1], m[0])):
        for t in clusters:
            if abs(t[1] - y0) < 12 and abs(t[2] - y1) < 12:
                t[0].append(x)
                t[1] = min(t[1], y0)
                t[2] = max(t[2], y1)
                break
        else:
            clusters.append([[x], y0, y1])
    out = []
    for xs, y0, y1 in clusters:
        dedup = []
        for x in sorted(xs):
            if dedup and x - dedup[-1] < 3:
                continue
            dedup.append(x)
        if len(dedup) >= 4:
            out.append((dedup, y0, y1))
    return out


def header_cols(row, tables):
    """识别表头行：整行加粗且能拆出 ≥3 列。

    优先使用表格竖线区域做列边界；返回 (列文本, 列边界, 表格底部 y)。
    """
    segs = [s for s in row["segs"] if s[0].strip()]
    if len(segs) < 3 or not all(s[3] for s in segs):
        return None
    for xs, y0, y1 in tables:
        if y0 - 5 <= row["y"] <= y1 + 5:
            bounds = [(xs[i], xs[i + 1]) for i in range(len(xs) - 1)]
            if len(bounds) >= 3:
                cols = []
                prev_x1 = None
                for t, f, sz, bold, rect in segs:
                    if prev_x1 is not None and rect.x0 - prev_x1 > 18:
                        cols.append([t.strip()])
                    elif not cols:
                        cols.append([t.strip()])
                    else:
                        cols[-1].append(t.strip())
                    prev_x1 = rect.x1
                if len(cols) == len(bounds):
                    return ([(" ".join(c)) for c in cols], bounds, y1)
            break
    cols = []
    prev_x1 = None
    for t, f, sz, bold, rect in segs:
        if prev_x1 is not None and rect.x0 - prev_x1 > 18:
            cols.append({"x0": rect.x0, "x1": rect.x1, "texts": [t.strip()]})
        elif not cols:
            cols.append({"x0": rect.x0, "x1": rect.x1, "texts": [t.strip()]})
        else:
            c = cols[-1]
            c["x1"] = max(c["x1"], rect.x1)
            c["texts"].append(t.strip())
        prev_x1 = rect.x1
    if len(cols) < 3:
        return None
    texts = [(" ".join(c["texts"])) for c in cols]
    bounds = [(c["x0"], c["x1"]) for c in cols]
    left = min(c["x0"] for c in cols) - 20
    right = max(c["x1"] for c in cols) + 30
    expanded = []
    for i, (x0, x1) in enumerate(bounds):
        lo = left if i == 0 else (bounds[i - 1][1] + x0) / 2
        hi = right if i == len(bounds) - 1 else (x1 + bounds[i + 1][0]) / 2
        expanded.append((lo, hi))
    return (texts, expanded, 0)


def row_cells(row, bounds):
    """把行的 span 按列边界归位；返回 (cells, has_col0, ok)。"""
    n = len(bounds)
    cells = [[] for _ in range(n)]
    has_col0 = False
    for t, f, sz, bold, rect in row["segs"]:
        if not t.strip():
            continue
        cx = (rect.x0 + rect.x1) / 2
        col = None
        for i, (x0, x1) in enumerate(bounds):
            if x0 - 8 <= cx <= x1 + 8:
                col = i
                break
        if col is None:
            return None, False, False
        cells[col].append(t.strip())
        if col == 0:
            has_col0 = True
    if not any(cells):
        return cells, has_col0, True
    return cells, has_col0, True


def page_images(doc, page, seen_xrefs, counters):
    infos = []
    for info in page.get_image_info(xrefs=True):
        bbox = info["bbox"]
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        if w < 12 or h < 12:
            continue
        xref = info.get("xref", 0)
        if xref and xref in seen_xrefs:
            infos.append((bbox, seen_xrefs[xref]))
            continue
        counters["n"] += 1
        if xref:
            img = doc.extract_image(xref)
            ext, data = img["ext"], img["image"]
        else:
            ext = "png"
            pix = page.get_pixmap(clip=pymupdf.Rect(bbox))
            data = pix.tobytes("png")
        name = f"miniprogram_p{page.number + 1}_{counters['n']}.{ext}"
        with open(os.path.join(IMG_DIR, name), "wb") as fh:
            fh.write(data)
        if xref:
            seen_xrefs[xref] = name
        infos.append((bbox, name))
    return infos


def find_split(rows, title):
    """在页面行中定位章节标题行，返回行号；找不到返回 None。"""
    t = norm(title)
    for i, r in enumerate(rows):
        nt = norm(r["text"])
        if nt and nt == t:
            return i
    return None


def convert():
    doc = pymupdf.open(PDF_PATH)
    toc = doc.get_toc()
    level1 = [item for item in toc if item[0] == 1]
    # 章节范围：与下一章共享交界页（起始页 = 上一章的结束页）
    ranges = []
    for idx, ch in enumerate(CHAPTERS):
        start = level1[idx][2]
        end = level1[idx + 1][2] if idx + 1 < len(CHAPTERS) else doc.page_count
        ranges.append((start, end))
    toc_items = [
        {"lvl": lvl, "title": title, "page": pg, "norm": norm(title), "used": False}
        for lvl, title, pg in toc
    ]
    # 每章的目录子树：自身的 level-1 项 + 到下一个 level-1 之间的 level-2/3 项
    ch_subtrees = []
    l1_pos = [i for i, it in enumerate(toc_items) if it["lvl"] == 1]
    for idx in range(len(CHAPTERS)):
        lo = l1_pos[idx]
        hi = l1_pos[idx + 1] if idx + 1 < len(l1_pos) else len(toc_items)
        ch_subtrees.append(toc_items[lo:hi])

    os.makedirs(IMG_DIR, exist_ok=True)
    seen_xrefs = {}
    counters = {"n": 0}

    for idx, (ch, (start, end)) in enumerate(zip(CHAPTERS, ranges)):
        subtree = ch_subtrees[idx]
        md = [
            "---",
            f"title: {ch['title']}",
            f"excerpt: {ch['excerpt']}",
            f"author: {AUTHOR}",
            f"date: {DATE}",
            "category:",
            "  - 前端",
            "tag:",
        ]
        md += [f"  - {t}" for t in TAGS]
        md += ["---", "", f"# {ch['title']}", "", ch["excerpt"], "", "<!-- more -->", ""]

        # 待写缓冲
        code_buf = []
        para_buf = []
        table = None  # {"bounds", "header", "ymax", "cur", "cur_y", "rows", "pending", "last_y"}

        def flush_para():
            nonlocal para_buf
            if para_buf:
                md.append(merge_adjacent_bolds(" ".join(para_buf)))
                md.append("")
                para_buf = []

        def flush_code():
            nonlocal code_buf
            if code_buf:
                while code_buf and not code_buf[0].strip():
                    code_buf.pop(0)
                while code_buf and not code_buf[-1].strip():
                    code_buf.pop()
                if code_buf:
                    lang = guess_lang("\n".join(code_buf))
                    md.append("```" + lang)
                    md.extend(code_buf)
                    md.append("```")
                    md.append("")
                code_buf = []

        def flush_table():
            nonlocal table
            if not table:
                return
            # 未被数据行收编的悬空单元格文本按普通段落输出
            for i, cells in enumerate(table["pending"]):
                if i == 0 or not cells:
                    continue
                md.append(" ".join(cells))
                md.append("")
            rows = list(table["rows"])
            if table["cur"]:
                rows.append([" ".join(c) if c else "" for c in table["cur"]])
            rows = [r for r in rows if any(x for x in r)]
            if rows:
                width = max(len(r) for r in rows)
                header = table["header"] + [""] * (width - len(table["header"]))
                md.append("| " + " | ".join(header) + " |")
                md.append("| " + " | ".join(["---"] * width) + " |")
                for r in rows:
                    r = r + [""] * (width - len(r))
                    md.append("| " + " | ".join(x.replace("|", "\\|") for x in r) + " |")
                md.append("")
            table = None

        def flush_all():
            flush_para()
            flush_code()
            flush_table()

        for pno in range(start - 1, min(end, doc.page_count)):
            page = doc[pno]
            pageno = pno + 1
            rows, links = collect_rows(page)
            tables = page_tables(page)
            imgs = page_images(doc, page, seen_xrefs, counters)
            # 交界页拆分：本章起始页跳过章标题之前的内容，结束页截到下章标题之前
            lo, hi = 0, len(rows)
            lo_y = hi_y = None
            if pageno == start and idx > 0:
                sidx = find_split(rows, level1[idx][1])
                if sidx is not None:
                    lo = sidx
                    lo_y = rows[sidx]["y"]
            if idx + 1 < len(CHAPTERS) and pageno == end:
                sidx = find_split(rows, level1[idx + 1][1])
                if sidx is not None:
                    hi = sidx
                    hi_y = rows[sidx]["y"]
            page_rows = rows[lo:hi]
            page_imgs = [
                im
                for im in imgs
                if (lo_y is None or im[0][1] >= lo_y) and (hi_y is None or im[0][1] < hi_y)
            ]
            flush_para()
            flush_code()
            md.append(f"<!-- PDF 第 {pageno} 页 -->")
            md.append("")

            for row in page_rows:
                row["heading"] = None
                nt = norm(row["text"])
                if nt:
                    for item in subtree:
                        if item["used"]:
                            continue
                        if (
                            item["norm"] == nt
                            and item["page"] - 1 <= pageno <= item["page"] + 1
                        ):
                            row["heading"] = item
                            item["used"] = True
                            break

            img_iter = list(page_imgs)
            for row in page_rows:
                # 图片按 y 位置插入
                while img_iter and img_iter[0][0][1] <= row["y"]:
                    flush_all()
                    _, name = img_iter.pop(0)
                    md.append(f"![小程序配图]({IMG_REL}/{name})")
                    md.append("")

                kind = classify_row(row)

                if row["heading"]:
                    flush_all()
                    if row["heading"]["lvl"] >= 2:
                        md.append("")
                        md.append("#" * row["heading"]["lvl"] + " " + row["heading"]["title"])
                        md.append("")
                    continue

                if kind == "blank":
                    flush_para()
                    flush_code()
                    continue

                # 表格处理优先于代码/文本分类（表格单元格可能含等宽字体片段）
                if table is not None:
                    if (table["ymax"] and row["y"] > table["ymax"] + 12) or (
                        row["y"] - table["last_y"] > 55
                    ):
                        flush_table()
                    else:
                        hd = header_cols(row, tables)
                        if hd is not None:
                            texts, bounds, ymax = hd
                            if norm("".join(texts)) == norm("".join(table["header"])):
                                # 跨页重复表头：跳过，刷新列边界与表格范围
                                table["bounds"] = bounds
                                table["pending"] = [[] for _ in bounds]
                                table["ymax"] = ymax
                                table["last_y"] = row["y"]
                                continue
                            flush_table()
                            table = {
                                "bounds": bounds,
                                "header": texts,
                                "ymax": ymax,
                                "cur": None,
                                "cur_y": None,
                                "rows": [],
                                "pending": [[] for _ in bounds],
                                "last_y": row["y"],
                            }
                            continue
                        cells, has_col0, ok = row_cells(row, table["bounds"])
                        if ok:
                            if has_col0:
                                merged = [list(c) for c in cells]
                                for i in range(len(merged)):
                                    merged[i] = table["pending"][i] + merged[i]
                                table["pending"] = [[] for _ in table["bounds"]]
                                if table["cur"]:
                                    table["rows"].append(
                                        [" ".join(c) if c else "" for c in table["cur"]]
                                    )
                                table["cur"] = merged
                                table["cur_y"] = row["y"]
                                table["last_y"] = row["y"]
                            else:
                                # 无首列内容：按与当前行锚点的距离决定归属
                                dist = (
                                    abs(row["y"] - table["cur_y"])
                                    if table["cur"] is not None and table.get("cur_y") is not None
                                    else 999
                                )
                                if table["cur"] is not None and dist <= 17:
                                    for i, c in enumerate(cells):
                                        if i and c:
                                            table["cur"][i].extend(c)
                                else:
                                    for i, c in enumerate(cells):
                                        if i and c:
                                            table["pending"][i].extend(c)
                            continue
                        flush_table()

                hd = header_cols(row, tables)
                if hd is not None:
                    texts, bounds, ymax = hd
                    table = {
                        "bounds": bounds,
                        "header": texts,
                        "ymax": ymax,
                        "cur": None,
                        "cur_y": None,
                        "rows": [],
                        "pending": [[] for _ in bounds],
                        "last_y": row["y"],
                    }
                    continue

                if kind == "code":
                    flush_para()
                    line = "".join(t for t, f, s, b, r in row["segs"])
                    code_buf.append(line.rstrip())
                    continue

                flush_code()
                text = row["text"].strip()
                line = inline_md(row, links).strip()
                if not line:
                    flush_para()
                    continue
                bold_big = any(b and s >= 12 for _, _, s, b, _ in row["segs"])
                if bold_big:
                    flush_para()
                    md.append("## " + text)
                    md.append("")
                    continue
                if LIST_RE.match(row["text"]):
                    flush_para()
                    para_buf.append(line)
                    continue
                para_buf.append(line)

            flush_para()
            flush_code()
            for _, name in img_iter:
                md.append(f"![小程序配图]({IMG_REL}/{name})")
                md.append("")

        flush_all()
        out = []
        for line in md:
            if line == "" and out and out[-1] == "":
                continue
            out.append(line)
        text = "\n".join(out).rstrip() + "\n"
        path = os.path.join(OUT_DIR, ch["slug"] + ".md")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(text)
        print("wrote", os.path.relpath(path, ROOT), len(text), "chars")


if __name__ == "__main__":
    if os.path.isdir(IMG_DIR):
        shutil.rmtree(IMG_DIR, ignore_errors=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    convert()
