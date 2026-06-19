/**
 * Bearer token auth provider.
 *
 * Use when you already have a valid access token — the simplest auth option.
 * No token refresh or lifecycle management. The caller is responsible for
 * providing a valid, non-expired token.
 *
 * Safe to construct at module level if the token is long-lived (e.g. a
 * service account token managed externally). Construct per-request if the
 * token is user-scoped and sourced from a session.
 *
 * @example
 * ```ts
 * const client = new BrightspaceClient({
 *   host: process.env.D2L_HOST!,
 *   auth: new BearerTokenClient({ type: "bearer", token: process.env.D2L_TOKEN! }),
 * });
 * ```
 */

import type { BearerAuthConfig } from "../types";
import type { AuthHeaderContext, AuthProvider } from "./provider";

export class BearerTokenClient implements AuthProvider {
	constructor(private readonly config: BearerAuthConfig) {}

	async getHeaders(
		_context: AuthHeaderContext
	): Promise<Record<string, string>> {
		return { Authorization: `Bearer ${this.config.token}` };
	}
}