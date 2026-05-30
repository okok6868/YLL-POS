export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success:false, error:"Method not allowed" });
  }

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
    } catch (err) {
      return res.status(500).json({
        success:false,
        error:"Apps Script returned non-JSON. Check Apps Script deployment and duplicate GS files.",
        raw:text.slice(0,500)
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ success:false, error:err.message || String(err) });
  }
}
