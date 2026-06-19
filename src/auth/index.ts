import type { AuthConfig } from "../types";
import { BearerTokenClient } from "./bearer";
import { LegacyIdKeyClient } from "./legacy";
import {
	OAuth2AuthorizationCodeClient,
	type OAuth2Credentials,
} from "./oauth2-authorization-code";
import { OAuth2ClientCredentialsClient } from "./oauth2-client-credentials";

import type { AuthProvider } from "./provider";

export type { AuthProvider, OAuth2Credentials };
export {
	OAuth2AuthorizationCodeClient,
	OAuth2ClientCredentialsClient,
	BearerTokenClient,
	LegacyIdKeyClient,
};

export function createAuthProvider(auth: AuthConfig): AuthProvider {
	switch (auth.type) {
		case "oauth2_authorization_code":
			return new OAuth2AuthorizationCodeClient(auth);
		case "oauth2_client_credentials":
			return new OAuth2ClientCredentialsClient(auth);
		case "bearer":
			return new BearerTokenClient(auth);
		case "legacy":
			return new LegacyIdKeyClient(auth);
	}
}
