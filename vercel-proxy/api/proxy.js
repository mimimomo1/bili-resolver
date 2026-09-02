export default async function handler(req) {
    // Vercel gives us a Node-style request, so req.url may only be "/api/proxy?..."
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url, https://${host});

    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
        return new Response('Missing URL parameter', { status: 400 });
    }

    // Use the Vercel environment variable you already created
    const expectedToken = process.env.PROXY_TOKEN;

    if (expectedToken) {
        const providedToken = req.headers['x-proxy-token'];

        if (providedToken !== expectedToken) {
            return new Response('Unauthorized: Invalid proxy token', {
                status: 401
            });
        }
    }

    try {
        const target = new URL(targetUrl);

        // Only allow Bilibili-related requests
        if (
            !target.hostname.includes('bilibili.com') &&
            !
          target.hostname.includes('biliapi.net') &&
            !target.hostname.includes('b23.tv')
        ) {
            return new Response('Forbidden', { status: 403 });
        }

        const headers = new Headers();

        // Node/Vercel request headers are plain object properties
        if (req.headers['user-agent'])
            headers.set('User-Agent', req.headers['user-agent']);

        if (req.headers['referer'])
            headers.set('Referer', req.headers['referer']);

        if (req.headers['cookie'])
            headers.set('Cookie', req.headers['cookie']);

        if (req.headers['origin'])
            headers.set('Origin', req.headers['origin']);

        const init = {
            method: req.method,
            headers,
            redirect: 'manual'
        };

        // Read POST body safely if there is one
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks = [];

            for await (const chunk of req) {
                chunks.push(Buffer.from(chunk));
            }

            if (chunks.length > 0) {
                init.body = Buffer.concat(chunks);
            }
        }

        const response = await fetch(targetUrl, init);

        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '');

        return new Response(response.body, {
            status: response.status,
            headers: responseHeaders
        });

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': ''
                }
            }
        );
    }
}
