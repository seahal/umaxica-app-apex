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

app.get("/", (c) => {
	return c.text(welcomeStrings.join("\n\n"));
});

export default app;
