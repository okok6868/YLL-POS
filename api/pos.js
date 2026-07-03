export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success:false, error:"Method not allowed" });
  }

  const gasUrl = "https://script.google.com/macros/s/AKfycbwU1ydbLBW0QrMde-_ecy4liE4oVBopuG5HAtZb6W23OjdV1LgRRl8ervlZNWuf3qPzcQ/exec";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const r = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(req.body || {}),
      signal: controller.signal
    });
    clearTimeout(timer);

    const text = await r.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      const looksLikeGoogle404 = text.includes("Page Not Found") || text.includes("docs.google.com") || text.includes("<!DOCTYPE html");
      return res.status(500).json({
        success:false,
        error: looksLikeGoogle404
          ? "Apps Script deployment URL is wrong or expired. Update api/pos.js gasUrl with the latest Web app /exec URL."
          : "Apps Script returned non-JSON. Check Apps Script deployment and duplicate GS files.",
        raw:text.slice(0,220)
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    if (err && err.name === "AbortError") {
      return res.status(504).json({ success:false, error:"Apps Script timeout after 30 seconds. Check deployment URL or Apps Script speed." });
    }
    return res.status(500).json({ success:false, error:err.message || String(err) });
  }
}
