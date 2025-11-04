import { describe, expect, it } from "bun:test";
import { requestFromNetApp } from "./utils/request";

describe("GET /about", () => {
	it("returns the NET about HTML document with key metadata", async () => {
		const response = await requestFromNetApp("/about");

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");

		const body = await response.text();
		expect(body).toContain("<title>About - NET</title>");
		expect(body).toContain("<strong>Service Name:</strong> NET");
		expect(body).toContain("Umaxica App Status Page - NET Service");
		expect(body).toContain("<strong>Runtime:</strong> Cloudflare Workers");
	});

	it("applies security headers to the about response", async () => {
		const response = await requestFromNetApp("/about");

		expect(response.headers.get("strict-transport-security")).toContain(
			"max-age=31536000",
		);
		expect(response.headers.get("content-security-policy")).toContain(
			"default-src 'self'",
		);
		expect(response.headers.get("permissions-policy")).toContain(
			"accelerometer=()",
		);
		expect(response.headers.get("x-frame-options")).toBe("DENY");
		expect(response.headers.get("referrer-policy")).toBe("no-referrer");
	});
});
