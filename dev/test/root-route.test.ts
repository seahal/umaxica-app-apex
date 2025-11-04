import { describe, expect, it } from "bun:test";
import { requestFromDevApp } from "./utils/request";

const SITE_URL = "umaxica.dev";
const DEFAULT_REGION = "jp";
const DEFAULT_REGION_URL = `https://${DEFAULT_REGION}.${SITE_URL}/`;

describe("GET /", () => {
	it("redirects to the default region when `ri` is missing", async () => {
		const response = await requestFromDevApp("/");

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe(DEFAULT_REGION_URL);
	});

	it("redirects to the default region when `ri` is not allowed", async () => {
		const response = await requestFromDevApp("/?ri=eu");

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe(DEFAULT_REGION_URL);
	});

	it("redirects to the requested region when `ri` is allowed", async () => {
		const response = await requestFromDevApp("/?ri=us");

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe(`https://us.${SITE_URL}/`);
	});

	it("normalizes the region parameter to lowercase before checking allowlist", async () => {
		const response = await requestFromDevApp("/?ri=US");

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe(`https://us.${SITE_URL}/`);
	});

	it("applies security headers to redirect responses", async () => {
		const response = await requestFromDevApp("/");

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

	describe("Open Redirect Protection", () => {
		it("rejects region parameter with special characters", async () => {
			const response = await requestFromDevApp("/?ri=jp.evil.com");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(DEFAULT_REGION_URL);
		});

		it("rejects region parameter with URL encoding attempts", async () => {
			const response = await requestFromDevApp("/?ri=jp%2eevil%2ecom");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(DEFAULT_REGION_URL);
		});

		it("rejects region parameter with slashes", async () => {
			const response = await requestFromDevApp("/?ri=jp/evil");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(DEFAULT_REGION_URL);
		});

		it("rejects region parameter with backslashes", async () => {
			const response = await requestFromDevApp("/?ri=jp\\evil");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(DEFAULT_REGION_URL);
		});

		it("rejects region parameter with @ symbol", async () => {
			const response = await requestFromDevApp("/?ri=jp@evil.com");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(DEFAULT_REGION_URL);
		});

		it("only redirects to whitelisted URLs for jp region", async () => {
			const response = await requestFromDevApp("/?ri=jp");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(`https://jp.${SITE_URL}/`);
		});

		it("only redirects to whitelisted URLs for us region", async () => {
			const response = await requestFromDevApp("/?ri=us");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(`https://us.${SITE_URL}/`);
		});

		it("rejects empty string as region", async () => {
			const response = await requestFromDevApp("/?ri=");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(DEFAULT_REGION_URL);
		});

		it("rejects numeric region codes", async () => {
			const response = await requestFromDevApp("/?ri=123");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(DEFAULT_REGION_URL);
		});

		it("rejects region parameter with spaces", async () => {
			const response = await requestFromDevApp("/?ri=jp us");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(DEFAULT_REGION_URL);
		});
	});

	describe("Edge Cases", () => {
		it("handles multiple query parameters correctly", async () => {
			const response = await requestFromDevApp("/?ri=us&foo=bar");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(`https://us.${SITE_URL}/`);
		});

		it("handles case-insensitive region for jp", async () => {
			const response = await requestFromDevApp("/?ri=JP");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(`https://jp.${SITE_URL}/`);
		});

		it("handles mixed case region codes", async () => {
			const response = await requestFromDevApp("/?ri=Us");

			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe(`https://us.${SITE_URL}/`);
		});
	});
});
