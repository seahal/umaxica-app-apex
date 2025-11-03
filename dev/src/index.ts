import { Hono } from "hono";

type AssetEnv = {
	ASSETS?: {
		fetch: (request: Request) => Promise<Response>;
	};
};

const app = new Hono<{ Bindings: AssetEnv }>();

const welcomeStrings = [
	"Hello Hono!",
	"2 Vercel, visit https://vercel.com/docs/frameworks/backend/hono",
];

type AssetEnv = {
	ASSETS?: {
		fetch: (request: Request) => Promise<Response>;
	};
};

const staticPaths = new Set(["/robots.txt", "/sitemap.xml", "/favicon.ico"]);

app.use("*", async (c, next) => {
	const assets = c.env.ASSETS;
	if (!assets) {
		return next();
	}

	const url = new URL(c.req.url);
	const isStaticRoute =
		url.pathname.startsWith("/assets/") || staticPaths.has(url.pathname);

	if (!isStaticRoute) {
		return next();
	}

	const response = await assets.fetch(c.req.raw);
	if (response.status === 404) {
		return next();
	}

	return response;
});

app.get("/", (c) => {
	return c.text(welcomeStrings.join("\n\n"));
});

export default app;
