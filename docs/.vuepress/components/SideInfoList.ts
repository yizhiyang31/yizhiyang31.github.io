import { defineComponent, h, ref } from "vue";
import { RouteLink } from "vuepress/client";
import { IconBase } from "vuepress-shared/client";
import CategoriesInfo from "@theme-hope/components/blog/CategoriesInfo.js";
import TagsInfo from "@theme-hope/components/blog/TagsInfo.js";
import TimelineList from "@theme-hope/components/blog/TimelineList.js";
import DropTransition from "@theme-hope/components/transitions/DropTransition.js";
import { CategoryIcon, TagIcon, TimelineIcon } from "@theme-hope/components/blog/icons.js";
import { useBlogLocale } from "@theme-hope/composables/blog/useBlogLocale.js";
import "@theme-hope/styles/blog/info-list.scss";
import bookFiles from "../books-data.json";

const BookIcon = () =>
  h(IconBase, { name: "book" }, () =>
    h("path", {
      d: "M896 128H512c-52.9 0-96 43.1-96 96v576c0 35.3 28.7 64 64 64h416c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32zM448 800c-17.7 0-32-14.3-32-32V224c0-52.9 43.1-96 96-96h64v672H448zM192 128h160v64H192c-17.7 0-32 14.3-32 32v576c0 17.7 14.3 32 32 32h160v64H192c-52.9 0-96-43.1-96-96V224c0-52.9 43.1-96 96-96z",
    }),
  );

const bookTitles: Record<string, string> = {
  "javascript-advanced-guide-4.pdf": "JavaScript 高级程序设计（第 4 版）",
  "you-dont-know-js-vol-1.pdf": "你不知道的 JavaScript（上卷）",
  "you-dont-know-js-vol-2.pdf": "你不知道的 JavaScript（中卷）",
  "you-dont-know-js-vol-3.pdf": "你不知道的 JavaScript（下卷）",
  "css-world.pdf": "CSS 世界",
  "css-secrets.pdf": "CSS 揭秘",
  "gin-framework-tutorial.pdf": "Gin 框架教程（第 4 版）",
  "go-zero-practice.pdf": "go-zero 入门实战",
};

const getBookTitle = (file: string): string =>
  bookTitles[file] ??
  file
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();

export default defineComponent({
  name: "SideInfoList",

  setup() {
    const blogLocale = useBlogLocale();
    const activeType = ref("book");

    const buttons = [
      { key: "book", label: "书籍", icon: BookIcon },
      { key: "category", label: () => blogLocale.value.category, icon: CategoryIcon },
      { key: "tag", label: () => blogLocale.value.tag, icon: TagIcon },
      { key: "timeline", label: () => blogLocale.value.timeline, icon: TimelineIcon },
    ];

    const BookInfo = () =>
      h("div", { class: "vp-star-article-wrapper vp-book-info-wrapper" }, [
        h("div", { class: "title" }, [
          h(BookIcon),
          h("span", { class: "num" }, bookFiles.length),
          "书籍",
        ]),
        h("hr"),
        bookFiles.length
          ? h(
              "ul",
              { class: "vp-star-articles vp-book-info-list" },
              bookFiles.slice(0, 5).map(({ file, size }) =>
                h(
                  "li",
                  { class: "vp-star-article" },
                  h(
                    RouteLink,
                    { to: "/books/", class: "vp-book-info-link" },
                    [
                      h("span", { class: "vp-book-info-title" }, getBookTitle(file)),
                      h("span", { class: "vp-book-info-size" }, size),
                    ],
                  ),
                ),
              ),
            )
          : h("div", { class: "vp-star-article-empty" }, "暂无书籍"),
        h(RouteLink, { to: "/books/", class: "vp-book-info-more" }, "查看全部书籍 →"),
      ]);

    return () =>
      h("div", { class: "vp-blog-infos" }, [
        h(
          "div",
          { class: "vp-blog-type-switcher" },
          buttons.map(({ key, label, icon }) => {
            const ariaLabel = typeof label === "string" ? label : label();

            return h(
              "button",
              {
                type: "button",
                class: "vp-blog-type-button",
                onClick: () => {
                  activeType.value = key;
                },
              },
              h(
                "div",
                {
                  class: ["vp-blog-type-icon-wrapper", { active: activeType.value === key }],
                  "aria-label": ariaLabel,
                  "data-balloon-pos": "down",
                },
                icon(),
              ),
            );
          }),
        ),
        h(DropTransition, () => {
          if (activeType.value === "book") return h(BookInfo);
          if (activeType.value === "category") return h(CategoriesInfo);
          if (activeType.value === "tag") return h(TagsInfo);
          return h(TimelineList);
        }),
      ]);
  },
});
