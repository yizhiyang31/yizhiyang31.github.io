<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { withBase } from "vuepress/client";

type TabKey = "technical";

interface Book {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  level: string;
  description: string;
  file: string;
  size: string;
  coverLabel: string;
  coverTitle: string;
  coverEdition: string;
  coverTheme: "blue" | "amber" | "teal" | "violet";
  tab: TabKey;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "technical", label: "技术书籍" },
];

const books: Book[] = [
  {
    id: "javascript-advanced-guide-4",
    title: "JavaScript 高级程序设计（第 4 版）",
    subtitle: "Professional JavaScript for Web Developers, 4th Edition",
    category: "前端 · JavaScript",
    level: "经典进阶",
    description:
      "从语言基础、DOM 与 BOM，到异步编程、模块化与企业级应用开发，系统梳理 JavaScript 的核心知识体系。",
    file: "/books/javascript-advanced-guide-4.pdf",
    size: "13.7 MB",
    coverLabel: "JS",
    coverTitle: "JAVASCRIPT",
    coverEdition: "4th Edition",
    coverTheme: "blue",
    tab: "technical",
  },
  {
    id: "you-dont-know-js-1",
    title: "你不知道的 JavaScript（上卷）",
    subtitle: "You Don't Know JS: Up & Going · Scope & Closures",
    category: "前端 · JavaScript",
    level: "基础进阶",
    description:
      "从语言基础与函数作用域讲起，系统梳理作用域链、闭包与模块化，是理解 JavaScript 运行机制的第一站。",
    file: "/books/you-dont-know-js-vol-1.pdf",
    size: "10.2 MB",
    coverLabel: "JS",
    coverTitle: "YOU DON'T KNOW JS",
    coverEdition: "上卷",
    coverTheme: "amber",
    tab: "technical",
  },
  {
    id: "you-dont-know-js-2",
    title: "你不知道的 JavaScript（中卷）",
    subtitle: "You Don't Know JS: this & Object Prototypes · Types & Grammar",
    category: "前端 · JavaScript",
    level: "核心进阶",
    description:
      "深入 this 绑定规则、对象与原型链，以及类型转换和语法细节，完整还原 JavaScript 的对象模型。",
    file: "/books/you-dont-know-js-vol-2.pdf",
    size: "35.0 MB",
    coverLabel: "JS",
    coverTitle: "YOU DON'T KNOW JS",
    coverEdition: "中卷",
    coverTheme: "blue",
    tab: "technical",
  },
  {
    id: "you-dont-know-js-3",
    title: "你不知道的 JavaScript（下卷）",
    subtitle: "You Don't Know JS: Async & Performance · ES6 & Beyond",
    category: "前端 · JavaScript",
    level: "深入异步",
    description:
      "讲解回调、Promise、生成器等异步编程模型，并覆盖 ES6 及之后的新特性与性能实践。",
    file: "/books/you-dont-know-js-vol-3.pdf",
    size: "8.3 MB",
    coverLabel: "JS",
    coverTitle: "YOU DON'T KNOW JS",
    coverEdition: "下卷",
    coverTheme: "violet",
    tab: "technical",
  },
  {
    id: "css-world",
    title: "CSS 世界",
    subtitle: "CSS World",
    category: "前端 · CSS",
    level: "进阶",
    description:
      "从流、盒模型、选择器讲到定位、层叠与布局，结合大量实战案例讲透 CSS 的底层原理与实现细节。",
    file: "/books/css-world.pdf",
    size: "42.6 MB",
    coverLabel: "CSS",
    coverTitle: "CSS WORLD",
    coverEdition: "张鑫旭",
    coverTheme: "teal",
    tab: "technical",
  },
];

const activeTab = ref<TabKey>("technical");
const previewBook = ref<Book | null>(null);
const previewVisible = computed({
  get: () => previewBook.value !== null,
  set: (visible: boolean) => {
    if (!visible) previewBook.value = null;
  },
});

const visibleBooks = computed(() =>
  books.filter((book) => book.tab === activeTab.value),
);

const currentTabLabel = computed(
  () => tabs.find((tab) => tab.key === activeTab.value)?.label ?? "",
);

const resolveUrl = (file: string) => withBase(file);

const openPreview = (book: Book) => {
  previewBook.value = book;
};

const closePreview = () => {
  previewBook.value = null;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") closePreview();
};

let previousOverflow = "";
let pageContainer: HTMLElement | null = null;

watch(previewVisible, (visible) => {
  if (typeof document === "undefined") return;

  if (visible) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = previousOverflow;
  }
});

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  pageContainer = document.querySelector<HTMLElement>(".theme-container");
  pageContainer?.classList.add("books-page");
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  pageContainer?.classList.remove("books-page");
  if (typeof document !== "undefined") {
    document.body.style.overflow = previousOverflow;
  }
});
</script>

<template>
  <div class="book-shelf">
    <header class="book-shelf__header">
      <span class="book-shelf__eyebrow">BOOKSHELF · 书架</span>
      <h1 class="book-shelf__title">书籍</h1>
      <p class="book-shelf__intro">
        收藏正在阅读与反复查阅的书，支持在页面内直接预览。
      </p>
    </header>

    <div class="book-shelf__tabs" role="tablist" aria-label="书籍分类">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="book-shelf__tab"
        :class="{ 'is-active': activeTab === tab.key }"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.key"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="book-shelf__tab-count">
          {{ books.filter((book) => book.tab === tab.key).length }}
        </span>
      </button>
    </div>

    <div class="book-shelf__grid" role="tabpanel" :aria-label="currentTabLabel">
      <article v-for="book in visibleBooks" :key="book.id" class="book-card">
        <button
          class="book-card__cover"
          :class="`book-card__cover--${book.coverTheme}`"
          type="button"
          :aria-label="`预览 ${book.title}`"
          @click="openPreview(book)"
        >
          <span class="book-card__spine"></span>
          <span class="book-card__cover-label">{{ book.coverLabel }}</span>
          <span class="book-card__cover-title">{{ book.coverTitle }}</span>
          <span class="book-card__cover-edition">{{ book.coverEdition }}</span>
          <span class="book-card__cover-glow"></span>
        </button>

        <div class="book-card__body">
          <div class="book-card__tags">
            <span class="book-card__tag">{{ book.category }}</span>
            <span class="book-card__level">{{ book.level }}</span>
          </div>
          <h2 class="book-card__title">{{ book.title }}</h2>
          <p class="book-card__subtitle">{{ book.subtitle }}</p>
          <p class="book-card__description">{{ book.description }}</p>
          <div class="book-card__footer">
            <span class="book-card__meta">PDF · {{ book.size }}</span>
            <div class="book-card__actions">
              <a
                class="book-card__action book-card__action--ghost"
                :href="resolveUrl(book.file)"
                target="_blank"
                rel="noopener noreferrer"
              >
                新标签打开
              </a>
              <button
                class="book-card__action book-card__action--primary"
                type="button"
                @click="openPreview(book)"
              >
                在线预览
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>

    <Teleport to="body">
      <Transition name="book-preview">
        <div
          v-if="previewBook"
          class="book-preview"
          role="dialog"
          aria-modal="true"
          :aria-label="`${previewBook.title} 预览`"
          @click.self="closePreview"
        >
          <div class="book-preview__panel">
            <header class="book-preview__header">
              <div class="book-preview__heading">
                <span class="book-preview__badge">PREVIEW</span>
                <h2>{{ previewBook.title }}</h2>
              </div>
              <button
                class="book-preview__close"
                type="button"
                aria-label="关闭预览"
                @click="closePreview"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </header>

            <div class="book-preview__viewer">
              <iframe
                :key="previewBook.id"
                :src="resolveUrl(previewBook.file)"
                :title="`${previewBook.title} PDF 预览`"
                frameborder="0"
              />
            </div>

            <footer class="book-preview__footer">
              <p>若浏览器未显示内嵌 PDF，可在新标签中打开或下载后阅读。</p>
              <div class="book-preview__actions">
                <a
                  :href="resolveUrl(previewBook.file)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  新标签打开
                </a>
                <a :href="resolveUrl(previewBook.file)" download>
                  下载 PDF
                </a>
              </div>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.book-shelf {
  --book-radius: 16px;
  --book-border: 1px solid rgba(15, 23, 42, 0.08);
  --book-shadow: 0 10px 32px -20px rgba(15, 23, 42, 0.35);

  max-width: 1080px;
  margin: 0 auto;
  padding: 2.5rem 0 4rem;
  font-family: var(--font-ui);
}

.book-shelf__eyebrow {
  display: inline-block;
  margin-bottom: 0.65rem;
  color: var(--vp-c-brand-1);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.book-shelf__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 1.6rem + 1.5vw, 2.75rem);
  font-weight: 700;
  line-height: 1.15;
}

.book-shelf__intro {
  max-width: 34rem;
  margin: 0.75rem 0 0;
  color: var(--vp-c-text-2, var(--vp-c-text));
  font-size: 0.95rem;
  line-height: 1.75;
}

.book-shelf__tabs {
  display: flex;
  gap: 0.35rem;
  margin: 2rem 0 1.5rem;
  padding: 0.3rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  width: fit-content;
}

.book-shelf__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.1rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--vp-c-text-2, var(--vp-c-text));
  cursor: pointer;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.book-shelf__tab:hover {
  color: var(--vp-c-brand-1);
}

.book-shelf__tab.is-active {
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  box-shadow: 0 6px 14px -8px rgba(42, 105, 237, 0.9);
  color: #fff;
}

.book-shelf__tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
}

.book-shelf__tab.is-active .book-shelf__tab-count {
  background: rgba(255, 255, 255, 0.25);
}

.book-shelf__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
}

.book-card {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  overflow: hidden;
  border: var(--book-border);
  border-radius: var(--book-radius);
  background: var(--card-bg, var(--vp-c-bg-elv));
  box-shadow: var(--book-shadow);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;
}

.book-card:hover {
  transform: translateY(-2px);
  border-color: rgba(42, 105, 237, 0.35);
  box-shadow: 0 16px 36px -22px rgba(42, 105, 237, 0.65);
}

.book-card__cover {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 265px;
  padding: 1.5rem;
  border: 0;
  background: linear-gradient(150deg, #1e3a8a, #2a69ed 55%, #60a5fa);
  color: #fff;
  cursor: pointer;
  overflow: hidden;
  text-align: center;
}

.book-card__cover--blue {
  background: linear-gradient(150deg, #1e3a8a, #2a69ed 55%, #60a5fa);
}

.book-card__cover--amber {
  background: linear-gradient(150deg, #7c2d12, #ea580c 55%, #fbbf24);
}

.book-card__cover--teal {
  background: linear-gradient(150deg, #134e4a, #0d9488 55%, #5eead4);
}

.book-card__cover--violet {
  background: linear-gradient(150deg, #4c1d95, #7c3aed 55%, #c4b5fd);
}

.book-card__spine {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 12px;
  background: rgba(8, 20, 56, 0.45);
  box-shadow: inset -3px 0 6px rgba(0, 0, 0, 0.2);
}

.book-card__cover-label {
  font-family: var(--font-display);
  font-size: 4rem;
  font-weight: 700;
  letter-spacing: -0.06em;
  line-height: 1;
  text-shadow: 0 6px 18px rgba(8, 20, 56, 0.35);
}

.book-card__cover-title {
  margin-top: 0.85rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.22em;
}

.book-card__cover-edition {
  margin-top: 0.35rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
}

.book-card__cover-glow {
  position: absolute;
  right: -40px;
  bottom: -60px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  filter: blur(6px);
}

.book-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.6rem 1.75rem;
}

.book-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.book-card__tag,
.book-card__level {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.book-card__tag {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.book-card__level {
  background: rgba(15, 23, 42, 0.06);
  color: var(--vp-c-text-2, var(--vp-c-text));
}

.book-card__title {
  margin: 0.15rem 0 0;
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.35;
}

.book-card__subtitle {
  margin: 0;
  color: var(--vp-c-text-2, var(--vp-c-text));
  font-size: 0.78rem;
  font-style: italic;
  line-height: 1.5;
}

.book-card__description {
  margin: 0.35rem 0 0;
  color: var(--vp-c-text-2, var(--vp-c-text));
  font-size: 0.88rem;
  line-height: 1.75;
}

.book-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 0.85rem;
}

.book-card__meta {
  color: var(--vp-c-text-2, var(--vp-c-text));
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.book-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.book-card__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.15rem;
  padding: 0 0.95rem;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 9px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.book-card__action:hover {
  transform: translateY(-1px);
  text-decoration: none;
}

.book-card__action--ghost {
  background: transparent;
  color: var(--vp-c-brand-1);
}

.book-card__action--ghost:hover {
  background: var(--vp-c-brand-soft);
}

.book-card__action--primary {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: #fff;
  cursor: pointer;
}

.book-card__action--primary:hover {
  background: var(--vp-c-brand-2);
}

.book-preview {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(8, 15, 30, 0.72);
  backdrop-filter: blur(6px);
}

.book-preview__panel {
  display: flex;
  flex-direction: column;
  width: min(1100px, 100%);
  height: min(860px, 92vh);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 16px;
  background: var(--vp-c-bg);
  box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.7);
}

.book-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.book-preview__heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.book-preview__badge {
  flex-shrink: 0;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.book-preview__heading h2 {
  overflow: hidden;
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-preview__close {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2, var(--vp-c-text));
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.book-preview__close:hover {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.book-preview__close svg {
  width: 1rem;
  height: 1rem;
}

.book-preview__viewer {
  flex: 1;
  min-height: 0;
  background: #52565e;
}

.book-preview__viewer iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.book-preview__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 0.75rem;
}

.book-preview__footer p {
  margin: 0;
  color: var(--vp-c-text-2, var(--vp-c-text));
}

.book-preview__actions {
  display: flex;
  gap: 0.75rem;
}

.book-preview__actions a {
  color: var(--vp-c-brand-1);
  font-weight: 600;
  text-decoration: none;
}

.book-preview__actions a:hover {
  text-decoration: underline;
}

.book-preview-enter-active,
.book-preview-leave-active {
  transition: opacity 0.2s ease;
}

.book-preview-enter-from,
.book-preview-leave-to {
  opacity: 0;
}

:global([data-theme="dark"]) .book-card__level,
:global([data-theme="dark"]) .book-shelf__tab-count {
  background: rgba(148, 163, 184, 0.14);
}

@media (max-width: 719px) {
  .book-shelf {
    padding: 1.5rem 0 3rem;
  }

  .book-card {
    grid-template-columns: 1fr;
  }

  .book-card__cover {
    min-height: 170px;
  }

  .book-card__cover-label {
    font-size: 3rem;
  }

  .book-card__body {
    padding: 1.25rem;
  }

  .book-preview {
    padding: 0.5rem;
  }

  .book-preview__panel {
    height: 96vh;
    border-radius: 12px;
  }

  .book-preview__footer {
    justify-content: center;
    text-align: center;
  }
}
</style>
