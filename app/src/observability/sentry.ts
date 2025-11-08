import type { Scope } from "@sentry/types";
import type { Context, MiddlewareHandler } from "hono";
import * as Sentry from "@sentry/cloudflare";

const DEFAULT_ENVIRONMENT = "production";
const DEFAULT_FLUSH_TIMEOUT_MS = 2000;

export type SentryEnv = {
	SENTRY_DSN?: string;
	SENTRY_ENVIRONMENT?: string;
	SENTRY_RELEASE?: string;
	SENTRY_TRACES_SAMPLE_RATE?: string;
	SENTRY_FLUSH_TIMEOUT_MS?: string;
	ENVIRONMENT?: string;
	NODE_ENV?: string;
};

const parseSampleRate = (value?: string) => {
	if (!value) {
		return undefined;
	}

	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
		return undefined;
	}

	return parsed;
};

const parseFlushTimeout = (value?: string) => {
	if (!value) {
		return DEFAULT_FLUSH_TIMEOUT_MS;
	}

	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return DEFAULT_FLUSH_TIMEOUT_MS;
	}

	return parsed;
};

const ensureSentryInitialized = (env: SentryEnv) => {
	if (!env.SENTRY_DSN) {
		return false;
	}

	const existingClient = Sentry.getCurrentHub().getClient();
	if (existingClient) {
		return true;
	}

	Sentry.init({
		dsn: env.SENTRY_DSN,
		release: env.SENTRY_RELEASE,
		environment:
			env.SENTRY_ENVIRONMENT ??
			env.ENVIRONMENT ??
			env.NODE_ENV ??
			DEFAULT_ENVIRONMENT,
		tracesSampleRate: parseSampleRate(env.SENTRY_TRACES_SAMPLE_RATE),
	});

	return true;
};

const applyRequestMetadata = <B extends SentryEnv>(
	scope: Scope,
	context: Context<{ Bindings: B }>,
) => {
	const url = new URL(context.req.url);
	scope.setTag("route.method", context.req.method);
	scope.setTag("route.path", url.pathname);

	const rayHeader = context.req.header("cf-ray");
	if (rayHeader) {
		scope.setTag("cf.ray", rayHeader);
	}

	const requestId = context.req.header("x-request-id");
	if (requestId) {
		scope.setTag("request.id", requestId);
	}

	scope.setContext("request", {
		method: context.req.method,
		url: url.toString(),
		headers: {
			"user-agent": context.req.header("user-agent"),
			"accept-language": context.req.header("accept-language"),
		},
	});
};

export const createSentryMiddleware = <B extends SentryEnv>(): MiddlewareHandler<{
	Bindings: B;
}> => {
	return async (c, next) => {
		const isEnabled = ensureSentryInitialized(c.env);
		if (!isEnabled) {
			await next();
			return;
		}

		let hasCapturedEvent = false;

		await Sentry.withScope(async (scope: Scope) => {
			applyRequestMetadata(scope, c);

			try {
				await next();

				if (c.res.status >= 500) {
					hasCapturedEvent = true;
					scope.setTag("response.status_code", String(c.res.status));
					Sentry.captureMessage(
						`HTTP ${c.res.status} returned from ${c.req.method} ${c.req.path}`,
						"error",
					);
				}
			} catch (error) {
				hasCapturedEvent = true;
				scope.setTag("response.status_code", "exception");
				Sentry.captureException(error, (exceptionScope: Scope) => {
					applyRequestMetadata(exceptionScope, c);
					return exceptionScope;
				});
				throw error;
			}
		});

		if (!hasCapturedEvent) {
			return;
		}

		const flushTimeout = parseFlushTimeout(c.env.SENTRY_FLUSH_TIMEOUT_MS);
		const flushPromise = Sentry.flush(flushTimeout);

		if (c.executionCtx && typeof c.executionCtx.waitUntil === "function") {
			c.executionCtx.waitUntil(flushPromise);
			return;
		}

		await flushPromise;
	};
};
