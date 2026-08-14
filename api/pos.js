export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success:false, error:"Method not allowed" });
  }

  const gasUrl = "https://script.google.com/macros/s/AKfycby1joExZ4U8BUdGJo8MYMvPGTg7YGYT0DDwu1Wt1aBRsJbsP19W1WUeW-q_WPWwVFxOvA/exec";

  try {
    const controller = new AbortController();
    // Allow legitimate long Apps Script writes/reports to finish.
    const timer = setTimeout(() => controller.abort(), 55000);
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
      const looksLikeGoogleHtml = text.includes("Page Not Found") || text.includes("docs.google.com") || text.includes("<!DOCTYPE html");
      return res.status(500).json({
        success:false,
        error: looksLikeGoogleHtml
          ? "Apps Script returned a temporary HTML response instead of POS data. Try again; if it keeps happening, check the latest Web app /exec URL."
          : "Apps Script returned non-JSON. Check Apps Script deployment and duplicate GS files.",
        raw: looksLikeGoogleHtml ? "" : text.slice(0,220)
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    if (err && err.name === "AbortError") {
      return res.status(504).json({ success:false, error:"Apps Script timeout after 55 seconds. Check deployment URL or Apps Script speed." });
    }
    return res.status(500).json({ success:false, error:err.message || String(err) });
  }
}
