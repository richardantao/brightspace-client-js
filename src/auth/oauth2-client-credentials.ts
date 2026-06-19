/**
 * OAuth2 Client Credentials Grant auth provider.
 *
 * For server-to-server integrations. Safe to construct once at module level
 * and share across requests — all credentials are static configuration and
 * token state is not user-specific.
 *
 * D2L's client credentials flow authenticates via JWT client assertions
 * (RFC 7521 / RFC 7523) signed with a private key — not a shared client
 * secret. Your JWKS URL must be publicly reachable over HTTPS so D2L can
 * verify your assertion signatures.
 *
 * @see https://docs.valence.desire2learn.com/basic/oauth2.html
 *
 * @example
 * ```ts
 * // Module level — safe to share across requests
 * export const serviceClient = new BrightspaceClient({
 *   host: process.env.D2L_HOST!,
 *   auth: new OAuth2ClientCredentialsClient({
 *     type: "oauth2_client_credentials",
 *     clientId: process.env.D2L_CLIENT_ID!,
 *     privateKey: process.env.D2L_PRIVATE_KEY_PEM!,
 *     keyId: process.env.D2L_KEY_ID!,
 *     algorithm: "RS256",
 *     scope: "core:*:*",
 *   }),
 * });
 * ```
 */

import { createSign, randomUUID } from "node:crypto";

import { AuthError } from "../core/errors";
import type { OAuth2ClientCredentialsConfig } from "../types";
import type { AuthHeaderContext, AuthProvider } from "./provider";

const BRIGHTSPACE_TOKEN_URL = "https://auth.brightspace.com/core/connect/token";

/**
 * D2L best practice: client assertions should be short-lived.
 * Recommended < 60s; maximum 5 minutes (300s).
 * @see https://docs.valence.desire2learn.com/basic/oauth2.html#security-operational-best-practices
 */
const DEFAULT_ASSERTION_LIFETIME_SECONDS = 60;

interface OAuthTokenResponse {
	access_token: string;
	expires_in?: number;
	token_type?: string;
}

export class OAuth2ClientCredentialsClient implements AuthProvider {
	private accessToken: string | null = null;
	private expiresAt = 0;
	private inflight: Promise<string> | null = null;

	constructor(private readonly config: OAuth2ClientCredentialsConfig) {}

	async getHeaders(
		_context: AuthHeaderContext
	): Promise<Record<string, string>> {
		const token = await this.resolveToken();
		return { Authorization: `Bearer ${token}` };
	}

	// ---------------------------------------------------------------------------
	// Internal token lifecycle
	// ---------------------------------------------------------------------------

	private async resolveToken(): Promise<string> {
		const now = Date.now();
		if (this.accessToken && now < this.expiresAt - 30_000) {
			return this.accessToken;
		}
		if (!this.inflight) {
			this.inflight = this.fetchToken().finally(() => {
				this.inflight = null;
			});
		}
		return this.inflight;
	}

	private async fetchToken(): Promise<string> {
		const tokenUrl = this.config.tokenUrl ?? BRIGHTSPACE_TOKEN_URL;

		const params = new URLSearchParams({
			grant_type: "client_credentials",
			client_id: this.config.clientId,
			client_assertion_type:
				"urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
			client_assertion: this.createClientAssertion(tokenUrl),
		});

		if (this.config.scope) params.set("scope", this.config.scope);

		const response = await fetch(tokenUrl, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: params,
		});

		const data = (await response
			.json()
			.catch(() => ({}))) as Partial<OAuthTokenResponse>;

		if (!response.ok || !data.access_token) {
			throw new AuthError(
				"Failed to fetch OAuth2 client credentials access token",
				{ status: 401, rawBody: safeStringify(data) }
			);
		}

		this.accessToken = data.access_token;
		const expiresIn = data.expires_in ?? 3600;
		this.expiresAt = Date.now() + expiresIn * 1000;

		return this.accessToken;
	}

	/**
	 * Builds a JWT client assertion per RFC 7521 / RFC 7523.
	 *
	 * Required header fields: alg, kid (matches key in your JWKS), typ
	 * Required payload fields: iss = sub = clientId, aud = token URL,
	 *   iat, exp (< 60s recommended), jti (unique per request)
	 *
	 * Supports RS256/384/512 (RSA) and ES256/384/512 (EC).
	 */
	private createClientAssertion(tokenUrl: string): string {
		const alg = this.config.algorithm ?? "RS256";
		const now = Math.floor(Date.now() / 1000);

		const header = { alg, typ: "JWT", kid: this.config.keyId };
		const payload = {
			iss: this.config.clientId,
			sub: this.config.clientId,
			aud: tokenUrl,
			jti: randomUUID(),
			iat: now,
			exp:
				now +
				(this.config.assertionLifetime ?? DEFAULT_ASSERTION_LIFETIME_SECONDS),
		};

		const encodedHeader = base64url(JSON.stringify(header));
		const encodedPayload = base64url(JSON.stringify(payload));
		const signingInput = `${encodedHeader}.${encodedPayload}`;

		const { cryptoAlg, dsaEncoding } = resolveSigningParams(alg);
		const signer = createSign(cryptoAlg);
		signer.update(signingInput, "utf8");
		signer.end();

		const rawSig = signer.sign({ key: this.config.privateKey, dsaEncoding });
		return `${signingInput}.${base64url(rawSig)}`;
	}
}

// ---------------------------------------------------------------------------
// Crypto helpers
// ---------------------------------------------------------------------------

/**
 * Maps D2L-supported JWT algorithm identifiers to Node.js crypto parameters.
 *
 * RS* — RSA-PKCS#1 v1.5. Output is already JWT-compatible.
 * ES* — ECDSA. Node produces DER-encoded signatures by default; JWT requires
 *       IEEE P1363 (raw r||s), so dsaEncoding 'ieee-p1363' is set.
 */
function resolveSigningParams(
	alg: NonNullable<OAuth2ClientCredentialsConfig["algorithm"]>
): { cryptoAlg: string; dsaEncoding: "der" | "ieee-p1363" } {
	switch (alg) {
		case "RS256":
			return { cryptoAlg: "RSA-SHA256", dsaEncoding: "der" };
		case "RS384":
			return { cryptoAlg: "RSA-SHA384", dsaEncoding: "der" };
		case "RS512":
			return { cryptoAlg: "RSA-SHA512", dsaEncoding: "der" };
		case "ES256":
			return { cryptoAlg: "SHA256", dsaEncoding: "ieee-p1363" };
		case "ES384":
			return { cryptoAlg: "SHA384", dsaEncoding: "ieee-p1363" };
		case "ES512":
			return { cryptoAlg: "SHA512", dsaEncoding: "ieee-p1363" };
	}
}

function base64url(input: string | Buffer): string {
	const raw =
		typeof input === "string"
			? Buffer.from(input, "utf8").toString("base64")
			: input.toString("base64");
	return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function safeStringify(value: unknown): string {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}