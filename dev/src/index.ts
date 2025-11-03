import { Hono } from "hono";

const app = new Hono();

const welcomeStrings = [
	"Hello Hono!",
	"2 Vercel, visit https://vercel.com/docs/frameworks/backend/hono",
];

app.get("/", (c) => {
	return c.text(welcomeStrings.join("\n\n"));
});

export default app;
