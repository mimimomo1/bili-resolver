export default async function handler(req, res) {
    try {
        const targetUrl = req.query.url;

        if (!targetUrl) {
            return res.status(400).send('Missing URL parameter');
        }

        const expectedToken = process.env.PROXY_TOKEN;
        const providedToken = req.headers['x-proxy-token'];

        if (expectedToken && providedToken !== expectedToken) {
            return res.status(401).send('Unauthorized');
        }

        const target = new URL(targetUrl);

        if (
            !target.hostname.includes('bilibili.com') &&
            !target.hostname.includes('biliapi.net') &&
            !target.hostname.includes('b23.tv')
        ) {
            return res.status(403).send('Forbidden');
        }

        const headers = {};

        if (req.headers['user-agent'])
            headers['User-Agent'] = req.headers['user-agent'];

        if (req.headers['referer'])
            headers['Referer'] = req.headers['referer'];

        if (req.headers['cookie'])
            headers['Cookie'] = req.headers['cookie'];

        if (req.headers['origin'])
            headers['Origin'] = req.headers['origin'];

        const options = {
            method: req.method,
            headers,
            redirect: 'manual'
        };

        const upstream = await fetch(targetUrl, options);

        res.status(upstream.status);

        upstream.headers.forEach((value, key) => {
            try {
                res.setHeader(key, value);
            } catch {}
        });

        res.setHeader('Access-Control-Allow-Origin', '*');

        const body = Buffer.from(await upstream.arrayBuffer());
        return res.send(body);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message
        });
    }
}
