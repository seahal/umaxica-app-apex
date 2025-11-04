import { describe, expect, it } from "bun:test";
import { requestFromApp } from "../utils/request";

describe("GET /health", () => {
	it("returns OK HTML status page with expected content", async () => {
		const response = await requestFromApp("/health");

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");

		const body = await response.text();

		expect(body).toContain("<title>Health Check - APP</title>");
		expect(body).toContain("<p>✓ OK</p>");
		expect(body).toContain("<strong>Status:</strong> Running");
	});

	it("applies security headers to HTML responses", async () => {
		const response = await requestFromApp("/health");

		expect(response.headers.get("strict-transport-security")).toContain(
			"max-age=31536000",
		);
		expect(response.headers.get("x-content-type-options")).toBe("nosniff");
		expect(response.headers.get("x-xss-protection")).toBe("1; mode=block");
	});
});
