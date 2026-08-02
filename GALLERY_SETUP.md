# Astro Paper 画廊页面搭建教程（Vercel 版）

本教程将指导你在 Astro Paper 主题中添加一个风格统一的图片画廊页面。采用 **Vercel 原生 Serverless Function** 作为后端，瀑布流布局 + 灯箱查看，完全对齐 AstroPaper 原生设计规范。

---

## 目录

1. [效果预览](#效果预览)
2. [前置准备](#前置准备)
3. [步骤一：安装 Node.js 类型定义](#步骤一安装-nodejs-类型定义)
4. [步骤二：创建 Vercel API 接口](#步骤二创建-vercel-api-接口)
5. [步骤三：创建画廊页面](#步骤三创建画廊页面)
6. [步骤四：添加导航入口](#步骤四添加导航入口)
7. [步骤五：添加面包屑支持](#步骤五添加面包屑支持)
8. [步骤六：配置 Vercel 环境变量](#步骤六配置-vercel-环境变量)
9. [步骤七：验证构建](#步骤七验证构建)
10. [配置说明](#配置说明)
11. [文件清单](#文件清单)

---

## 效果预览

- ✅ 瀑布流布局（移动端 2 列，平板 3 列，桌面 4 列）
- ✅ 点击图片全屏灯箱查看，支持 ESC 键 / 点背景 / 关闭按钮退出
- ✅ 与 AstroPaper 原生风格完全一致（配色 / 边框 / 圆角 / 悬停效果）
- ✅ 深浅色模式自动适配
- ✅ 面包屑导航 `Home » Gallery`
- ✅ 顶部导航栏入口，带 active 状态高亮
- ✅ 图片懒加载 + 服务端 5 分钟缓存
- ✅ 敏感信息通过环境变量注入，不硬编码

---

## 前置准备

- 已安装 Astro Paper v6 主题的项目
- 部署在 **Vercel** 平台
- 一个支持 API 管理的图床（本教程以兼容 EasyImages2 API 的图床为例）
- 图床的管理 Token

---

## 步骤一：安装 Node.js 类型定义

Vercel Serverless Function 使用 Node.js 运行时，需要安装对应的类型定义来通过 TypeScript 检查。

在项目根目录执行：

```bash
pnpm add -D @types/node
```

> 如果用的是 npm 或 yarn，对应替换为 `npm i -D @types/node` 或 `yarn add -D @types/node`

---

## 步骤二：创建 Vercel API 接口

在**项目根目录**（不是 `src` 目录）下新建 `api/gallery.ts`：

> ⚠️ 注意：这是 Vercel 原生识别的服务端函数路径，必须放在项目根目录的 `api/` 文件夹下。

```typescript
/// <reference types="node" />

export default async function handler(req, res) {
  // 从环境变量读取配置，避免硬编码敏感信息
  const IMGBED_DOMAIN = process.env.IMGBED_DOMAIN || "https://i.022311.xyz";
  const ADMIN_TOKEN = process.env.IMGBED_ADMIN_TOKEN || "";
  const TARGET_DIR = process.env.IMGBED_GALLERY_DIR || "/nfsw";

  try {
    // Token 未配置时返回明确错误
    if (!ADMIN_TOKEN) {
      res.status(500).json({ error: "Admin token is not configured" });
      return;
    }

    // 请求图床管理接口，pageSize 控制返回图片数量
    const apiUrl = `${IMGBED_DOMAIN}/api/manage/list?dir=${encodeURIComponent(TARGET_DIR)}&fileType=image&pageSize=50`;
    const response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });

    // 图床接口异常时返回详情，便于排查
    if (!response.ok) {
      const errText = await response.text();
      console.error("[gallery] Imgbed API error:", response.status, errText);
      res.status(500).json({
        error: "Imgbed API request failed",
        status: response.status,
        detail: errText.slice(0, 200),
      });
      return;
    }

    const data = await response.json();
    const files = data.files || [];

    // 格式化返回数据，前端直接使用
    const images = files.map((item) => ({
      url: `${IMGBED_DOMAIN}/file/${encodeURIComponent(item.name)}`,
      name: item.name,
    }));

    // 设置 5 分钟缓存，减少接口调用
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(images);
  } catch (e) {
    console.error("[gallery] Server error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    res.status(500).json({
      error: "Internal server error",
      message: msg,
    });
  }
}
```

**接口说明：**

| 项 | 说明 |
|----|------|
| 路径 | `/api/gallery` |
| 方法 | GET |
| 返回格式 | `[{ url: string, name: string }, ...]` |
| 缓存 | 5 分钟（`Cache-Control: public, max-age=300`） |

**错误处理：**
- Token 未配置 → 返回 500 + 明确提示
- 图床接口异常 → 返回状态码 + 错误详情前 200 字符
- 服务端异常 → 返回错误信息

---

## 步骤三：创建画廊页面

在 `src/pages/` 目录下新建（或替换）`gallery.astro`：

```astro
---
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Breadcrumb from "@/components/Breadcrumb.astro";
import Main from "@/components/Main.astro";
import Footer from "@/components/Footer.astro";
import config from "@/astro-paper.config";
---

<Layout title={`Gallery | ${config.site.title}`} description="Photo gallery">
  <Header />
  <Breadcrumb />

  <Main pageTitle="Gallery">
    <!-- 加载状态提示，放在瀑布流外避免被分列切断 -->
    <div id="gallery-status" class="py-12 text-center text-muted-foreground">
      Loading...
    </div>

    <!-- 瀑布流容器 -->
    <div id="gallery" class="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 hidden">
    </div>
  </Main>

  <Footer />
</Layout>

<!-- 灯箱效果 -->
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
  <img id="lightbox-img" src="" alt="" class="max-h-[85vh] max-w-full object-contain rounded-md" />
</div>

<script>
  const gallery = document.getElementById("gallery");
  const statusEl = document.getElementById("gallery-status");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");

  // 打开灯箱
  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.remove("hidden");
    lightbox.classList.add("flex");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  // 关闭灯箱
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.add("hidden");
    lightbox.classList.remove("flex");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // 绑定关闭事件
  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  // 拉取并渲染画廊
  async function loadGallery() {
    if (!gallery || !statusEl) return;
    try {
      const res = await fetch("/api/gallery");
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      
      const images = await res.json();

      if (!Array.isArray(images) || images.length === 0) {
        statusEl.textContent = "No images yet.";
        return;
      }

      // 生成瀑布流 DOM
      gallery.innerHTML = images
        .map((img) => `
        <button
          class="group mb-3 block w-full overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:border-accent/60 hover:shadow-sm break-inside-avoid"
          data-src="${img.url}"
          data-name="${img.name}"
          aria-label="View ${img.name}"
        >
          <img
            src="${img.url}"
            alt="${img.name}"
            loading="lazy"
            class="block w-full h-auto transition-transform duration-300 group-hover:scale-105"
          />
        </button>
      `)
        .join("");

      // 绑定所有图片的灯箱点击事件
      gallery.querySelectorAll("button[data-src]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const src = btn.getAttribute("data-src") || "";
          const name = btn.getAttribute("data-name") || "";
          openLightbox(src, name);
        });
      });

      // 加载完成：隐藏提示，显示画廊
      statusEl.classList.add("hidden");
      gallery.classList.remove("hidden");

    } catch (e) {
      console.error("Gallery load error:", e);
      statusEl.textContent = "Failed to load gallery.";
    }
  }

  // DOM 就绪后执行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadGallery);
  } else {
    loadGallery();
  }
  document.addEventListener("astro:page-load", loadGallery);
</script>
```

### 风格一致性要点

| 维度 | 实现方式 |
|------|----------|
| **布局容器** | 使用 `Main` 组件，内部自动应用 `app-layout` 类（`max-w-3xl mx-auto px-4`） |
| **标题样式** | 由 `Main` 组件统一渲染 `h1`，字号 `text-2xl sm:text-3xl font-semibold` |
| **颜色体系** | 全部走 `theme.css` 定义的 CSS 变量类：`border-border`、`text-accent`、`bg-background`、`text-muted-foreground` |
| **边框圆角** | `rounded-lg border border-border`，与项目卡片风格一致 |
| **悬停效果** | `hover:border-accent/60` + 图片 `scale-105`，过渡 200-300ms |
| **深浅色适配** | 全部走 CSS 变量，自动跟随主题切换 |
| **瀑布流** | CSS `columns` 多列布局，`break-inside-avoid` 防止图片被切断 |

### 灯箱功能

- 点击任意图片 → 全屏查看
- 关闭方式三种：
  1. 点击右上角 × 按钮
  2. 点击图片外的背景区域
  3. 按键盘 `ESC` 键
- 图片最大高度 `85vh`，带圆角
- 背景半透明模糊（`bg-background/95 backdrop-blur-sm`）

---

## 步骤四：添加导航入口

在顶部导航栏添加 Gallery 菜单项。

编辑 `src/components/Header.astro`，找到 About 导航项：

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

## 步骤五：添加面包屑支持

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

## 步骤六：配置 Vercel 环境变量

敏感信息通过环境变量注入，**绝对不要硬编码到源码中**。

### 操作步骤

1. 进入 **Vercel 项目后台**
2. 点击 **Settings** → **Environment Variables**
3. 新增以下 3 条环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `IMGBED_DOMAIN` | 图床域名 | `https://i.022311.xyz` |
| `IMGBED_ADMIN_TOKEN` | 图床管理 Token | `imgbed_68f509c8...` |
| `IMGBED_GALLERY_DIR` | 画廊目录路径 | `/nfsw` |

4. 每条变量都勾选 **Production** 环境（根据需要也可以勾选 Preview）
5. 点击 **Save** 保存

> ⚠️ 配置完环境变量后，需要**重新部署**一次才能生效。

### 本地开发环境变量

本地开发时，在项目根目录创建 `.env.local` 文件：

```env
IMGBED_DOMAIN=https://i.022311.xyz
IMGBED_ADMIN_TOKEN=你的token
IMGBED_GALLERY_DIR=/nfsw
```

> `.env.local` 已被 `.gitignore` 忽略，不会提交到仓库。

---

## 步骤七：验证构建

运行类型检查，确保没有错误：

```bash
pnpm astro check
```

预期输出：

```
Result (xx files):
- 0 errors
- 0 warnings
- 0 hints
```

启动开发服务器预览：

```bash
pnpm dev
```

访问 `http://localhost:4321/gallery` 查看效果。

> 💡 本地开发时，Vercel Serverless Function 也能正常运行，Vercel CLI 会自动处理 `api/` 目录。

---

## 配置说明

### 环境变量配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `IMGBED_DOMAIN` | 否 | `https://i.022311.xyz` | 图床域名 |
| `IMGBED_ADMIN_TOKEN` | **是** | 无 | 图床管理 Token，未配置时接口返回 500 |
| `IMGBED_GALLERY_DIR` | 否 | `/nfsw` | 画廊目录路径 |

### 瀑布流列数调整

在 `gallery.astro` 中修改 `columns-*` 类名：

```astro
<!-- 移动端 2 列，平板 3 列，桌面 4 列 -->
<div id="gallery" class="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
```

### 缓存时间调整

在 `api/gallery.ts` 中修改 `max-age` 值：

```typescript
// 10 分钟缓存
res.setHeader("Cache-Control", "public, max-age=600");
```

### 图片数量调整

修改 API 请求的 `pageSize` 参数：

```typescript
const apiUrl = `${IMGBED_DOMAIN}/api/manage/list?dir=...&pageSize=100`;
```

---

## 文件清单

本次新增/修改的文件：

```
项目根目录/
├── api/
│   └── gallery.ts              [新增] Vercel Serverless Function
└── src/
    ├── pages/
    │   └── gallery.astro       [新增] 画廊页面
    └── components/
        ├── Header.astro        [修改] 添加 Gallery 导航
        └── Breadcrumb.astro    [修改] 添加 gallery 路径标签
```

---

## 常见问题

### Q: 部署后接口返回 500 "Admin token is not configured"

A: 环境变量未配置或未生效。检查 Vercel 后台的 Environment Variables，确认 `IMGBED_ADMIN_TOKEN` 已添加且勾选了 Production 环境，然后重新部署。

### Q: 本地开发正常，部署后 404

A: 确认 `api/gallery.ts` 放在**项目根目录**的 `api/` 文件夹下，不是 `src/pages/api/`。Vercel 只识别根目录的 `api/`。

### Q: 瀑布流图片有白边/不对齐

A: CSS columns 瀑布流天然就是这样的，每张图片高度不同导致间距有差异。如果想要严格对齐，可以改回 grid 布局，但需要统一图片比例。

### Q: 想换成网格布局怎么办

A: 把 `gallery.astro` 中的 `columns-*` 换成 `grid grid-cols-*`，同时给图片容器加 `aspect-square` 或 `aspect-video` 统一比例。

---

**完成！** 🎉 你的画廊页面已经和 Astro Paper 原生风格完美融合，部署在 Vercel 上即可正常运行。
