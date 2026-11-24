// Vercel serverless function: receives the contact form and the checklist
// download requests from saetechai.com and delivers them by email.
//
// Env vars (Vercel project settings):
//   CONTACT_TO       destination mailbox (never exposed to the browser)
//   RESEND_API_KEY   optional: if set, mail is sent through Resend from CONTACT_FROM
//   CONTACT_FROM     optional sender for Resend, e.g. "SaeTech <web@saetechai.com>"
// Without RESEND_API_KEY the message is relayed through formsubmit.co's AJAX
// endpoint (server-side, so the address never appears in the page).

const ALLOWED_ORIGINS = [
    'https://saetechai.com', 'https://www.saetechai.com',
    'http://saetechai.com', 'http://www.saetechai.com',
    'https://goorum04.github.io',
];
const MAX = { nom: 120, contacte: 160, negoci: 120, missatge: 4000 };
const hits = new Map(); // ip -> [timestamps]

function cors(req, res) {
    const o = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(o)) res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function clean(v, max) { return String(v || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max); }
function limited(ip) {
    const now = Date.now(); const arr = (hits.get(ip) || []).filter(t => now - t < 3600e3);
    arr.push(now); hits.set(ip, arr); return arr.length > 8;
}

async function sendResend({ subject, text, replyTo }) {
    const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.CONTACT_FROM || 'SaeTech <onboarding@resend.dev>', to: [process.env.CONTACT_TO], subject, text, reply_to: replyTo || undefined }),
    });
    if (!r.ok) throw new Error('resend ' + r.status + ' ' + (await r.text()).slice(0, 200));
}
async function sendFormsubmit({ subject, text, replyTo, fields }) {
    const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(process.env.CONTACT_TO), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: subject, _template: 'table', _replyto: replyTo || '', ...fields, missatge: text }),
    });
    if (!r.ok) throw new Error('formsubmit ' + r.status + ' ' + (await r.text()).slice(0, 200));
}

module.exports = async (req, res) => {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });
    if (!process.env.CONTACT_TO) return res.status(500).json({ ok: false, error: 'not configured' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};
    if (body.website) return res.status(200).json({ ok: true }); // honeypot: pretend success
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (limited(ip)) return res.status(429).json({ ok: false, error: 'rate' });

    const kind = body.kind === 'checklist' ? 'checklist' : 'contact';
    const nom = clean(body.nom, MAX.nom), contacte = clean(body.contacte, MAX.contacte), negoci = clean(body.negoci, MAX.negoci), missatge = clean(body.missatge, MAX.missatge);
    const lang = clean(body.lang, 5) || 'ca', page = clean(body.page, 200);
    if (kind === 'contact' && (!nom || !contacte || !missatge)) return res.status(400).json({ ok: false, error: 'missing' });
    if (kind === 'checklist' && !contacte) return res.status(400).json({ ok: false, error: 'missing' });
    const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacte) ? contacte : '';

    const subject = kind === 'checklist' ? `Checklist LQPD descarregada: ${contacte}` : `Contacte web: ${nom}${negoci ? ' · ' + negoci : ''}`;
    const text = kind === 'checklist'
        ? `Algú ha demanat la checklist LQPD.\n\nContacte: ${contacte}\nNegoci: ${negoci || '-'}\nIdioma: ${lang}\nPàgina: ${page}\nIP: ${ip}`
        : `Nom: ${nom}\nContacte: ${contacte}\nNegoci: ${negoci || '-'}\nIdioma: ${lang}\nPàgina: ${page}\n\n${missatge}`;
    try {
        if (process.env.RESEND_API_KEY) await sendResend({ subject, text, replyTo });
        else await sendFormsubmit({ subject, text, replyTo, fields: { nom, contacte, negoci, idioma: lang, pagina: page } });
        return res.status(200).json({ ok: true });
    } catch (e) {
        console.error('contact error', e.message);
        return res.status(502).json({ ok: false, error: 'delivery' });
    }
};
