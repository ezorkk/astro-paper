// 注意：Astro v7 + Vite8 热更新存在已知bug，修改文件时仍有可能触发 astro:server-app.js 报错
// 如果频繁崩溃，强烈建议切换为访客公开接口方案（不用服务端API）

// 移除无效兼容写法，保留路由动态渲染
export const prerender = false;

// ===== Configuration =====
const IMGBED_DOMAIN = "https://i.022311.xyz";
const ADMIN_TOKEN =
  "imgbed_68f509c80033853a85f0109247584a15635724d4d8e439c62fe201c218e1f531";
// Target directory on imgbed (e.g. '/gallery'). Leave empty for root.
const TARGET_DIR = "/nfsw";
// Number of images to fetch
const COUNT = 400;
// Cache duration in seconds (5 min) — reduces repeated hits on imgbed API
const CACHE_TTL = 300;

export async function GET() {
  try {
    const apiUrl = new URL(`${IMGBED_DOMAIN}/api/manage/list`);
    apiUrl.searchParams.set("dir", TARGET_DIR);
    apiUrl.searchParams.set("fileType", "image");
    apiUrl.searchParams.set("count", String(COUNT));

    const res = await fetch(apiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        "User-Agent": "AstroBlog-GalleryProxy/1.0"
      }
    });

    if (!res.ok) {
      throw new Error(`Imgbed API responded with ${res.status}`);
    }

    const rawData = await res.json();
    const files = rawData.files ?? [];

    const images = files.map((item: { name: string }) => ({
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