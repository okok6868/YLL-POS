export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const gasUrl =
    process.env.GAS_URL ||
    "https://script.google.com/macros/s/AKfycbwU1ydbLBW0QrMde-_ecy4liE4oVBopuG5HAtZb6W23OjdV1LgRRl8ervlZNWuf3qPzcQ/exec";

  const action = String((req.body && req.body.action) || "");
  let timeoutMs =
    action === "bossLogin" ? 30000 :
    action === "getBossDashboardFast" ? 30000 :
    action === "getBossOverview" ? 18000 :
    action === "getTodayReport" ? 15000 :
    action === "getOrderByClientId" ? 15000 :
    action === "saveOrder" ? 26000 :
    22000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(req.body || {}),
      signal: controller.signal,
      redirect: "follow"
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      const looksLikeGoogleHtml =
        text.includes("Page Not Found") ||
        text.includes("docs.google.com") ||
        text.includes("<!DOCTYPE html") ||
        text.includes("<html");

      return res.status(502).json({
        success: false,
        error: looksLikeGoogleHtml
          ? "Apps Script returned HTML instead of POS data. Check that GAS_URL is the latest deployed /exec URL."
          : "Apps Script returned non-JSON. Check the Apps Script deployment and duplicate GS files.",
        raw: looksLikeGoogleHtml ? "" : text.slice(0, 220)
      });
    }

    return res.status(response.ok ? 200 : 502).json(data);
  } catch (err) {
    if (err && err.name === "AbortError") {
      return res.status(504).json({
        success: false,
        error: `Apps Script timeout after ${Math.round(timeoutMs / 1000)} seconds. The POS will verify the client order ID before allowing a retry.`
      });
    }

    return res.status(500).json({
      success: false,
      error: (err && err.message) || String(err)
    });
  } finally {
    clearTimeout(timer);
  }
}
