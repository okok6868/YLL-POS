export const config = { maxDuration: 60 };

const GAS_URL = "https://script.google.com/macros/s/AKfycby1joExZ4U8BUdGJo8MYMvPGTg7YGYT0DDwu1Wt1aBRsJbsP19W1WUeW-q_WPWwVFxOvA/exec";

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGas(body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body || {}),
      signal: controller.signal
    });
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success:false, error:"Method not allowed" });
  }

  const body = req.body || {};
  const action = String(body.action || "");
  // Only reads and the idempotent login request may retry automatically.
  // Writes such as saveOrder, refunds and stock changes are never repeated here.
  const safeToRetry = /^get[A-Z]/.test(action) || action === "bossLogin";
  const attempts = safeToRetry ? 2 : 1;
  const timeoutMs = safeToRetry ? 26000 : 55000;
  let lastText = "";

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const text = await callGas(body, timeoutMs);
      lastText = text;
      try {
        return res.status(200).json(JSON.parse(text));
      } catch (parseError) {
        const looksLikeGoogleHtml = text.includes("Page Not Found") || text.includes("docs.google.com") || text.includes("<!DOCTYPE html");
        if (looksLikeGoogleHtml && attempt + 1 < attempts) {
          await wait(350);
          continue;
        }
        return res.status(500).json({
          success:false,
          error: looksLikeGoogleHtml
            ? "Apps Script returned a temporary HTML response instead of POS data after an automatic retry."
            : "Apps Script returned non-JSON. Check Apps Script deployment and duplicate GS files.",
          raw:""
        });
      }
    } catch (err) {
      if (safeToRetry && attempt + 1 < attempts) {
        await wait(350);
        continue;
      }
      if (err && err.name === "AbortError") {
        return res.status(504).json({ success:false, error:`Apps Script timeout while running ${action || "request"}.` });
      }
      return res.status(500).json({ success:false, error:err.message || String(err) });
    }
  }

  return res.status(500).json({ success:false, error:"Apps Script did not return POS data after an automatic retry.", raw:lastText ? "" : "" });
}
