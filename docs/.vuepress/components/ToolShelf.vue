<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import toolsData from "../tools-data.json";

interface ToolItem {
  name: string;
  badge: string;
  description: string;
  url: string;
}

interface ToolCategory {
  key: string;
  label: string;
  summary: string;
  tools: ToolItem[];
}

interface ToolTab {
  key: string;
  label: string;
  hint: string;
  categories: ToolCategory[];
}

interface ToolCatalog {
  tabs: ToolTab[];
}

const catalog = toolsData as ToolCatalog;
const tabs = catalog.tabs;
const activeKey = ref(tabs[0]?.key ?? "");

const currentTab = computed(
  () => tabs.find((tab) => tab.key === activeKey.value) ?? tabs[0] ?? null,
);
const currentCategories = computed(() => currentTab.value?.categories ?? []);

const keyword = ref("");
const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase());
const isSearching = computed(() => normalizedKeyword.value.length > 0);

const matchesKeyword = (tool: ToolItem): boolean =>
  !normalizedKeyword.value || tool.name.toLowerCase().includes(normalizedKeyword.value);

const countTools = (tab: ToolTab): number =>
  tab.categories.reduce((sum, category) => sum + category.tools.filter(matchesKeyword).length, 0);

const visibleCategories = computed(() =>
  currentCategories.value
    .map((category) => ({ ...category, tools: category.tools.filter(matchesKeyword) }))
    .filter((category) => category.tools.length > 0),
);

const tabsWithMatches = computed(() =>
  tabs.filter((tab) => countTools(tab) > 0).map((tab) => tab.label),
);

const clearSearch = (): void => {
  keyword.value = "";
};

const onSearchKeydown = (event: KeyboardEvent): void => {
  if (event.key !== "Escape") return;
  clearSearch();
  (event.target as HTMLInputElement).blur();
};

const failedIcons = reactive(new Set<string>());

const faviconUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    const basePath = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.origin}${basePath}/favicon.ico`;
  } catch {
    return "";
  }
};

const onIconError = (name: string): void => {
  failedIcons.add(name);
};

let pageContainer: HTMLElement | null = null;

onMounted(() => {
  pageContainer = document.querySelector<HTMLElement>(".theme-container");
  pageContainer?.classList.add("tools-page");
});

onBeforeUnmount(() => {
  pageContainer?.classList.remove("tools-page");
});

const onTabKeydown = (event: KeyboardEvent, index: number): void => {
  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];

  if (!keys.includes(event.key) || tabs.length === 0) return;
  event.preventDefault();

  let nextIndex = index;
  if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
  if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = tabs.length - 1;

  activeKey.value = tabs[nextIndex].key;

  const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>(
    '[role="tab"]',
  );
  buttons?.[nextIndex]?.focus();
};
</script>

<template>
  <div class="tool-shelf">
    <header class="tool-shelf__header">
      <span class="tool-shelf__eyebrow">TOOLBOX · 工具</span>
      <h1 class="tool-shelf__title">常用工具</h1>
    </header>

    <div class="tool-search">
      <label class="tool-search__field">
        <svg class="tool-search__icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8" />
          <path
            d="M16.5 16.5L21 21"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
        <input
          v-model="keyword"
          class="tool-search__input"
          type="search"
          placeholder="搜索工具名称，如 Element、ECharts、Kimi"
          aria-label="按名称搜索工具"
          @keydown="onSearchKeydown"
        />
      </label>
      <button
        v-if="isSearching"
        class="tool-search__clear"
        type="button"
        aria-label="清除搜索关键词"
        @click="clearSearch"
      >
        清除
      </button>
    </div>

    <p v-if="isSearching" class="tool-search__summary" role="status" aria-live="polite">
      在「{{ currentTab?.label }}」中找到 {{ visibleCategories.reduce((sum, category) => sum + category.tools.length, 0) }} 个匹配工具
      <template v-if="tabsWithMatches.length > 1">
        ，其他分类也有匹配：{{ tabsWithMatches.filter((label) => label !== currentTab?.label).join("、") }}
      </template>
    </p>

    <div class="tool-tabs" role="tablist" aria-label="工具分类">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.key"
        class="tool-tabs__tab"
        :class="{ 'is-active': activeKey === tab.key }"
        type="button"
        role="tab"
        :aria-selected="activeKey === tab.key"
        @click="activeKey = tab.key"
        @keydown="onTabKeydown($event, index)"
      >
        {{ tab.label }}
        <span class="tool-tabs__count">{{ countTools(tab) }}</span>
      </button>
    </div>

    <Transition name="tool-panel" mode="out-in">
      <section
        :key="currentTab?.key ?? 'empty'"
        class="tool-panel"
        role="tabpanel"
        :aria-label="currentTab?.label"
      >
        <div v-if="visibleCategories.length" class="tool-categories">
          <section v-for="category in visibleCategories" :key="category.key" class="tool-category">
            <header class="tool-category__header">
              <div>
                <h2 class="tool-category__title">{{ category.label }}</h2>
              </div>
              <span class="tool-category__count">{{ category.tools.length }} 个工具</span>
            </header>

            <div class="tool-grid">
              <article v-for="tool in category.tools" :key="tool.name" class="tool-card">
                <span class="tool-card__badge">
                  <img
                    v-if="faviconUrl(tool.url) && !failedIcons.has(tool.name)"
                    class="tool-card__icon"
                    :src="faviconUrl(tool.url)"
                    :alt="`${tool.name} 图标`"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    @error="onIconError(tool.name)"
                  />
                  <template v-else>{{ tool.badge }}</template>
                </span>
                <div class="tool-card__body">
                  <h3 class="tool-card__name">{{ tool.name }}</h3>
                  <p class="tool-card__description">{{ tool.description }}</p>
                  <a
                    class="tool-card__link"
                    :href="tool.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    访问官网
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M7 17L17 7M9 7h8v8"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </a>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div v-else class="tool-empty">
          <template v-if="isSearching">
            <h2>没有找到匹配的工具</h2>
            <p>
              「{{ currentTab?.label }}」中没有名称包含「{{ keyword.trim() }}」的工具，可换个关键词或切换到其他分类。
            </p>
          </template>
          <template v-else>
            <h2>暂无工具数据</h2>
            <p>请在 tools-data.json 中添加工具分类与工具信息。</p>
          </template>
        </div>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.tool-shelf {
  --tool-radius: 16px;
  --tool-border: 1px solid rgba(15, 23, 42, 0.08);
  --tool-shadow: 0 12px 34px -24px rgba(15, 23, 42, 0.45);

  max-width: 1080px;
  margin: 0 auto;
  padding: 2.5rem 0 4rem;
  font-family: var(--font-ui);
}

.tool-shelf__eyebrow {
  display: inline-block;
  margin-bottom: 0.65rem;
  color: var(--vp-c-brand-1);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.tool-shelf__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 1.6rem + 1.5vw, 2.75rem);
  font-weight: 700;
  line-height: 1.15;
}

.tool-shelf__intro {
  max-width: 38rem;
  margin: 0.75rem 0 0;
  color: var(--vp-c-text-2, var(--vp-c-text));
  font-size: 0.95rem;
  line-height: 1.75;
}

.tool-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.75rem 0 0;
}

.tool-search__field {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  width: min(26rem, 100%);
  padding: 0 0.85rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.tool-search__field:focus-within {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.tool-search__icon {
  flex: none;
  width: 1rem;
  height: 1rem;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
}

.tool-search__input {
  width: 100%;
  min-width: 0;
  padding: 0.6rem 0;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-1, var(--vp-c-text));
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
}

.tool-search__input::placeholder {
  color: var(--vp-c-text-3, var(--vp-c-text-2));
}

.tool-search__input::-webkit-search-cancel-button {
  display: none;
}

.tool-search__clear {
  flex: none;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-2, var(--vp-c-text));
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}

.tool-search__clear:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.tool-search__summary {
  margin: 0.7rem 0 0;
  color: var(--vp-c-text-2, var(--vp-c-text));
  font-size: 0.85rem;
  line-height: 1.7;
}

.tool-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  width: fit-content;
  max-width: 100%;
  margin: 2rem 0 1.5rem;
  padding: 0.3rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
}

.tool-tabs__tab {
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

.tool-tabs__tab:hover {
  color: var(--vp-c-brand-1);
}

.tool-tabs__tab:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.tool-tabs__tab.is-active {
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  box-shadow: 0 6px 14px -8px rgba(42, 105, 237, 0.9);
  color: #fff;
}

.tool-tabs__count {
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

.tool-tabs__tab.is-active .tool-tabs__count {
  background: rgba(255, 255, 255, 0.25);
}

.tool-panel__hint {
  margin: 0 0 1.75rem;
  color: var(--vp-c-text-2, var(--vp-c-text));
  font-size: 0.9rem;
  line-height: 1.7;
}

.tool-categories {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.tool-category__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.1rem;
}

.tool-category__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: var(--ls-tight);
}

.tool-category__summary {
  margin: 0.25rem 0 0;
  color: var(--vp-c-text-2, var(--vp-c-text));
  font-size: var(--text-sm);
}

.tool-category__count {
  flex: none;
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 0.85rem;
}

.tool-card {
  display: flex;
  gap: 0.9rem;
  min-width: 0;
  padding: 1rem;
  border: var(--tool-border);
  border-radius: var(--tool-radius);
  background: var(--card-bg, var(--vp-c-bg-elv));
  box-shadow: var(--tool-shadow);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;
}

.tool-card:hover {
  transform: translateY(-2px);
  border-color: rgba(42, 105, 237, 0.35);
  box-shadow:
    0 8px 18px -10px rgba(42, 105, 237, 0.45),
    0 18px 36px -24px rgba(15, 23, 42, 0.35);
}

.tool-card__badge {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 10px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tool-card__icon {
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 6px;
  background: var(--vp-c-bg-elv, #fff);
  object-fit: contain;
}

.tool-card__body {
  min-width: 0;
}

.tool-card__name {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 700;
  line-height: 1.35;
}

.tool-card__description {
  margin: 0.35rem 0 0.7rem;
  color: var(--vp-c-text-2, var(--vp-c-text));
  font-size: var(--text-sm);
  line-height: 1.65;
}

.tool-card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--vp-c-brand-1);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
}

.tool-card__link:hover {
  text-decoration: underline;
}

.tool-card__link svg {
  width: 0.9rem;
  height: 0.9rem;
}

.tool-empty {
  padding: 3rem 1rem;
  border: 1px dashed var(--vp-c-divider);
  border-radius: var(--tool-radius);
  text-align: center;
}

.tool-empty h2 {
  margin: 0;
  font-size: var(--text-lg);
}

.tool-empty p {
  margin: 0.5rem 0 0;
  color: var(--vp-c-text-2, var(--vp-c-text));
  font-size: var(--text-sm);
}

.tool-shelf__footer {
  margin-top: 2.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3, var(--vp-c-text-2));
  font-size: var(--text-xs);
}

.tool-shelf__footer code {
  font-family: var(--font-mono);
}

.tool-panel-enter-active,
.tool-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tool-panel-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.tool-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

[data-theme="dark"] .tool-card {
  --tool-border: 1px solid rgba(148, 163, 184, 0.16);
}

[data-theme="dark"] .tool-tabs__count {
  background: rgba(148, 163, 184, 0.16);
}

@media (max-width: 720px) {
  .tool-shelf {
    padding: 1.75rem 0 3rem;
  }

  .tool-search {
    flex-wrap: wrap;
  }

  .tool-search__field {
    width: 100%;
  }

  .tool-tabs {
    width: 100%;
    border-radius: 16px;
  }

  .tool-tabs__tab {
    flex: 1 1 auto;
    justify-content: center;
  }

  .tool-category__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }

  .tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>
