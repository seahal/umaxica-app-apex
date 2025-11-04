import { Hono } from "hono";

const SITE_URL = "umaxica.org";

const allowedUrls = {
	"jp": `https://jp.${SITE_URL}/`,
	"us": `https://us.${SITE_URL}/`,
} as const;

type AllowedRegion = keyof typeof allowedUrls;

const DEFAULT_REGION: AllowedRegion = "jp";

type AssetEnv = {
	ASSETS?: {
		fetch: (request: Request) => Promise<Response>;
	};
};

const app = new Hono<{ Bindings: AssetEnv }>();

// Security headers middleware
app.use("*", async (c, next) => {
	await next();
	c.header(
		"Strict-Transport-Security",
		"max-age=31536000; includeSubDomains; preload",
	);
	c.header(
		"Content-Security-Policy",
		"default-src 'self'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests",
	);
	c.header(
		"Permissions-Policy",
		"accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
	);
	c.header("X-Content-Type-Options", "nosniff");
	c.header("X-Frame-Options", "DENY");
	c.header("Referrer-Policy", "no-referrer");
	c.header("X-XSS-Protection", "1; mode=block");
});

app.get("/", (c) => {
	const region: string = c.req.query("ri")?.toLowerCase() ?? "";

	const redirectUrl = allowedUrls[region as AllowedRegion];
	if (redirectUrl) {
		return c.redirect(redirectUrl, 302);
	}

	const defaultRedirectUrl = allowedUrls[DEFAULT_REGION];
	if (defaultRedirectUrl) {
		return c.redirect(defaultRedirectUrl, 302);
	}

	return c.json(
		{
			error: "region_not_supported",
			message: "Unable to determine a safe redirect target",
		},
		500,
	);
});

app.get("/health", (c) => {
	return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Health Check - ORG</title>
</head>
<body>
	<h1>Health Check</h1>
	<p>✓ OK</p>
	<p><strong>Service:</strong> ORG</p>
	<p><strong>Status:</strong> Running</p>
	<p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
</body>
</html>`);
});

app.get("/about", (c) => {
	return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>About - ORG</title>
</head>
<body>
	<h1>About ORG Service</h1>
	<h2>Service Information</h2>
	<p><strong>Service Name:</strong> ORG</p>
	<p><strong>Description:</strong> Umaxica App Status Page - ORG Service</p>
	<p><strong>Framework:</strong> Hono</p>
	<p><strong>Runtime:</strong> Cloudflare Workers</p>
	<h2>Contact</h2>
	<p>For more information, please visit our main page.</p>
</body>
</html>`);
});

app.get("/v1/health", (c) => {
	return c.json({ status: "ok" });
});

export default app;
