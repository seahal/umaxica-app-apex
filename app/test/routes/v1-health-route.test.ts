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
});
