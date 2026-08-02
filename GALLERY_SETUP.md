# Astro Paper 画廊页面搭建教程

本教程将指导你在 Astro Paper 主题中添加一个风格统一的图片画廊页面，支持从图床 API 动态加载图片、灯箱查看、深浅色自适应等功能。

---

## 目录

1. [效果预览](#效果预览)
2. [前置准备](#前置准备)
3. [步骤一：创建 API 路由](#步骤一创建-api-路由)
4. [步骤二：创建画廊页面](#步骤二创建画廊页面)
5. [步骤三：添加导航入口](#步骤三添加导航入口)
6. [步骤四：添加面包屑支持](#步骤四添加面包屑支持)
7. [步骤五：验证构建](#步骤五验证构建)
8. [配置说明](#配置说明)
9. [后续优化建议](#后续优化建议)

---

## 效果预览

- ✅ 与 Astro Paper 原生风格完全一致（布局、配色、字体、间距）
- ✅ 响应式方形网格（移动端 2 列，桌面端 3 列）
- ✅ 点击图片全屏灯箱查看，支持 ESC 键关闭
- ✅ 深浅色模式自动适配
- ✅ 面包屑导航 `Home » Gallery`
- ✅ 顶部导航栏入口，带 active 状态高亮
- ✅ 图片懒加载 + API 缓存

---

## 前置准备

- 已安装 Astro Paper v6 主题的项目
- 一个支持 API 管理的图床（本教程以兼容 EasyImages2 API 的图床为例）
- 图床的管理 Token（用于获取文件列表）

---

## 步骤一：创建 API 路由

API 路由负责从图床获取图片列表，并以 JSON 格式返回给前端。

在 `src/pages/api/` 目录下新建 `gallery.ts`：

```typescript
export const prerender = false;

// ===== Configuration =====
const IMGBED_DOMAIN = "https://i.022311.xyz"; // 你的图床域名
const ADMIN_TOKEN = "your_token_here";       // 你的图床管理 Token
const TARGET_DIR = "";                        // 目标目录，如 "/gallery"，留空为根目录
const COUNT = 50;                             // 获取图片数量
const CACHE_TTL = 300;                        // 缓存时间（秒）

export async function GET() {
  try {
    const res = await fetch(
      `${IMGBED_DOMAIN}/api/manage/list?dir=${encodeURIComponent(TARGET_DIR)}&fileType=image&count=${COUNT}`,
      { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
    );

    if (!res.ok) {
      throw new Error(`Imgbed API responded with ${res.status}`);
    }

    const rawData = (await res.json()) as { files?: Array<{ name: string }> };
    const files = rawData.files ?? [];

    const images = files.map((item) => ({
      url: `${IMGBED_DOMAIN}/file/${encodeURIComponent(item.name)}`,
      name: item.name,
    }));

    return new Response(JSON.stringify(images), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${CACHE_TTL}`,
      },
    });
  } catch (e) {
    console.error("[gallery API] Failed to fetch images:", e);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

**说明：**
- `prerender = false` 表示这是一个运行时 API，不会在构建时预渲染
- 返回格式为 `[{ url: string, name: string }, ...]`
- 加了 5 分钟缓存，减少重复请求图床

---

## 步骤二：创建画廊页面

在 `src/pages/` 目录下新建 `gallery.astro`：

```astro
---
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Breadcrumb from "@/components/Breadcrumb.astro";
import Main from "@/components/Main.astro";
import Footer from "@/components/Footer.astro";
import config from "@/config";
---

<Layout title={`Gallery | ${config.site.title}`} description="Photo gallery">
  <Header />
  <Breadcrumb />

  <Main pageTitle="Gallery">
    <div id="gallery" class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <div class="col-span-full py-12 text-center text-muted-foreground">
        Loading...
      </div>
    </div>
  </Main>

  <Footer />
</Layout>

<!-- Lightbox overlay -->
<div
  id="lightbox"
  class="fixed inset-0 z-50 hidden items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
  aria-hidden="true"
  role="dialog"
  aria-modal="true"
>
  <button
    id="lightbox-close"
    class="absolute right-4 top-4 size-10 text-foreground/70 hover:text-accent"
    aria-label="Close lightbox"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-6">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>
  <img id="lightbox-img" src="" alt="" class="max-h-full max-w-full object-contain" />
</div>

<script>
  interface GalleryImage {
    url: string;
    name: string;
  }

  const gallery = document.getElementById("gallery");
  const lightbox = document.getElementById("lightbox") as HTMLDivElement;
  const lightboxImg = document.getElementById("lightbox-img") as HTMLImageElement;
  const lightboxClose = document.getElementById("lightbox-close") as HTMLButtonElement;

  function openLightbox(src: string, alt: string) {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.remove("hidden");
    lightbox.classList.add("flex");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightbox.classList.remove("flex");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  async function loadGallery() {
    if (!gallery) return;
    try {
      const res = await fetch("/api/gallery");
      const images: GalleryImage[] = await res.json();

      if (images.length === 0) {
        gallery.innerHTML =
          '<div class="col-span-full py-12 text-center text-muted-foreground">No images yet.</div>';
        return;
      }

      gallery.innerHTML = images
        .map(
          (img) => `
        <button
          class="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30 transition-all duration-200 hover:border-accent/60 hover:shadow-sm"
          data-src="${img.url}"
          data-name="${img.name}"
          aria-label="View ${img.name}"
        >
          <img
            src="${img.url}"
            alt="${img.name}"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </button>
      `
        )
        .join("");

      // Attach click handlers
      gallery.querySelectorAll("button[data-src]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const src = btn.getAttribute("data-src") || "";
          const name = btn.getAttribute("data-name") || "";
          openLightbox(src, name);
        });
      });
    } catch (e) {
      console.error("Gallery load error:", e);
      gallery.innerHTML =
        '<div class="col-span-full py-12 text-center text-muted-foreground">Failed to load gallery.</div>';
    }
  }

  // Initial load + reload on Astro view transitions
  loadGallery();
  document.addEventListener("astro:page-load", loadGallery);
</script>
```

**风格一致性要点：**

| 维度 | 实现方式 |
|------|----------|
| 布局容器 | 使用 `Main` 组件，内部自动应用 `app-layout` 类（`max-w-3xl mx-auto px-4`） |
| 标题样式 | 由 `Main` 组件统一渲染 `h1`，字号 `text-2xl sm:text-3xl font-semibold` |
| 颜色体系 | 使用 `theme.css` 定义的 CSS 变量类：`border-border`、`text-accent`、`bg-background`、`text-muted-foreground` |
| 边框圆角 | `rounded-lg border border-border`，与项目卡片风格一致 |
| 悬停效果 | `hover:border-accent/60` + 图片 `scale-105`，过渡 200-300ms |
| 深浅色适配 | 全部走 CSS 变量，自动跟随主题切换 |

---

## 步骤三：添加导航入口

在顶部导航栏添加 Gallery 菜单项。

编辑 `src/components/Header.astro`，找到 About 导航项的位置：

```astro
        <li class="col-span-2">
          <a
            href={getRelativeLocaleUrl(locale, "about")}
            class:list={{ "active-nav": isActive("/about") }}
          >
            {t.nav.about}
          </a>
        </li>
```

在它**后面**添加 Gallery 导航项：

```astro
        <li class="col-span-2">
          <a
            href={getRelativeLocaleUrl(locale, "gallery")}
            class:list={{ "active-nav": isActive("/gallery") }}
          >
            Gallery
          </a>
        </li>
```

效果：
- 桌面端和移动端导航菜单中都会出现 Gallery 项
- 当前在画廊页时，导航文字下方显示波浪下划线（`active-nav` 样式）

---

## 步骤四：添加面包屑支持

让面包屑组件识别 gallery 路径，显示正确的标签名。

编辑 `src/components/Breadcrumb.astro`，找到 `navLabels` 对象：

```typescript
const navLabels: Record<string, string> = {
  posts: t.nav.posts,
  tags: t.nav.tags,
  about: t.nav.about,
  archives: t.nav.archives,
  search: t.nav.search,
};
```

在 `about` 和 `archives` 之间添加 `gallery`：

```typescript
const navLabels: Record<string, string> = {
  posts: t.nav.posts,
  tags: t.nav.tags,
  about: t.nav.about,
  gallery: "Gallery",
  archives: t.nav.archives,
  search: t.nav.search,
};
```

效果：访问 `/gallery` 时，面包屑显示 `Home » Gallery`

---

## 步骤五：验证构建

运行类型检查，确保没有错误：

```bash
pnpm astro check
```

预期输出：

```
Result (58 files):
- 0 errors
- 0 warnings
- 0 hints
```

然后启动开发服务器预览：

```bash
pnpm dev
```

访问 `http://localhost:4321/gallery` 查看效果。

---

## 配置说明

### API 配置项

在 `src/pages/api/gallery.ts` 顶部修改：

| 变量 | 说明 | 示例 |
|------|------|------|
| `IMGBED_DOMAIN` | 图床域名 | `https://i.example.com` |
| `ADMIN_TOKEN` | 图床管理 Token | `imgbed_xxxxx...` |
| `TARGET_DIR` | 目标目录路径 | `"/gallery"` 或 `""`（根目录） |
| `COUNT` | 获取图片数量 | `50` |
| `CACHE_TTL` | 缓存秒数 | `300`（5 分钟） |

### 网格布局调整

在 `gallery.astro` 中修改 grid 类名：

```astro
<!-- 移动端 2 列，平板 3 列，桌面 4 列 -->
<div id="gallery" class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
```

### 卡片比例调整

默认是方形（`aspect-square`），可改为：

```astro
<!-- 16:9 横向 -->
class="aspect-video"

<!-- 4:3 竖向 -->
class="aspect-[4/3]"
```

---

## 后续优化建议

### 1. Token 移到环境变量（推荐）

如果仓库是公开的，建议将 Token 移到环境变量，避免泄露：

1. 在项目根目录创建 `.env` 文件：
   ```
   IMGBED_TOKEN=your_token_here
   ```

2. 修改 `gallery.ts`：
   ```typescript
   import { IMGBED_TOKEN } from "astro:env/server";

   const ADMIN_TOKEN = IMGBED_TOKEN;
   ```

3. 在 `src/env.d.ts` 中声明类型（如果需要）：
   ```typescript
   interface Env {
     IMGBED_TOKEN: string;
   }
   ```

### 2. 分页加载

如果图片很多，可以添加分页或无限滚动：
- 修改 API 支持 `page` 和 `pageSize` 参数
- 页面底部添加"加载更多"按钮

### 3. 图片描述

如果图床 API 支持描述字段，可以在卡片下方添加一行说明文字：

```astro
<div class="p-3">
  <p class="text-sm text-muted-foreground line-clamp-1">${img.description || img.name}</p>
</div>
```

### 4. 分类/标签

给图片添加分类，顶部增加标签筛选栏，类似 Tags 页面的风格。

### 5. 懒加载占位

添加模糊占位图（LQIP），提升加载体验。

---

## 文件清单

本次新增/修改的文件：

```
src/
├── pages/
│   ├── gallery.astro          [新增] 画廊页面
│   └── api/
│       └── gallery.ts         [新增] 图片列表 API
└── components/
    ├── Header.astro           [修改] 添加 Gallery 导航
    └── Breadcrumb.astro       [修改] 添加 gallery 路径标签
```

---

**完成！** 🎉 你的画廊页面已经和 Astro Paper 原生风格完美融合。
