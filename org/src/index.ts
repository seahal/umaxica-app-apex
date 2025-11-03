import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello 2 Hono! org");
});

export default app;
