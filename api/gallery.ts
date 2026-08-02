// /api/gallery.ts（项目根目录）
import type { VercelRequest, VercelResponse } from '@vercel/node';

const IMGBED_DOMAIN = process.env.IMGBED_DOMAIN || "https://i.022311.xyz";
const ADMIN_TOKEN = process.env.IMGBED_ADMIN_TOKEN || "";
const TARGET_DIR = process.env.IMGBED_GALLERY_DIR || "/nfsw";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.setHeader("Content-Type", "application/json");

  try {
    const response = await fetch(
      `${IMGBED_DOMAIN}/api/manage/list?dir=${encodeURIComponent(TARGET_DIR)}&fileType=image&count=50`,
      { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
    );
    const data = await response.json();
    const files = data.files || [];
    const images = files.map((item: { name: string }) => ({
      url: `${IMGBED_DOMAIN}/file/${encodeURIComponent(item.name)}`,
      name: item.name,
    }));
    res.status(200).json(images);
  } catch (e) {
    console.error("Gallery API error:", e);
    res.status(500).json([]);
  }
}