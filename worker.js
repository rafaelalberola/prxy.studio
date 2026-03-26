// Cloudflare Worker — PRXY.STUDIO email proxy
// Deploy: npx wrangler deploy
// Secrets: wrangler secret put BEEHIIV_API_KEY / wrangler secret put BEEHIIV_PUB_ID

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': request.headers.get('Origin')||'https://prxy.studio',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { email } = await request.json();

      if (!email || !email.includes('@')) {
        return new Response(JSON.stringify({ error: 'Invalid email' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': request.headers.get('Origin')||'https://prxy.studio',
          },
        });
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
            send_welcome_email: false,
          }),
        }
      );

      const data = await res.json();

      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': request.headers.get('Origin')||'https://prxy.studio',
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': request.headers.get('Origin')||'https://prxy.studio',
        },
      });
    }
  },
};
