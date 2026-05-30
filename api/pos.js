export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Fixed: API URL is written directly here, so you do NOT need Vercel Environment Variables.
  const gasUrl = "https://script.google.com/macros/s/AKfycbwU1ydbLBW0QrMde-_ecy4liE4oVBopuG5HAtZb6W23OjdV1LgRRl8ervlZNWuf3qPzcQ/exec";

  try {
    const r = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(req.body || {})
    });

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = {
        success:false,
        error:"Apps Script returned non-JSON. Please deploy Apps Script as NEW VERSION and allow Anyone access.",
        raw:text.slice(0,500)
      };
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ success:false, error: err.message || String(err) });
  }
}
