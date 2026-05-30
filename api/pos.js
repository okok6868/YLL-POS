export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const gasUrl = process.env.GAS_API_URL;
  if (!gasUrl) {
    return res.status(500).json({ success: false, error: "Missing GAS_API_URL in Vercel Environment Variables" });
  }

  try {
    const r = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(req.body || {})
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); }
    catch { data = { success:false, error:"Apps Script returned non-JSON", raw:text.slice(0,500) }; }
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ success:false, error: err.message || String(err) });
  }
}
