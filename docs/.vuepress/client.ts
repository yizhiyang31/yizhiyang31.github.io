import { Fragment, defineComponent, h } from "vue";
import { defineClientConfig, useFrontmatter } from "vuepress/client";
import MainLayout from "@theme-hope/components/base/MainLayout.js";
import SkipLink from "@theme-hope/components/base/SkipLink.js";
import BloggerInfo from "@theme-hope/components/blog/BloggerInfo.js";
import CategoryPage from "@theme-hope/components/blog/CategoryPage.js";
import DefaultBlogLayout from "@theme-hope/layouts/blog/Blog.js";

const CategoryBlogLayout = defineComponent({
  name: "CategoryBlogLayout",
  slots: Object,
  setup(_props, { slots }) {
    const frontmatter = useFrontmatter();

    return () => {
      if (frontmatter.value.blog?.type !== "category") {
        return h(DefaultBlogLayout, null, slots);
      }

      return h(Fragment, null, [
        h(SkipLink),
        h(
          MainLayout,
          {
            containerClass: "category-with-sidebar",
            noToc: true,
          },
          {
            ...slots,
            navScreenBottom: slots.navScreenBottom ?? (() => h(BloggerInfo)),
            default: slots.default ?? (() => h(CategoryPage, null, slots)),
          },
        ),
      ]);
    };
  },
});

export default defineClientConfig({
  layouts: {
    Blog: CategoryBlogLayout,
  },
});
