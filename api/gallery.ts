/// <reference types="node" />

export default async function handler(req, res) {
  const IMGBED_DOMAIN = process.env.IMGBED_DOMAIN || "https://i.022311.xyz";
  const ADMIN_TOKEN = process.env.IMGBED_ADMIN_TOKEN || "";
  const TARGET_DIR = process.env.IMGBED_GALLERY_DIR || "/nfsw";

  try {
    if (!ADMIN_TOKEN) {
      res.status(500).json({ error: "Admin token is not configured" });
      return;
    }

    const apiUrl = `${IMGBED_DOMAIN}/api/manage/list?dir=${encodeURIComponent(TARGET_DIR)}&fileType=image&count=50`;
    const response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });

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

    const images = files.map((item) => ({
      url: `${IMGBED_DOMAIN}/file/${encodeURIComponent(item.name)}`,
      name: item.name,
    }));

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