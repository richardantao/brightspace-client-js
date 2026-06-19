/**
 * Legacy ID-Key auth provider.
 *
 * @deprecated D2L deprecated the ID-Key auth system in January 2023.
 * Migrate to OAuth2 where possible. This provider is included for
 * integrations that cannot yet migrate.
 *
 * @see https://docs.valence.desire2learn.com/basic/legacyauth.html
 *
 * Protocol:
 *   Timestamps: Unix seconds (not milliseconds)
 *   Base string: {UPPERCASE_METHOD}&{lowercase-path}&{userId}&{timestamp}
 *   Signatures: HMAC-SHA256, base64url encoded (RFC 4648 — no padding,
 *     '+' → '-', '/' → '_')
 *
 * @example
 * ```ts
 * const client = new BrightspaceClient({
 *   host: process.env.D2L_HOST!,
 *   auth: new LegacyIdKeyClient({
 *     type: "legacy",
 *     appId: process.env.D2L_APP_ID!,
 *     appKey: process.env.D2L_APP_KEY!,
 *     userId: process.env.D2L_USER_ID!,
 *     userKey: process.env.D2L_USER_KEY!,
 *   }),
 * });
 * ```
 */

import { createHmac } from "node:crypto";

import type { LegacyAuthConfig } from "../types";
import type { AuthHeaderContext, AuthProvider } from "./provider";

export class LegacyIdKeyClient implements AuthProvider {
	constructor(private readonly config: LegacyAuthConfig) {}

	async getHeaders(
		context: AuthHeaderContext
	): Promise<Record<string, string>> {
		// Seconds since epoch — D2L requires Unix timestamp, not milliseconds
		const timestamp = Math.floor(Date.now() / 1000).toString();

		// Extract path from full URL and lowercase per D2L spec
		const path = extractPath(context.url).toLowerCase();

		// Method must be uppercase per D2L spec
		const method = context.method.toUpperCase();

		// Base string: METHOD&lowercase-path&userId&timestamp
		const signatureBase = `${method}&${path}&${this.config.userId}&${timestamp}`;

		const appSig = hmacBase64Url(this.config.appKey, signatureBase);
		const userSig = hmacBase64Url(this.config.userKey, signatureBase);

		return {
			"X-D2L-App-Id": this.config.appId,
			"X-D2L-User-Id": this.config.userId,
			"X-D2L-Timestamp": timestamp,
			"X-D2L-App-Signature": appSig,
			"X-D2L-User-Signature": userSig,
		};
	}
}

/**
 * HMAC-SHA256 signature encoded as base64url per RFC 4648.
 * No padding, '+' → '-', '/' → '_'.
 */
function hmacBase64Url(key: string, data: string): string {
	return createHmac("sha256", key)
		.update(data)
		.digest("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

/**
 * Extracts the path (and query string) from a full URL.
 * e.g. "https://lms.example.com/d2l/api/lp/1.49/users/whoami"
 *   → "/d2l/api/lp/1.49/users/whoami"
 */
function extractPath(url: string): string {
	try {
		const parsed = new URL(url);
		return parsed.pathname + parsed.search;
	} catch {
		return url.startsWith("/") ? url : `/${url}`;
	}
}