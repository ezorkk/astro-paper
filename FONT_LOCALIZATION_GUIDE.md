# Astro Paper 字体本地化改造完整教程

> 本文档记录了将 Astro Paper v6 的 Google Fonts 在线字体改为完全本地离线字体的全过程，包含所有修改文件的前后对比。
>
> **适用场景**：国内服务器 / 网络环境不稳定 / 希望完全离线运行
>
> **改动文件数**：4 个修改 + 6 个新增
> **预计操作时间**：10 分钟

---

## 目录

- [一、为什么要改](#一为什么要改)
  - [1.1 原始问题](#11-原始问题)
  - [1.2 改造目标](#12-改造目标)
- [二、改动总览](#二改动总览)
- [三、详细修改步骤](#三详细修改步骤)
  - [3.1 astro.config.ts](#31-astroconfigts)
  - [3.2 src/styles/global.css](#32-srcstylesglobalcss)
  - [3.3 src/styles/theme.css](#33-srcstylesthemecss)
  - [3.4 src/layouts/Layout.astro](#34-srclayoutslayoutastro)
- [四、新增文件](#四新增文件)
  - [4.1 src/styles/fonts.css](#41-srcstylesfontscss)
  - [4.2 public/fonts/ 字体文件](#42-publicfonts-字体文件)
- [五、验证方法](#五验证方法)
- [六、原理说明](#六原理说明)
- [七、常见问题](#七常见问题)

---

## 一、为什么要改

### 1.1 原始问题

Astro Paper v6 默认使用 Astro 7 内置的**字体优化功能**（`fontProviders.google()`），它会在每次启动 dev server 或构建时，从 Google Fonts 的 API 拉取字体元数据：

```
Could not fetch from `https://fonts.google.com/metadata/fonts`. Will retry in `1000ms`. `3` retries left.
Could not initialize provider `google-c200761b0711fe56`. `unifont` will not be able to process fonts provided by this provider.
```

**问题原因**：
- 国内访问 Google Fonts 不稳定，经常超时
- 每次启动都要重新拉取，拖慢开发速度
- 生产环境也依赖 Google Fonts CDN，首屏字体加载可能延迟

### 1.2 改造目标

- ✅ **完全离线** — 字体文件全部在本地，不依赖任何网络资源
- ✅ **零启动延迟** — dev server 秒开，不再等字体元数据
- ✅ **效果不变** — 字体、字重、fallback 列表和原来完全一样
- ✅ **深浅色兼容** — 不影响主题切换
- ✅ **构建稳定** — 生产构建不再因为网络问题失败

---

## 二、改动总览

| 文件 | 操作 | 改动量 |
|------|------|--------|
| `astro.config.ts` | 修改 | 移除 2 行导入 + 移除 fonts 配置块（约 15 行） |
| `src/styles/global.css` | 修改 | 替换 1 行 import |
| `src/styles/theme.css` | 修改 | 新增 1 行 CSS 变量 |
| `src/layouts/Layout.astro` | 修改 | 移除 1 行 import + 移除 Font 组件（约 5 行） |
| `src/styles/fonts.css` | **新增** | 5 个 @font-face 定义 |
| `public/fonts/*.ttf` | **新增** | 5 个字体文件（共约 52MB） |

---

## 三、详细修改步骤

### 3.1 astro.config.ts

**作用**：移除 Astro 内置的字体优化配置

#### 修改前

```typescript
import {
  defineConfig,
  envField,
  fontProviders,          // ← 这行要删
  svgoOptimizer,
} from "astro/config";

// ... 中间其他配置不变 ...

  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [                   // ← 整个 fonts 配置块要删
    {
      name: "Noto Sans SC",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      fallbacks: [
        "system-ui", 
        "-apple-system", 
        "PingFang SC",
        "Microsoft YaHei",
        "sans-serif"
      ],
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      formats: ["woff", "ttf"],
    },
  ],
  env: {
```

#### 修改后

```typescript
import {
  defineConfig,
  envField,
  svgoOptimizer,
} from "astro/config";

// ... 中间其他配置不变 ...

  vite: {
    plugins: [tailwindcss()],
  },
  env: {
```

#### 改动说明

1. **移除 `fontProviders` 导入** — 不再使用 Astro 内置的 Google Fonts provider
2. **移除整个 `fonts` 配置块** — 告诉 Astro 不要管字体了，我们自己来

> 💡 为什么不移除 `envField` 和 `svgoOptimizer`？
> 因为这两个是其他功能用的，和字体没关系，保留就行。

---

### 3.2 src/styles/global.css

**作用**：把网络字体引入换成本地字体文件引入

#### 修改前

```css
@import "tailwindcss";
@import url("https://fonts.loli.net/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap");
@import "./theme.css";
@import "./typography.css";
@import "rehype-callouts/theme/obsidian";
```

> 注：如果你之前没改过，原来可能是直接用 Astro 内置字体，global.css 里没有这行网络字体 import。那你只需要新增 `@import "./fonts.css";` 就行。

#### 修改后

```css
@import "tailwindcss";
@import "./fonts.css";
@import "./theme.css";
@import "./typography.css";
@import "rehype-callouts/theme/obsidian";
```

#### 改动说明

- 把 `@import url("https://fonts.loli.net/...")` 换成了 `@import "./fonts.css"`
- 字体从「从网络加载」变成「从本地 CSS 文件加载」
- 加载顺序：先加载字体定义，再加载主题样式（确保主题里的字体变量能找到字体）

> 💡 CSS @import 的顺序很重要！`fonts.css` 必须在 `theme.css` 之前加载，因为 theme.css 里用到了字体变量。

---

### 3.3 src/styles/theme.css

**作用**：补上字体 CSS 变量的定义

#### 修改前

```css
/* Light theme values */
:root,
[data-theme="light"] {
  --background: #fdfdfd;
  --foreground: #282728;
  --accent: #006cac;
  --accent-foreground: #ffffff;
  --muted: #e6e6e6;
  --muted-foreground: #6b7280;
  --border: #ece9e9;
}
```

#### 修改后

```css
/* Light theme values */
:root,
[data-theme="light"] {
  --background: #fdfdfd;
  --foreground: #282728;
  --accent: #006cac;
  --accent-foreground: #ffffff;
  --muted: #e6e6e6;
  --muted-foreground: #6b7280;
  --border: #ece9e9;
  --font-google-sans-code: "Noto Sans SC", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
}
```

#### 改动说明

新增了一行：
```css
--font-google-sans-code: "Noto Sans SC", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
```

**为什么要加这一行？**

原来 Astro 的 `fontProviders.google()` 会自动注入这个 CSS 变量。现在我们不用 Astro 的字体功能了，就得自己定义这个变量。

**变量名为什么叫 `--font-google-sans-code`？**

因为 Astro Paper 主题里所有用到字体的地方，都是通过这个变量引用的：

```css
@theme inline {
  --font-app: var(--font-google-sans-code);
  /* ... */
}
```

如果变量名不一样，主题就找不到字体了。所以必须保持和原来一样的变量名。

**为什么只在浅色模式的 :root 里加？**

因为字体和颜色没关系，深浅色模式用的是同一个字体。放在 `:root` 里，所有模式都能继承到。

**Fallback 字体列表说明：**

| 字体 | 作用 |
|------|------|
| `"Noto Sans SC"` | 首选字体，我们下载的本地字体 |
| `system-ui` | 系统默认 UI 字体 |
| `-apple-system` | 苹果系统字体（Safari 兼容） |
| `"PingFang SC"` | 苹果系统的中文字体 |
| `"Microsoft YaHei"` | Windows 系统的中文字体 |
| `sans-serif` | 兜底无衬线字体 |

这个列表和原来 Astro 配置里的 fallbacks 完全一致。

---

### 3.4 src/layouts/Layout.astro

**作用**：移除 Astro 内置的 `<Font>` 组件

#### 修改前

```astro
---
import { Font } from "astro:assets";
import { ClientRouter } from "astro:transitions";
import { getRelativeLocaleUrl } from "astro:i18n";
import { resolveDefaultOgImagePath } from "@/utils/resolveDefaultOgImagePath";
import { getAssetPath } from "@/utils/withBase";
import config from "@/config";
import "@/styles/global.css";
---

<!-- ... 中间 ... -->

    <meta name="generator" content={Astro.generator} />

    <!-- Font -->
    <Font
      cssVariable="--font-google-sans-code"
      preload={[{ subset: "latin", weight: 400, style: "normal" }]}
    />

    <!-- Primary meta -->
    <title>{title}</title>
```

#### 修改后

```astro
---
import { ClientRouter } from "astro:transitions";
import { getRelativeLocaleUrl } from "astro:i18n";
import { resolveDefaultOgImagePath } from "@/utils/resolveDefaultOgImagePath";
import { getAssetPath } from "@/utils/withBase";
import config from "@/config";
import "@/styles/global.css";
---

<!-- ... 中间 ... -->

    <meta name="generator" content={Astro.generator} />

    <!-- Primary meta -->
    <title>{title}</title>
```

#### 改动说明

1. **移除 `import { Font } from "astro:assets"`** — 不再导入 Font 组件
2. **移除 `<Font ... />` 组件** — 不再使用这个组件

**`<Font>` 组件本来是干嘛的？**

Astro 内置的 `<Font>` 组件会：
1. 根据 `cssVariable` 去 `astro.config.ts` 的 `fonts` 配置里找对应字体
2. 生成 `<link rel="preload">` 预加载标签
3. 注入 `@font-face` CSS 样式

现在我们已经自己做了这些事情（fonts.css 里定义了 @font-face），所以这个组件就没用了。

**如果不移除会怎样？**

会报错 `FontFamilyNotFound`，因为 `<Font>` 组件去配置里找 `--font-google-sans-code`，但我们已经把配置删了。

---

## 四、新增文件

### 4.1 src/styles/fonts.css

**作用**：定义本地字体的 @font-face 规则

#### 完整代码

```css
/* Noto Sans SC - Local Fonts */
/* 完全离线，不依赖任何网络资源 */

@font-face {
  font-family: 'Noto Sans SC';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url('/fonts/NotoSansSC-300.ttf') format('truetype');
}

@font-face {
  font-family: 'Noto Sans SC';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/NotoSansSC-400.ttf') format('truetype');
}

@font-face {
  font-family: 'Noto Sans SC';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/NotoSansSC-500.ttf') format('truetype');
}

@font-face {
  font-family: 'Noto Sans SC';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/NotoSansSC-600.ttf') format('truetype');
}

@font-face {
  font-family: 'Noto Sans SC';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/NotoSansSC-700.ttf') format('truetype');
}
```

#### 逐属性解释

| 属性 | 值 | 说明 |
|------|-----|------|
| `font-family` | `'Noto Sans SC'` | 字体名称，CSS 里引用时用这个名字 |
| `font-style` | `normal` | 字体样式（正常/斜体），中文字体一般没有斜体 |
| `font-weight` | `300` / `400` / `500` / `600` / `700` | 字重，从细到粗 |
| `font-display` | `swap` | 字体加载策略：先用 fallback 字体显示，加载完再替换，避免 FOIT（Flash Of Invisible Text） |
| `src` | `url('/fonts/xxx.ttf') format('truetype')` | 字体文件路径和格式 |

#### 为什么是 5 个字重？

原来 Astro 配置里定义的是 `weights: [300, 400, 500, 600, 700]`，我们保持一致。

各字重的用途：
- **300**（Light）— 极细，很少用
- **400**（Regular）— 正文默认字重
- **500**（Medium）— 中等，部分强调文字
- **600**（SemiBold）— 半粗，小标题
- **700**（Bold）— 粗体，大标题、加粗文字

---

### 4.2 public/fonts/ 字体文件

**作用**：存放实际的字体文件

#### 文件清单

| 文件名 | 字重 | 大小 |
|--------|------|------|
| `NotoSansSC-300.ttf` | Light（细体） | ~10 MB |
| `NotoSansSC-400.ttf` | Regular（常规体） | ~10 MB |
| `NotoSansSC-500.ttf` | Medium（中等体） | ~10 MB |
| `NotoSansSC-600.ttf` | SemiBold（半粗体） | ~10 MB |
| `NotoSansSC-700.ttf` | Bold（粗体） | ~10 MB |
| **合计** | | **~52 MB** |

#### 路径说明

字体文件放在 `public/fonts/` 目录下，因为：
- `public/` 目录下的文件会被原样复制到构建产物的根目录
- 访问路径就是 `/fonts/NotoSansSC-400.ttf`
- 正好对应 `fonts.css` 里的 `url('/fonts/xxx.ttf')`

#### 怎么获取这些文件？

**方法一：从国内镜像下载（推荐）**

```bash
# 以 fonts.loli.net 为例，先获取 CSS
curl "https://fonts.loli.net/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" -H "User-Agent: Mozilla/5.0"

# 从返回的 CSS 里提取字体 URL，然后逐个下载
curl -L "字体URL" -o public/fonts/NotoSansSC-300.ttf
```

**方法二：从 Google Fonts 官方下载**

去 https://fonts.google.com/noto/specimen/Noto+Sans+SC 下载完整字体包，然后从中提取需要的字重。

**方法三：从 GitHub 官方仓库下载**

https://github.com/notofonts/noto-cjk/tree/main/Sans/SubsetOTF/SC

> ⚠️ 注意：字体文件比较大（每个 ~10MB），确保你的网络稳定。

---

## 五、验证方法

### 5.1 类型检查

```bash
pnpm astro check
```

**预期结果**：
```
Result (57 files):
- 0 errors
- 0 warnings
- 1 hint  ← 这个是 gallery.ts 的 req 参数未使用，和字体无关
```

### 5.2 启动开发服务器

```bash
pnpm dev
```

**预期结果**：
- ✅ 启动速度快（不再等 Google Fonts 元数据）
- ✅ 没有 `Could not fetch from https://fonts.google.com/...` 报错
- ✅ 没有 `FontFamilyNotFound` 报错
- ✅ 页面正常显示

### 5.3 验证字体是否生效

1. 打开浏览器，访问 `http://localhost:4321`
2. 按 F12 打开开发者工具
3. 切到 **Network** 标签，刷新页面
4. 筛选 **Font** 类型
5. 应该能看到 5 个 `.ttf` 文件从本地加载（实际只会加载用到的字重）

6. 切到 **Elements** 标签，选中 `<body>` 元素
7. 看 **Computed** 里的 `font-family`，应该是 `Noto Sans SC`
8. 看 **Rendered Fonts**，应该显示 `Noto Sans SC`（不是 fallback 字体）

### 5.4 验证深浅色切换

1. 点击页面上的主题切换按钮
2. 深浅色切换正常
3. 字体在两种模式下都正常显示

---

## 六、原理说明

### 6.1 原来的字体加载流程

```
启动 dev server
    ↓
Astro 读取 fonts 配置
    ↓
请求 https://fonts.google.com/metadata/fonts  ← 国内访问慢/超时
    ↓
获取字体元数据
    ↓
生成 @font-face 和 preload 标签
    ↓
页面加载时从 Google Fonts CDN 下载字体  ← 国内访问慢
    ↓
字体生效
```

### 6.2 改造后的字体加载流程

```
启动 dev server
    ↓
（跳过字体相关的所有网络请求）
    ↓
页面加载
    ↓
浏览器读取 fonts.css
    ↓
发现 @font-face 定义
    ↓
从本地 /fonts/ 目录加载字体文件  ← 本地文件，秒开
    ↓
字体生效
```

### 6.3 为什么字体变量名不能改

Astro Paper 主题的设计 token 体系里，字体是通过 CSS 变量传递的：

```
@font-face 定义字体名
    ↓
--font-google-sans-code 变量 = 字体名 + fallback 列表
    ↓
--font-app 变量 = var(--font-google-sans-code)
    ↓
Tailwind 的 font-app 类 = var(--font-app)
    ↓
body 元素使用 font-app 类
```

如果改了 `--font-google-sans-code` 这个变量名，整条链就断了。所以必须保持变量名不变。

---

## 七、常见问题

### Q1: 字体文件太大了，能不能优化？

**A**: 可以，有几个优化方向：

1. **转 woff2 格式** — woff2 比 ttf 小约 30-50%，可以用 `fonttools` 或在线工具转换
2. **字体子集化** — 只保留常用汉字，体积能降到几百 KB。工具推荐：`fontmin`、`pyftsubset`
3. **只保留常用字重** — 如果 300 和 500 很少用，可以删掉，只留 400、600、700

### Q2: 为什么没有 italic 斜体？

**A**: Noto Sans SC 这款中文字体本身就没有设计斜体样式。中文的斜体一般是通过浏览器的算法倾斜实现的，效果不如原生斜体好。原来的 Astro 配置里虽然写了 `styles: ["normal", "italic"]`，但 Google Fonts 返回的也只有 normal，italic 会被忽略。所以我们本地版本也只放 normal 就够了。

### Q3: 部署到 Vercel 后字体会不会加载慢？

**A**: 不会。Vercel 有全球 CDN，字体文件会被缓存到离用户最近的节点。而且：
- `font-display: swap` 保证先显示 fallback 字体，不会白屏
- 浏览器缓存字体文件后，第二次访问就不用再下载了

### Q4: 能不能换成其他中文字体？

**A**: 可以。步骤：
1. 下载你想要的字体文件（比如思源黑体、霞鹜文楷等）
2. 放到 `public/fonts/` 目录
3. 修改 `fonts.css` 里的 `@font-face` 定义
4. 修改 `theme.css` 里的 `--font-google-sans-code` 变量的字体名

注意变量名 `--font-google-sans-code` 不要改，只改值就行。

### Q5: 为什么删掉 <Font> 组件后预加载没了？

**A**: 原来的 `<Font>` 组件会生成 `<link rel="preload">` 预加载标签，让浏览器提前下载字体。删掉后确实没有预加载了，但影响不大，因为：
- 本地字体加载本来就很快
- `font-display: swap` 保证了不会阻塞渲染
- 浏览器会在需要用到字体时才下载，用不到的字重不会浪费流量

如果你确实想要预加载，可以手动在 Layout.astro 的 `<head>` 里加：
```html
<link rel="preload" href="/fonts/NotoSansSC-400.ttf" as="font" type="font/ttf" crossorigin>
```

### Q6: 构建后字体路径对吗？

**A**: 对的。因为：
- `public/` 目录下的文件会被原样复制到构建产物根目录
- `public/fonts/xxx.ttf` → `dist/fonts/xxx.ttf`
- 访问路径 `/fonts/xxx.ttf` 正好对应

---

*文档版本：v1.0*
*最后更新：2026-08-03*
