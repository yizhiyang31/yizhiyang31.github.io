import { Fragment, computed, defineComponent, h, onMounted, watch } from "vue";
import {
  defineClientConfig,
  useFrontmatter,
  useRoute,
  useRouter,
} from "vuepress/client";
import MainLayout from "@theme-hope/components/base/MainLayout.js";
import SkipLink from "@theme-hope/components/base/SkipLink.js";
import ArticleList from "@theme-hope/components/blog/ArticleList.js";
import BloggerInfo from "@theme-hope/components/blog/BloggerInfo.js";
import CategoryPage from "@theme-hope/components/blog/CategoryPage.js";
import TagList from "@theme-hope/components/blog/TagList.js";
import { useTagMap } from "@theme-hope/composables/blog/useTagMap.js";
import DefaultBlogLayout from "@theme-hope/layouts/blog/Blog.js";
import BookShelf from "./components/BookShelf.vue";
import ToolShelf from "./components/ToolShelf.vue";

const sidebarDefaultArticles: Record<string, string> = {
  "/category/backend/": "/posts/backend/golang/01-go-intro-and-setup.html",
  "/category/engineering/": "/posts/engineering/vuepress-theme-hope-blog.html",
};

const TagRootPage = defineComponent({
  name: "TagRootPage",
  slots: Object,
  setup(_props, { slots }) {
    const tagMap = useTagMap();

    const firstTagItems = computed(() => {
      const tags = Object.values(tagMap.value.map).sort(
        (a, b) => b.items.length - a.items.length,
      );

      return tags[0]?.items ?? [];
    });

    return () =>
      h(CategoryPage, null, {
        ...slots,
        default: () => [
          h(TagList),
          h(ArticleList, { items: firstTagItems.value }, slots),
        ],
      });
  },
});

const CategoryBlogLayout = defineComponent({
  name: "CategoryBlogLayout",
  slots: Object,
  setup(_props, { slots }) {
    const frontmatter = useFrontmatter();
    const route = useRoute();
    const router = useRouter();

    const redirectToFirstArticle = () => {
      const target = sidebarDefaultArticles[route.path];

      if (target) void router.replace(target);
    };

    onMounted(() => {
      redirectToFirstArticle();
      watch(() => route.path, redirectToFirstArticle);
    });

    const isTagRoot = computed(() => {
      const blog = frontmatter.value.blog;

      return blog?.type === "category" && blog.key === "tag" && !blog.name;
    });

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
            default:
              slots.default ??
              (() =>
                isTagRoot.value
                  ? h(TagRootPage, null, slots)
                  : h(CategoryPage, null, slots)),
          },
        ),
      ]);
    };
  },
});

export default defineClientConfig({
  enhance: ({ app }) => {
    app.component("BookShelf", BookShelf);
    app.component("ToolShelf", ToolShelf);
  },
  layouts: {
    Blog: CategoryBlogLayout,
  },
});
