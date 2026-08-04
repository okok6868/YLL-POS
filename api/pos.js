export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success:false, error:"Method not allowed" });
  }

  const gasUrl = process.env.GAS_URL ||
    "https://script.google.com/macros/s/AKfycby1joExZ4U8BUdGJo8MYMvPGTg7YGYT0DDwu1Wt1aBRsJbsP19W1WUeW-q_WPWwVFxOvA/exec";

  try {
    const body = JSON.stringify(req.body || {});
    let upstream = null;
    let text = "";

    // Apps Script ContentService responds to POST with a temporary 302 URL.
    // Follow it explicitly; automatic redirect handling can intermittently
    // turn the temporary googleusercontent URL into a Google 404 HTML page.
    for (let attempt = 1; attempt <= 3; attempt++) {
      const first = await fetch(gasUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
          "Cache-Control": "no-cache"
        },
        body,
        redirect: "manual"
      });

      const location = first.headers.get("location");
      upstream = location
        ? await fetch(location, {
            method: "GET",
            headers: { "Cache-Control": "no-cache" },
            redirect: "follow"
          })
        : first;

      text = await upstream.text();
      const looksLikeGoogle404 = upstream.status === 404 &&
        /<title>Page not found<\/title>/i.test(text);

      if (!looksLikeGoogle404) break;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 150 * attempt));
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        success:false,
        error:"Apps Script returned non-JSON after redirect retry.",
        upstreamStatus:upstream ? upstream.status : null,
        raw:text.slice(0,500)
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ success:false, error:err.message || String(err) });
  }
}
