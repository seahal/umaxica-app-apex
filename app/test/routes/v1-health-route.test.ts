import { describe, expect, it } from "bun:test";
import { requestFromApp } from "../utils/request";

describe("GET /v1/health", () => {
	it("returns JSON ok status", async () => {
		const response = await requestFromApp("/v1/health");

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");

		const payload = await response.json<{ status: string }>();

		expect(payload).toEqual({ status: "ok" });
	});

	it("attaches security headers to the JSON response", async () => {
		const response = await requestFromApp("/v1/health");

		expect(response.headers.get("strict-transport-security")).toContain(
			"max-age=31536000",
		);
		expect(response.headers.get("referrer-policy")).toBe("no-referrer");
	});

	it("includes all security headers for API endpoint", async () => {
		const response = await requestFromApp("/v1/health");

		expect(response.headers.get("x-content-type-options")).toBe("nosniff");
		expect(response.headers.get("x-frame-options")).toBe("DENY");
		expect(response.headers.get("x-xss-protection")).toBe("1; mode=block");
		expect(response.headers.get("content-security-policy")).toContain(
			"default-src 'self'",
		);
	});

	it("returns a valid JSON object with correct structure", async () => {
		const response = await requestFromApp("/v1/health");
		const payload = await response.json();

		expect(typeof payload).toBe("object");
		expect(payload).toHaveProperty("status");
		expect(typeof payload.status).toBe("string");
	});

	it("does not include extra fields in response", async () => {
		const response = await requestFromApp("/v1/health");
		const payload = await response.json();

		const keys = Object.keys(payload);
		expect(keys).toEqual(["status"]);
	});
});
