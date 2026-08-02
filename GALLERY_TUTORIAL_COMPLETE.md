# Astro Paper 画廊页面从零搭建完整教程

本文档面向 Astro Paper v6 + Vercel 部署场景，从零开始一步步搭建一个与主题风格完全一致的图片画廊页面。


---

## 目录

- [一、先搞清楚我们要做什么](#一先搞清楚我们要做什么)
  - [1.1 最终效果](#11-最终效果)
  - [1.2 技术方案](#12-技术方案)
  - [1.3 涉及的文件清单](#13-涉及的文件清单)
- [二、环境准备](#二环境准备)
  - [2.1 前置条件](#21-前置条件)
  - [2.2 安装 Node.js 类型定义](#22-安装-nodejs-类型定义)
- [三、第一步：创建 Vercel Serverless Function](#三第一步创建-vercel-serverless-function)
  - [3.1 为什么用 Vercel 原生 API](#31-为什么用-vercel-原生-api)
  - [3.2 创建 api 目录和文件](#32-创建-api-目录和文件)
  - [3.3 完整代码](#33-完整代码)
  - [3.4 逐行解释](#34-逐行解释)
- [四、第二步：创建画廊页面](#四第二步创建画廊页面)
  - [4.1 页面结构说明](#41-页面结构说明)
  - [4.2 创建 gallery.astro](#42-创建-galleryastro)
  - [4.3 完整代码](#43-完整代码)
  - [4.4 逐段解释](#44-逐段解释)
- [五、第三步：添加导航栏入口](#五第三步添加导航栏入口)
  - [5.1 修改 Header 组件](#51-修改-header-组件)
  - [5.2 验证效果](#52-验证效果)
- [六、第四步：添加面包屑支持](#六第四步添加面包屑支持)
  - [6.1 修改 Breadcrumb 组件](#61-修改-breadcrumb-组件)
  - [6.2 验证效果](#62-验证效果)
- [七、第五步：配置环境变量](#七第五步配置环境变量)
  - [7.1 本地开发环境](#71-本地开发环境)
  - [7.2 Vercel 生产环境](#72-vercel-生产环境)
- [八、第六步：本地验证](#八第六步本地验证)
  - [8.1 类型检查](#81-类型检查)
  - [8.2 启动开发服务器](#82-启动开发服务器)
  - [8.3 验证 API 接口](#83-验证-api-接口)
  - [8.4 验证页面](#84-验证页面)
- [九、第七步：部署到 Vercel](#九第七步部署到-vercel)
- [十、自定义配置指南](#十自定义配置指南)
  - [10.1 修改瀑布流列数](#101-修改瀑布流列数)
  - [10.2 修改缓存时间](#102-修改缓存时间)
  - [10.3 修改图片数量](#103-修改图片数量)
  - [10.4 修改画廊目录](#104-修改画廊目录)
  - [10.5 改成网格布局](#105-改成网格布局)
- [十一、常见问题排查](#十一常见问题排查)
- [十二、完整文件清单](#十二完整文件清单)

---

## 一、先搞清楚我们要做什么

### 1.1 最终效果

完成后你将得到一个画廊页面，它具有以下特点：

**视觉层面：**
- 🎨 与 Astro Paper 原生风格 100% 一致（配色、边框、圆角、字体、间距全部对齐）
- 🌓 深浅色模式自动适配（跟着主题切换）
- 📱 响应式布局（手机 2 列、平板 3 列、桌面 4 列）
- 🖼️ 瀑布流展示（每张图片保持原始比例）
- ✨ 悬停效果（边框变色 + 图片轻微放大）

**功能层面：**
- 🔍 点击图片全屏灯箱查看
- ⌨️ 支持 ESC 键关闭灯箱
- 🖱️ 点击背景区域关闭灯箱
- 📥 图片懒加载
- ⚡ API 5 分钟缓存，减少重复请求
- 🧭 顶部导航栏有入口，带 active 高亮
- 🍞 面包屑导航 `Home » Gallery`

**安全层面：**
- 🔐 敏感信息（Token）通过环境变量注入，不硬编码
- ❌ Token 未配置时返回明确错误提示

### 1.2 技术方案

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 后端 | Vercel Serverless Function | 放在项目根目录 `api/` 下，Vercel 自动识别 |
| 前端 | Astro + 原生 JS | 页面用 Astro 组件，交互用原生 JS 渲染 |
| 布局 | CSS Columns 瀑布流 | 纯 CSS 实现，不需要 JS 计算 |
| 灯箱 | 原生 JS + Tailwind | 不引入第三方库，保持轻量 |
| 数据源 | 图床管理 API | 兼容 EasyImages2 等常见图床程序 |
| 缓存 | HTTP Cache-Control | 服务端设置 5 分钟缓存 |

### 1.3 涉及的文件清单

```
你的项目/
├── api/
│   └── gallery.ts              ← 【新增】Vercel API 接口
├── .env.local                  ← 【新增】本地环境变量（可选）
└── src/
    ├── pages/
    │   └── gallery.astro       ← 【新增】画廊页面
    └── components/
        ├── Header.astro        ← 【修改】加导航入口
        └── Breadcrumb.astro    ← 【修改】加面包屑标签
```

一共 **2 个新文件 + 2 个修改文件**，非常轻量。

---

## 二、环境准备

### 2.1 前置条件

在开始之前，请确认你已经有：

- ✅ 一个基于 **Astro Paper v6** 的博客项目
- ✅ 项目部署在 **Vercel** 上（或者准备部署到 Vercel）
- ✅ 一个支持 API 管理的图床（比如 EasyImages2）
- ✅ 图床的**管理员 Token**（用于调用文件列表接口）

> 💡 如果你用的不是 EasyImages2，只要你的图床提供类似的「获取文件列表」API，稍微改一下请求参数和返回字段映射就行。

### 2.2 安装 Node.js 类型定义

Vercel Serverless Function 运行在 Node.js 环境中，我们的 API 文件用 TypeScript 写，需要 Node.js 的类型定义才能通过类型检查。

在你的**项目根目录**下执行：

```bash
pnpm add -D @types/node
```

如果你用的是 npm：

```bash
npm install -D @types/node
```

如果你用的是 yarn：

```bash
yarn add -D @types/node
```

**验证安装成功：**

执行完后，打开 `package.json`，在 `devDependencies` 里应该能看到 `"@types/node": "^x.x.x"`。

---

## 三、第一步：创建 Vercel Serverless Function

### 3.1 为什么用 Vercel 原生 API

你可能会问：Astro 不是有自己的 API Routes 吗（`src/pages/api/`）？为什么要用 Vercel 原生的？

原因：

1. **部署零配置** — Vercel 自动识别根目录 `api/` 文件夹，不需要额外配置
2. **运行时更灵活** — Vercel Serverless Function 有更完整的 Node.js 环境
3. **环境变量更方便** — Vercel 后台配置的环境变量直接可用
4. **独立部署** — API 和前端页面可以独立扩展和调试

> ⚠️ **重要**：这个 `api/` 目录必须放在**项目根目录**，和 `src/`、`public/`、`package.json` 同级。**不是** `src/pages/api/`！

### 3.2 创建 api 目录和文件

1. 在项目根目录下，新建一个名为 `api` 的文件夹
2. 在 `api` 文件夹里，新建一个名为 `gallery.ts` 的文件

最终路径：`你的项目/api/gallery.ts`

### 3.3 完整代码

把下面的代码完整复制到 `api/gallery.ts` 中：

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

### 3.4 逐行解释

让我们一行一行搞懂这段代码在做什么：

---

**第 1 行：类型引用**
```typescript
/// <reference types="node" />
```
告诉 TypeScript 编译器：这个文件运行在 Node.js 环境中，请使用 Node.js 的类型定义。这样 `process.env` 等 Node 特有 API 才不会报类型错误。

---

**第 3 行：函数定义**
```typescript
export default async function handler(req, res) {
```
Vercel Serverless Function 的标准写法：
- `export default` — 默认导出，Vercel 会自动调用
- `handler` — 函数名，可以随便取，但约定俗成叫 handler
- `req` — 请求对象（包含请求头、参数等）
- `res` — 响应对象（用来返回数据）
- `async` — 异步函数，因为我们要调用 fetch 请求图床 API

---

**第 5-7 行：读取环境变量**
```typescript
const IMGBED_DOMAIN = process.env.IMGBED_DOMAIN || "https://i.022311.xyz";
const ADMIN_TOKEN = process.env.IMGBED_ADMIN_TOKEN || "";
const TARGET_DIR = process.env.IMGBED_GALLERY_DIR || "/nfsw";
```
从环境变量读取配置，`||` 后面是默认值：
- `IMGBED_DOMAIN` — 图床域名，默认 `https://i.022311.xyz`
- `IMGBED_ADMIN_TOKEN` — 管理 Token，默认空字符串（未配置）
- `IMGBED_GALLERY_DIR` — 画廊目录，默认 `/nfsw`

> 💡 为什么用环境变量？因为 Token 是敏感信息，如果硬编码在代码里，提交到 GitHub 就泄露了。用环境变量可以在 Vercel 后台单独配置，不会进入代码仓库。

---

**第 11-15 行：Token 校验**
```typescript
if (!ADMIN_TOKEN) {
  res.status(500).json({ error: "Admin token is not configured" });
  return;
}
```
如果 Token 没配置（空字符串），直接返回 500 错误，告诉调用方「Token 没配」。这样比默默失败更容易排查问题。

---

**第 18-21 行：请求图床 API**
```typescript
const apiUrl = `${IMGBED_DOMAIN}/api/manage/list?dir=${encodeURIComponent(TARGET_DIR)}&fileType=image&pageSize=50`;
const response = await fetch(apiUrl, {
  headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
});
```
调用图床的文件列表接口：
- `/api/manage/list` — 管理接口路径（EasyImages2 的标准路径）
- `dir` — 要列出的目录，用 `encodeURIComponent` 编码（防止中文/特殊字符出问题）
- `fileType=image` — 只返回图片文件
- `pageSize=50` — 返回 50 张
- `Authorization: Bearer <token>` — 在请求头里带上 Token 认证

---

**第 24-32 行：处理图床接口异常**
```typescript
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
```
如果图床返回的不是 2xx 状态码（比如 401 未授权、404 找不到、500 服务器错误）：
1. 读取错误响应文本
2. 在服务端日志打印错误（方便排查）
3. 返回 500 给前端，带上状态码和错误详情（只取前 200 字符，防止太长）

---

**第 34-35 行：解析响应数据**
```typescript
const data = await response.json();
const files = data.files || [];
```
把 JSON 响应解析成对象，取出 `files` 数组。如果 `files` 不存在（接口格式变了），就用空数组兜底，防止后面 `.map()` 报错。

---

**第 38-42 行：格式化数据**
```typescript
const images = files.map((item) => ({
  url: `${IMGBED_DOMAIN}/file/${encodeURIComponent(item.name)}`,
  name: item.name,
}));
```
把图床返回的原始数据转换成前端需要的格式：
- `url` — 图片的完整访问地址（`/file/` 是 EasyImages2 的访问路径）
- `name` — 文件名

`encodeURIComponent(item.name)` 再次编码文件名，防止中文/特殊字符导致 404。

---

**第 45-48 行：返回成功响应**
```typescript
res.setHeader("Cache-Control", "public, max-age=300");
res.setHeader("Content-Type", "application/json");
res.status(200).json(images);
```
返回数据给前端：
- `Cache-Control: public, max-age=300` — 告诉浏览器/CDN 缓存 5 分钟（300 秒），5 分钟内重复请求直接用缓存，不用再请求图床
- `Content-Type: application/json` — 告诉前端这是 JSON 格式
- `status(200)` — HTTP 状态码 200（成功）
- `.json(images)` — 返回 JSON 格式的图片数组

---

**第 49-55 行：捕获异常**
```typescript
} catch (e) {
  console.error("[gallery] Server error:", e);
  const msg = e instanceof Error ? e.message : "Unknown error";
  res.status(500).json({
    error: "Internal server error",
    message: msg,
  });
}
```
如果上面任何一步抛出异常（比如网络不通、JSON 解析失败），进入 catch：
1. 在服务端日志打印错误
2. 返回 500 状态码 + 错误信息
3. `e instanceof Error` — 判断是不是标准 Error 对象，是的话取 `.message`，否则用 "Unknown error"

---

## 四、第二步：创建画廊页面

### 4.1 页面结构说明

画廊页面采用 Astro Paper 的标准页面结构，从上到下依次是：

```
┌─────────────────────────────────┐
│  Header（顶部导航栏）            │
├─────────────────────────────────┤
│  Breadcrumb（面包屑导航）        │
├─────────────────────────────────┤
│  Main（主内容区）                │
│  ┌───────────────────────────┐  │
│  │  标题：Gallery             │  │
│  ├───────────────────────────┤  │
│  │  加载中... / 瀑布流图片    │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  Footer（页脚）                  │
└─────────────────────────────────┘
```

另外还有一个**全局的灯箱遮罩层**，默认隐藏，点击图片时显示。

### 4.2 创建 gallery.astro

在 `src/pages/` 目录下新建 `gallery.astro` 文件。

路径：`你的项目/src/pages/gallery.astro`

### 4.3 完整代码

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

### 4.4 逐段解释

---

#### 第一部分：Frontmatter（组件导入）

```astro
---
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Breadcrumb from "@/components/Breadcrumb.astro";
import Main from "@/components/Main.astro";
import Footer from "@/components/Footer.astro";
import config from "@/astro-paper.config";
---
```

两个 `---` 之间的是 Astro 的 Frontmatter，在服务端执行：
- 导入布局组件 `Layout` — 最外层包裹，负责 HTML 结构、head 标签、全局样式
- 导入 `Header` — 顶部导航栏
- 导入 `Breadcrumb` — 面包屑导航
- 导入 `Main` — 主内容区容器（自带标题、标准宽度、内边距）
- 导入 `Footer` — 页脚
- 导入 `config` — 站点配置（用来获取网站标题）

> 💡 `@/` 是路径别名，指向 `src/` 目录。比如 `@/components/Header.astro` 就是 `src/components/Header.astro`。

---

#### 第二部分：页面主体

```astro
<Layout title={`Gallery | ${config.site.title}`} description="Photo gallery">
  <Header />
  <Breadcrumb />

  <Main pageTitle="Gallery">
    <!-- 加载状态提示 -->
    <div id="gallery-status" class="py-12 text-center text-muted-foreground">
      Loading...
    </div>

    <!-- 瀑布流容器 -->
    <div id="gallery" class="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 hidden">
    </div>
  </Main>

  <Footer />
</Layout>
```

**Layout 组件：**
- `title` — 页面标题，显示在浏览器标签页上，格式是「Gallery | 你的网站名」
- `description` — 页面描述，用于 SEO

**Main 组件：**
- `pageTitle="Gallery"` — 页面大标题，Main 组件会自动渲染成 `<h1>`，样式和其他页面保持一致

**加载状态提示：**
- `id="gallery-status"` — JS 用来找到这个元素
- `py-12` — 上下内边距 3rem（让 Loading 文字垂直居中一些）
- `text-center` — 文字居中
- `text-muted-foreground` — 次要文字颜色（灰色），是 Astro Paper 主题的标准颜色

**瀑布流容器：**
- `id="gallery"` — JS 用来找到这个元素
- `columns-2` — 默认（手机）2 列
- `gap-3` — 默认列间距 0.75rem
- `sm:columns-3` — 平板（≥640px）3 列
- `sm:gap-4` — 平板列间距 1rem
- `lg:columns-4` — 桌面（≥1024px）4 列
- `hidden` — 默认隐藏，等数据加载完再显示（防止闪烁）

---

#### 第三部分：灯箱遮罩层

```astro
<div
  id="lightbox"
  class="fixed inset-0 z-50 hidden items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
  aria-hidden="true"
  role="dialog"
  aria-modal="true"
>
```

灯箱外层容器：
- `fixed inset-0` — 固定定位，铺满整个屏幕
- `z-50` — 层级很高，盖在所有内容上面
- `hidden` — 默认隐藏
- `items-center justify-center` — 内容水平垂直居中（需要配合 `flex` 才生效，打开灯箱时会加 `flex` 类）
- `bg-background/95` — 背景色，透明度 95%（用的是主题的背景色变量）
- `p-4` — 内边距，防止图片贴边
- `backdrop-blur-sm` — 背景模糊效果
- `aria-hidden="true"` — 无障碍属性，告诉屏幕阅读器这个元素当前隐藏
- `role="dialog"` + `aria-modal="true"` — 无障碍属性，标识这是一个模态对话框

```astro
  <button
    id="lightbox-close"
    class="absolute right-4 top-4 size-10 text-foreground/70 hover:text-accent"
    aria-label="Close lightbox"
  >
    <svg ...>×</svg>
  </button>
```

关闭按钮：
- `absolute right-4 top-4` — 绝对定位，右上角
- `size-10` — 宽高都是 2.5rem（40px）
- `text-foreground/70` — 默认文字颜色 70% 不透明度
- `hover:text-accent` — 悬停时变成主题强调色
- 里面是一个 SVG 的 × 图标

```astro
  <img id="lightbox-img" src="" alt="" class="max-h-[85vh] max-w-full object-contain rounded-md" />
```

灯箱里的大图：
- `max-h-[85vh]` — 最大高度 85% 视口高度，不会超出屏幕
- `max-w-full` — 最大宽度 100%，不会超出屏幕
- `object-contain` — 保持比例完整显示
- `rounded-md` — 圆角，更精致

---

#### 第四部分：JavaScript 交互

**获取 DOM 元素：**
```javascript
const gallery = document.getElementById("gallery");
const statusEl = document.getElementById("gallery-status");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");
```
通过 id 找到页面上的各个元素，存在变量里方便后面用。

---

**打开灯箱函数：**
```javascript
function openLightbox(src, alt) {
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightbox.classList.remove("hidden");
  lightbox.classList.add("flex");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
```
做了 5 件事：
1. 设置大图的 src 和 alt
2. 移除 `hidden` 类（显示灯箱）
3. 添加 `flex` 类（让内容居中）
4. 更新无障碍属性
5. 禁止页面滚动（防止看大图时后面的页面跟着滚）

---

**关闭灯箱函数：**
```javascript
function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.add("hidden");
  lightbox.classList.remove("flex");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
```
打开的反向操作：
1. 加 `hidden` 隐藏
2. 移除 `flex`
3. 更新无障碍属性
4. 恢复页面滚动

---

**绑定关闭事件：**
```javascript
lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});
```
三种关闭方式：
1. 点击右上角 × 按钮
2. 点击灯箱背景区域（`e.target === lightbox` 确保点的是背景不是图片）
3. 按键盘 ESC 键

> 💡 `?.` 是可选链操作符，如果元素不存在（比如 id 写错了），不会报错，只是什么都不做。

---

**加载画廊函数：**
```javascript
async function loadGallery() {
  if (!gallery || !statusEl) return;
  try {
    const res = await fetch("/api/gallery");
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    
    const images = await res.json();
```
1. 检查元素是否存在
2. fetch 请求 `/api/gallery` 接口（就是我们第一步写的那个）
3. 如果响应不是 2xx，抛出错误
4. 解析 JSON 数据

```javascript
    if (!Array.isArray(images) || images.length === 0) {
      statusEl.textContent = "No images yet.";
      return;
    }
```
如果返回的不是数组，或者数组为空，显示「暂无图片」。

```javascript
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
```
用 `map` 遍历图片数组，每一张生成一段 HTML，然后 `join("")` 拼成一个完整的字符串，赋值给 `gallery.innerHTML`。

每张图片的结构：
- 外层是 `<button>` — 语义更好，支持键盘聚焦
- `group` — Tailwind 的组概念，子元素可以用 `group-hover:` 响应父元素悬停
- `mb-3` — 底部间距，瀑布流的垂直间距
- `break-inside-avoid` — 防止图片被分列切断（瀑布流关键属性）
- `border border-border` — 边框，用主题的 border 颜色变量
- `hover:border-accent/60` — 悬停时边框变成强调色，60% 不透明度
- `data-src` / `data-name` — 自定义属性，存图片地址和名称，点击时读取
- `loading="lazy"` — 图片懒加载，滚到视口才加载
- `group-hover:scale-105` — 悬停时图片放大 5%

```javascript
    gallery.querySelectorAll("button[data-src]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const src = btn.getAttribute("data-src") || "";
        const name = btn.getAttribute("data-name") || "";
        openLightbox(src, name);
      });
    });
```
给所有图片按钮绑定点击事件，点击时调用 `openLightbox` 打开灯箱。

```javascript
    statusEl.classList.add("hidden");
    gallery.classList.remove("hidden");
```
加载成功：隐藏 Loading 提示，显示画廊。

```javascript
  } catch (e) {
    console.error("Gallery load error:", e);
    statusEl.textContent = "Failed to load gallery.";
  }
}
```
加载失败：在控制台打印错误，把 Loading 文字改成「加载失败」。

---

**执行时机：**
```javascript
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadGallery);
} else {
  loadGallery();
}
document.addEventListener("astro:page-load", loadGallery);
```
什么时候执行加载：
1. 如果 DOM 还在加载，等 `DOMContentLoaded` 事件后再执行
2. 如果 DOM 已经加载完了，立即执行
3. 监听 `astro:page-load` 事件 — Astro 的 View Transitions 页面切换时会触发，确保从其他页面导航过来时画廊也能正常加载

---

## 五、第三步：添加导航栏入口

现在页面有了，但用户找不到入口。我们需要在顶部导航栏加一个 Gallery 链接。

### 5.1 修改 Header 组件

打开文件：`src/components/Header.astro`

找到大约第 93-100 行左右的 About 导航项：

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

在它**紧后面**，插入下面这段代码：

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

**解释：**
- `getRelativeLocaleUrl(locale, "gallery")` — 生成带语言前缀的正确 URL（如果你的博客有多语言）
- `isActive("/gallery")` — 判断当前页面是不是画廊页，如果是就加 `active-nav` 类（波浪下划线高亮）
- 文字直接写 "Gallery"，和其他导航项的风格保持一致

### 5.2 验证效果

改完后，刷新页面，顶部导航栏应该能看到 Gallery 链接。当前在画廊页时，文字下方会有波浪下划线。

---

## 六、第四步：添加面包屑支持

Astro Paper 有面包屑导航，但默认只认识 posts、tags、about、archives、search 这几个路径。我们要让它也认识 gallery。

### 6.1 修改 Breadcrumb 组件

打开文件：`src/components/Breadcrumb.astro`

找到 `navLabels` 对象（大约第 27 行左右）：

```typescript
const navLabels: Record<string, string> = {
  posts: t.nav.posts,
  tags: t.nav.tags,
  about: t.nav.about,
  archives: t.nav.archives,
  search: t.nav.search,
};
```

在 `about` 和 `archives` 之间，加一行 `gallery: "Gallery",`：

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

**解释：**
- `navLabels` 是一个路径段 → 显示名称的映射表
- 当面包屑路径里出现 `gallery` 这个词时，就显示成 "Gallery"
- 如果不加这一行，面包屑会直接显示路径原文 "gallery"（全小写），不够优雅

### 6.2 验证效果

访问 `/gallery` 页面，面包屑应该显示：`Home » Gallery`

---

## 七、第五步：配置环境变量

API 接口需要图床的 Token 等信息，这些不能硬编码在代码里，要通过环境变量注入。

### 7.1 本地开发环境

在项目**根目录**下，新建一个 `.env.local` 文件：

```env
IMGBED_DOMAIN=https://i.022311.xyz
IMGBED_ADMIN_TOKEN=你的图床管理Token
IMGBED_GALLERY_DIR=/nfsw
```

**说明：**
- `.env.local` 是 Vercel 约定的本地环境变量文件
- 这个文件已经被 `.gitignore` 忽略了，不会提交到代码仓库
- 等号两边不要有空格
- Token 就是你图床后台生成的管理 Token

> ⚠️ 注意：`.env.local` 文件名不能错，必须是 `.env.local`（前面有个点）。

### 7.2 Vercel 生产环境

部署到 Vercel 后，需要在 Vercel 后台配置环境变量：

1. 打开 [Vercel 控制台](https://vercel.com/dashboard)
2. 找到你的博客项目，点击进入
3. 点击顶部的 **Settings** 标签
4. 左侧菜单找到 **Environment Variables**
5. 依次添加以下 3 个变量：

| 变量名 | 值 | 勾选环境 |
|--------|-----|----------|
| `IMGBED_DOMAIN` | 你的图床域名，比如 `https://i.022311.xyz` | ✅ Production |
| `IMGBED_ADMIN_TOKEN` | 你的图床管理 Token | ✅ Production |
| `IMGBED_GALLERY_DIR` | 画廊目录，比如 `/nfsw` | ✅ Production |

6. 每个变量填好后点击 **Save**

> ⚠️ **重要**：配置完环境变量后，需要**重新部署**一次才能生效。可以在 Vercel 的 Deployments 页面点击最新部署右边的 `...` → `Redeploy`。

---

## 八、第六步：本地验证

改完所有代码后，先在本地跑一下确认没问题。

### 8.1 类型检查

先跑类型检查，确保没有 TypeScript 错误：

```bash
pnpm astro check
```

正常情况下应该输出：

```
Result (xx files):
- 0 errors
- 0 warnings
- 0 hints
```

如果有报错，根据错误信息排查。最常见的是路径写错、缺少类型定义等。

### 8.2 启动开发服务器

```bash
pnpm dev
```

默认地址是 `http://localhost:4321`

### 8.3 验证 API 接口

先单独验证 API 能不能正常工作：

在浏览器访问 `http://localhost:4321/api/gallery`

**正常情况**：返回一个 JSON 数组，里面是图片的 url 和 name，类似：

```json
[
  {"url":"https://i.022311.xyz/file/xxx.jpg","name":"xxx.jpg"},
  {"url":"https://i.022311.xyz/file/yyy.jpg","name":"yyy.jpg"}
]
```

**常见错误：**
- `{"error":"Admin token is not configured"}` — 环境变量没配好，检查 `.env.local` 文件
- `{"error":"Imgbed API request failed", "status": 401}` — Token 不对，401 是未授权
- `{"error":"Imgbed API request failed", "status": 404}` — 目录不存在或者 API 路径不对

### 8.4 验证页面

API 没问题后，访问 `http://localhost:4321/gallery`

检查以下几点：

- ✅ 页面标题是 "Gallery"，样式和其他页面一致
- ✅ 顶部导航栏有 Gallery 链接，且是高亮状态
- ✅ 面包屑显示 `Home » Gallery`
- ✅ 图片以瀑布流形式显示
- ✅ 鼠标悬停在图片上，边框变色且图片轻微放大
- ✅ 点击图片，弹出灯箱大图
- ✅ 按 ESC 键 / 点背景 / 点 × 按钮都能关闭灯箱
- ✅ 切换深浅色主题，画廊的颜色也跟着变
- ✅ 手机尺寸（缩小浏览器宽度）下是 2 列，平板 3 列，桌面 4 列

---

## 九、第七步：部署到 Vercel

本地验证通过后，就可以部署了：

1. 把所有改动提交到 Git 仓库
   ```bash
   git add .
   git commit -m "feat: add gallery page"
   git push
   ```

2. Vercel 检测到 main 分支有更新，会自动重新部署

3. 等部署完成后，访问你的线上域名 `/gallery` 路径，确认一切正常

> 💡 第一次部署后如果 API 返回 Token 未配置的错误，确认 Vercel 后台环境变量都加了，然后手动 Redeploy 一次。

---

## 十、自定义配置指南

### 10.1 修改瀑布流列数

在 `src/pages/gallery.astro` 中，找到 `#gallery` 的 class：

```astro
<div id="gallery" class="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 hidden">
```

修改对应断点的列数：
- `columns-2` — 手机端列数
- `sm:columns-3` — 平板端列数（≥640px）
- `lg:columns-4` — 桌面端列数（≥1024px）

比如想让桌面端显示 5 列，改成 `lg:columns-5` 就行。

### 10.2 修改缓存时间

在 `api/gallery.ts` 中，找到：

```typescript
res.setHeader("Cache-Control", "public, max-age=300");
```

`max-age=300` 就是缓存 300 秒（5 分钟），改成你想要的秒数就行。

- 图片更新频繁 → 设小一点，比如 60（1 分钟）
- 图片很少更新 → 设大一点，比如 3600（1 小时）

### 10.3 修改图片数量

在 `api/gallery.ts` 中，找到 URL 里的 `pageSize=50`：

```typescript
const apiUrl = `${IMGBED_DOMAIN}/api/manage/list?dir=...&pageSize=50`;
```

改成你想要的数量，比如 `pageSize=100` 就是加载 100 张。

> ⚠️ 注意：太多图片会导致页面加载慢，建议 50-100 张比较合适。

### 10.4 修改画廊目录

有两种方式：

**方式一：改环境变量（推荐）**

在 Vercel 后台修改 `IMGBED_GALLERY_DIR` 的值，然后重新部署。

**方式二：改代码默认值**

在 `api/gallery.ts` 中：

```typescript
const TARGET_DIR = process.env.IMGBED_GALLERY_DIR || "/nfsw";
```

把 `/nfsw` 改成你想要的默认目录。

### 10.5 改成网格布局

如果你不喜欢瀑布流的错落感，想要整齐的网格布局：

把 `#gallery` 的 class 从：
```astro
class="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 hidden"
```

改成：
```astro
class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 hidden"
```

然后把每张图片的容器从：
```astro
class="group mb-3 block w-full ... break-inside-avoid"
```

改成（加 `aspect-square` 统一比例）：
```astro
class="group block w-full aspect-square ..."
```

图片的 class 从：
```astro
class="block w-full h-auto ..."
```

改成：
```astro
class="w-full h-full object-cover ..."
```

这样就变成整齐的方形网格了。

---

## 十一、常见问题排查

### Q1: 部署后 API 返回 404

**症状**：访问 `/api/gallery` 返回 404 Not Found

**可能原因：**
1. `api/` 目录放错位置了 — 必须在**项目根目录**，和 `src/` 同级
2. 文件名不对 — 必须是 `gallery.ts` 或 `gallery.js`
3. 部署平台不是 Vercel — 这个方案是 Vercel 专用的

**解决方法：**
- 确认文件路径是 `你的项目/api/gallery.ts`
- 确认部署在 Vercel 上

---

### Q2: API 返回 "Admin token is not configured"

**症状**：API 返回 500，错误信息是 "Admin token is not configured"

**原因**：环境变量 `IMGBED_ADMIN_TOKEN` 没配置

**解决方法：**
- 本地：检查 `.env.local` 文件是否存在，Token 是否填了
- 线上：检查 Vercel 后台 Environment Variables 是否加了 `IMGBED_ADMIN_TOKEN`
- 配置完后需要重新部署才能生效

---

### Q3: API 返回 401 Unauthorized

**症状**：API 返回 500，detail 里有 401 状态码

**原因**：Token 不对或者过期了

**解决方法：**
- 去图床后台重新生成 Token
- 更新到环境变量里
- 重新部署

---

### Q4: 页面显示 "Failed to load gallery"

**症状**：画廊页面一直显示加载失败

**排查步骤：**
1. 按 F12 打开开发者工具，看 Console 里的错误
2. 看 Network 标签里 `/api/gallery` 请求的状态码和响应
3. 根据返回的错误信息对应排查

---

### Q5: 灯箱点图片也会关闭

**症状**：点灯箱里的大图也会关闭

**原因**：点击事件冒泡了

**检查**：确认代码里有这一行：
```javascript
if (e.target === lightbox) closeLightbox();
```
`e.target === lightbox` 确保只有点的是背景层（不是图片）才关闭。

---

### Q6: 深浅色模式下颜色不对

**症状**：切换主题后，画廊的边框/文字颜色没变

**原因**：用了硬编码的颜色，没有用主题变量

**解决方法**：确保用的是这些类名：
- 边框：`border-border`
- 文字主色：默认就是，不用加
- 文字次要色：`text-muted-foreground`
- 强调色：`text-accent`
- 背景：`bg-background`

这些类名对应的颜色定义在 `src/styles/theme.css` 里，深浅色各有一套值。

---

### Q7: astro check 报错 "Cannot find name 'process'"

**症状**：类型检查报错，说找不到 process

**原因**：没装 `@types/node`

**解决方法**：
```bash
pnpm add -D @types/node
```

并且确认 `api/gallery.ts` 第一行是：
```typescript
/// <reference types="node" />
```

---

### Q8: 从其他页面点过来画廊不加载

**症状**：从首页点导航到画廊，图片不显示，刷新一下又好了

**原因**：Astro 的 View Transitions 页面切换时 JS 没有重新执行

**解决方法**：确认代码里有这一行：
```javascript
document.addEventListener("astro:page-load", loadGallery);
```
监听 `astro:page-load` 事件，每次页面切换后重新加载画廊。

---

## 十二、完整文件清单

最后回顾一下，整个画廊功能涉及这些文件：

### 新增的文件

| 文件路径 | 作用 |
|----------|------|
| `api/gallery.ts` | Vercel Serverless Function，从图床获取图片列表 |
| `src/pages/gallery.astro` | 画廊页面，瀑布流 + 灯箱 |
| `.env.local`（可选） | 本地开发环境变量 |

### 修改的文件

| 文件路径 | 修改内容 |
|----------|----------|
| `src/components/Header.astro` | 添加 Gallery 导航入口 |
| `src/components/Breadcrumb.astro` | 添加 gallery 路径的面包屑标签 |

### 安装的依赖

| 包名 | 用途 |
|------|------|
| `@types/node` | Node.js 类型定义，API 文件类型检查用 |

### Vercel 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `IMGBED_DOMAIN` | 否 | 图床域名，有默认值 |
| `IMGBED_ADMIN_TOKEN` | **是** | 图床管理 Token |
| `IMGBED_GALLERY_DIR` | 否 | 画廊目录，有默认值 |

---

**🎉 恭喜！** 到这里你的画廊页面就完全搭建好了。

如果遇到教程里没提到的问题，可以：
1. 先看浏览器 Console 和 Network 里的错误信息
2. 检查 Vercel 的 Functions 日志（Vercel 项目后台 → Functions）
3. 对照本教程的代码逐行对比，看看哪里写错了

---

*文档版本：v1.0*
*最后更新：2026-08-02*
