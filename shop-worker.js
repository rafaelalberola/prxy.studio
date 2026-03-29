// Cloudflare Worker — PRXY.STUDIO shop (Printful + Stripe)
// Deploy: npx wrangler deploy -c wrangler-shop.toml
// Secrets: PRINTFUL_TOKEN, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || 'https://prxy.studio';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const path = url.pathname;

    try {
      // ── GET /products ──
      if (path === '/products' && request.method === 'GET') {
        const listRes = await pfetch(env, '/store/products');
        if (listRes.code !== 200) return json({ error: 'Failed' }, 500, cors);

        const products = await Promise.all(
          listRes.result.map(async (p) => {
            const det = await pfetch(env, `/store/products/${p.id}`);
            if (det.code !== 200) return null;

            const sync = det.result.sync_product;
            const variants = det.result.sync_variants || [];
            const first = variants[0];

            // Collect all images from files
            const images = [];
            let thumbnail = sync.thumbnail_url;
            if (first && first.files) {
              for (const f of first.files) {
                const u = f.preview_url || f.thumbnail_url;
                if (u) {
                  images.push({ type: f.type, url: u });
                  // Use the product preview as thumbnail
                  if (f.type === 'preview' && f.preview_url) {
                    thumbnail = f.preview_url;
                  }
                }
              }
            }

            return {
              id: sync.id,
              name: sync.name,
              thumbnail,
              price: first ? first.retail_price : null,
              currency: first ? first.currency : 'EUR',
              images,
              variants: variants.map(v => ({
                id: v.id, size: v.size, color: v.color,
                price: v.retail_price, currency: v.currency,
              })),
            };
          })
        );

        return json({ products: products.filter(Boolean) }, 200, cors);
      }

      // ── POST /checkout ──
      if (path === '/checkout' && request.method === 'POST') {
        const body = await request.json();

        // Support both legacy single-item and new multi-item format
        const items = body.items || [{ product_id: body.product_id, variant_id: body.variant_id, quantity: 1 }];

        if (!items.length || !items[0].product_id) return json({ error: 'product_id required' }, 400, cors);

        const params = new URLSearchParams({
          'mode': 'payment',
          'success_url': 'https://prxy.studio/shop/?status=success',
          'cancel_url': 'https://prxy.studio/shop/?status=cancel',
          'shipping_address_collection[allowed_countries][0]': 'ES',
          'shipping_address_collection[allowed_countries][1]': 'US',
          'shipping_address_collection[allowed_countries][2]': 'GB',
          'shipping_address_collection[allowed_countries][3]': 'FR',
          'shipping_address_collection[allowed_countries][4]': 'DE',
          'shipping_address_collection[allowed_countries][5]': 'IT',
          'shipping_address_collection[allowed_countries][6]': 'PT',
          'shipping_address_collection[allowed_countries][7]': 'NL',
          'shipping_address_collection[allowed_countries][8]': 'MX',
        });

        const metaItems = [];

        for (let i = 0; i < items.length; i++) {
          const { product_id, variant_id, quantity } = items[i];
          const qty = Math.max(1, Math.min(parseInt(quantity) || 1, 10));

          const det = await pfetch(env, `/store/products/${product_id}`);
          if (det.code !== 200) return json({ error: `Product ${product_id} not found` }, 404, cors);

          const sync = det.result.sync_product;
          const variants = det.result.sync_variants || [];
          const variant = variant_id
            ? variants.find(v => v.id == variant_id) || variants[0]
            : variants[0];

          if (!variant) return json({ error: `No variant for ${product_id}` }, 400, cors);

          // Use our own product photos instead of Printful stock images
          const CUSTOM_IMAGES = {
            '425885327': 'https://prxy.studio/shop/hat-1-front.png',
            '425894120': 'https://prxy.studio/shop/ls-black-front.png',
            '425894165': 'https://prxy.studio/shop/ls-white-front.png',
          };
          const image = CUSTOM_IMAGES[product_id] || sync.thumbnail_url;

          const cents = Math.round(parseFloat(variant.retail_price) * 100);
          const currency = (variant.currency || 'EUR').toLowerCase();

          params.set(`line_items[${i}][price_data][currency]`, currency);
          params.set(`line_items[${i}][price_data][product_data][name]`, sync.name);
          params.set(`line_items[${i}][price_data][product_data][images][0]`, image);
          params.set(`line_items[${i}][price_data][unit_amount]`, cents.toString());
          params.set(`line_items[${i}][quantity]`, qty.toString());

          metaItems.push({ variant_id: variant.id, product_id, quantity: qty });
        }

        params.set('metadata[printful_items]', JSON.stringify(metaItems));

        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        });

        const session = await stripeRes.json();
        if (session.error) return json({ error: session.error.message }, 400, cors);
        return json({ url: session.url }, 200, cors);
      }

      // ── POST /webhook (Stripe) ──
      if (path === '/webhook' && request.method === 'POST') {
        const payload = await request.text();
        const sig = request.headers.get('stripe-signature');

        if (env.STRIPE_WEBHOOK_SECRET) {
          const ok = await verifyStripe(payload, sig, env.STRIPE_WEBHOOK_SECRET);
          if (!ok) return new Response('Invalid signature', { status: 400 });
        }

        const event = JSON.parse(payload);

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          if (session.payment_status !== 'paid') return new Response('OK');

          const shipping = session.shipping_details || session.customer_details;

          // Support new multi-item format and legacy single-item
          let orderItems = [];
          if (session.metadata.printful_items) {
            const parsed = JSON.parse(session.metadata.printful_items);
            orderItems = parsed.map(it => ({ sync_variant_id: parseInt(it.variant_id, 10), quantity: it.quantity || 1 }));
          } else if (session.metadata.printful_variant_id) {
            orderItems = [{ sync_variant_id: parseInt(session.metadata.printful_variant_id, 10), quantity: 1 }];
          }

          if (orderItems.length && shipping) {
            await fetch('https://api.printful.com/orders', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${env.PRINTFUL_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                recipient: {
                  name: shipping.name,
                  address1: shipping.address.line1,
                  address2: shipping.address.line2 || '',
                  city: shipping.address.city,
                  state_code: shipping.address.state || '',
                  country_code: shipping.address.country,
                  zip: shipping.address.postal_code,
                  email: session.customer_details.email,
                },
                items: orderItems,
              }),
            });
          }
        }

        return new Response('OK');
      }

      return json({ error: 'Not found' }, 404, cors);
    } catch (e) {
      console.error('Worker error:', e);
      return json({ error: 'Server error' }, 500, cors);
    }
  },
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', ...headers },
  });
}

async function pfetch(env, path) {
  const res = await fetch(`https://api.printful.com${path}`, {
    headers: { 'Authorization': `Bearer ${env.PRINTFUL_TOKEN}` },
  });
  return res.json();
}

async function verifyStripe(payload, sigHeader, secret) {
  if (!sigHeader || !secret) return false;
  try {
    const parts = {};
    sigHeader.split(',').forEach(item => {
      const [k, v] = item.split('=');
      parts[k.trim()] = v;
    });
    const ts = parts['t'], sig = parts['v1'];
    if (!ts || !sig) return false;
    if (Math.floor(Date.now() / 1000) - parseInt(ts) > 300) return false;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}.${payload}`));
    const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (expected.length !== sig.length) return false;
    let m = 0;
    for (let i = 0; i < expected.length; i++) m |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    return m === 0;
  } catch (e) { return false; }
}
