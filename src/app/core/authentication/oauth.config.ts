/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';

export enum AuthMode {
  OAuth2 = 'oauth2',
  OIDC = 'oidc',
  Basic = 'basic'
}

/**
 * Determines which authentication mode should be enabled based on runtime configuration.
 * @returns {AuthMode} The active authentication mode.
 */
export function getActiveAuthMode(): AuthMode {
  if (environment.OIDC.oidcServerEnabled) {
    return AuthMode.OIDC;
  } else if (environment.oauth.enabled) {
    return AuthMode.OAuth2;
  }
  return AuthMode.Basic;
}

/**
 * Builds the Angular OAuth service configuration for the active authentication mode.
 * @returns {AuthConfig} OAuth/OIDC configuration consumed by angular-oauth2-oidc.
 */
export function getOAuthConfig(): AuthConfig {
  const authMode = getActiveAuthMode();

  switch (authMode) {
    case AuthMode.OIDC:
      return getOIDCConfig();
    case AuthMode.OAuth2:
      return getOAuth2Config();
    default:
      return { clientId: '' };
  }
}

/**
 * Creates the configuration required for OIDC-compliant providers.
 * @returns {AuthConfig} OIDC configuration block.
 */
function getOIDCConfig(): AuthConfig {
  const frontUrl = environment.OIDC.oidcFrontUrl || window.location.origin;

  return {
    issuer: environment.OIDC.oidcBaseUrl,
    clientId: environment.OIDC.oidcClientId,
    redirectUri: `${frontUrl}/callback`,
    postLogoutRedirectUri: `${frontUrl}/#/login`,
    responseType: 'code',
    scope: 'openid profile email offline_access',
    oidc: true,
    useSilentRefresh: false,
    requireHttps: environment.production,
    showDebugInformation: !environment.production,
    sessionChecksEnabled: false,
    clearHashAfterLogin: false
  };
}

/**
 * Creates the configuration required for classic OAuth2 providers (e.g., Keycloak, Fineract).
 * @returns {AuthConfig} OAuth2 configuration block.
 */
function getOAuth2Config(): AuthConfig {
  const frontendUrl = window.location.origin;
  const serverUrl = environment.oauth.serverUrl;

  // Support Keycloak realm configuration (defaults to 'fineract' realm)
  const realm = environment.oauth.realm || 'fineract';

  // Auto-construct Keycloak endpoints if not explicitly provided
  // Keycloak URL pattern: https://auth.example.com/realms/{realm}/protocol/openid-connect/{endpoint}
  const authorizeUrl =
    environment.oauth.authorizeUrl || (serverUrl ? `${serverUrl}/realms/${realm}/protocol/openid-connect/auth` : '');
  const tokenUrl =
    environment.oauth.tokenUrl || (serverUrl ? `${serverUrl}/realms/${realm}/protocol/openid-connect/token` : '');
  const logoutUrl =
    environment.oauth.logoutUrl || (serverUrl ? `${serverUrl}/realms/${realm}/protocol/openid-connect/logout` : '');

  // Sensible defaults for redirect URI and scope
  const redirectUri = environment.oauth.redirectUri || `${frontendUrl}/#/callback`;
  const scope = environment.oauth.scope || 'openid profile email';

  return {
    issuer: `${serverUrl}/realms/${realm}`,
    loginUrl: authorizeUrl,
    tokenEndpoint: tokenUrl,
    redirectUri: redirectUri,
    postLogoutRedirectUri: `${frontendUrl}/#/login`,
    clientId: environment.oauth.appId,
    responseType: 'code',
    scope: scope,
    useSilentRefresh: false,
    oidc: false,
    // Skip issuer validation for OAuth2 (non-OIDC) flows
    skipIssuerCheck: true,
    // Disable strict discovery validation for custom OAuth2 endpoints
    strictDiscoveryDocumentValidation: false,
    requireHttps: environment.production,
    showDebugInformation: !environment.production,
    sessionChecksEnabled: false,
    clearHashAfterLogin: false
  };
}
