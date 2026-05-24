export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.WAG_API_KEY;
  const affId  = process.env.WAG_AFF_ID;
  if (!apiKey || !affId) {
    return res.status(503).json({ error: 'WAG_API_KEY and WAG_AFF_ID are not set in Vercel environment variables.' });
  }

  const BASE = 'https://services.walgreens.com/api/photo';
  const { action } = req.query;

  try {
    // ── Nearest stores ──────────────────────────────────────────────────
    if (action === 'store') {
      const { lat, lng } = req.query;
      const r = await fetch(
        `${BASE}/store/v3?lat=${lat}&lng=${lng}&radius=15&apiKey=${apiKey}&affId=${affId}`,
        { headers: { 'Accept': 'application/json' } }
      );
      return res.status(r.status).json(await r.json());
    }

    // ── Upload photo → Walgreens storage ────────────────────────────────
    if (action === 'upload' && req.method === 'POST') {
      // 1. Get S3 upload credentials from Walgreens
      const credsRes = await fetch(`${BASE}/creds/v3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey, affId,
          platform: 'YI',
          transaction: { total: '1', subTotal: '1' },
          appVer: '1.0',
          devInf: 'WEB'
        })
      });
      const creds = await credsRes.json();
      if (!credsRes.ok) return res.status(credsRes.status).json(creds);

      // 2. Upload image to the S3 path returned in creds
      const imgBuf = Buffer.from(req.body.imageData, 'base64');
      const { imageUploadPath, ...s3Fields } = creds;

      const boundary = 'PBBoundary' + Date.now();
      const fieldsPart = Object.entries(s3Fields)
        .map(([k, v]) => `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`)
        .join('');
      const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="strip.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`;
      const body = Buffer.concat([
        Buffer.from(fieldsPart + fileHeader),
        imgBuf,
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ]);

      const uploadRes = await fetch(imageUploadPath, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': String(body.length)
        },
        body
      });

      const photoKey = s3Fields.key || s3Fields.imageKey || s3Fields.filename || '';
      return res.json({ ok: uploadRes.ok, photoKey });
    }

    // ── Submit print order ──────────────────────────────────────────────
    if (action === 'order' && req.method === 'POST') {
      const r = await fetch(`${BASE}/order/submit/v3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, affId, ...req.body })
      });
      return res.status(r.status).json(await r.json());
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
