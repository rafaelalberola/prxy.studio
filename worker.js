// Cloudflare Worker — PRXY.STUDIO email proxy + contact form
// Deploy: npx wrangler deploy
// Secrets: wrangler secret put BEEHIIV_API_KEY / wrangler secret put BEEHIIV_PUB_ID
//          wrangler secret put TELEGRAM_BOT_TOKEN / wrangler secret put TELEGRAM_CHAT_ID

function cors(request) {
  return {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || 'https://prxy.studio',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(body, status, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(request) },
  });
}

async function handleSubscribe(request, env) {
  const { email } = await request.json();

  if (!email || !email.includes('@')) {
    return json({ error: 'Invalid email' }, 400, request);
  }

  const res = await fetch(
    `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUB_ID}/subscriptions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.BEEHIIV_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: true,
      }),
    }
  );

  const data = await res.json();
  return json(data, res.status, request);
}

async function handleContact(request, env) {
  const { type, description, email, phone } = await request.json();

  if (!email || !email.includes('@')) {
    return json({ error: 'Invalid email' }, 400, request);
  }
  if (!type) {
    return json({ error: 'Type required' }, 400, request);
  }

  const text =
    `📩 NUEVO LEAD — PRXY.STUDIO\n\n` +
    `Tipo: ${type}\n` +
    `Email: ${email}\n` +
    (phone ? `Tel: ${phone}\n` : '') +
    (description ? `\nProyecto:\n${description}` : '');

  const tg = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
      }),
    }
  );

  if (!tg.ok) {
    return json({ error: 'Failed to send' }, 500, request);
  }

  return json({ ok: true }, 200, request);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors(request) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === '/contact') {
        return await handleContact(request, env);
      }
      return await handleSubscribe(request, env);
    } catch (e) {
      return json({ error: 'Server error' }, 500, request);
    }
  },
};
