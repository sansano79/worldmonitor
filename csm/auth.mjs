import { createRemoteJWKSet, errors, jwtVerify } from 'jose';

const INVALID_TOKEN_CODES = new Set([
  'ERR_JWT_EXPIRED', 'ERR_JWT_CLAIM_VALIDATION_FAILED', 'ERR_JWT_INVALID',
  'ERR_JWS_INVALID', 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
  'ERR_JOSE_ALG_NOT_ALLOWED', 'ERR_JWKS_NO_MATCHING_KEY',
]);

export function createOidcAuthenticator({ issuer, audience, jwksUrl, keySet } = {}) {
  const issuerUrl = new URL(issuer);
  if (issuerUrl.protocol !== 'https:' || !audience || typeof audience !== 'string') {
    throw new TypeError('Invalid CSM OIDC configuration');
  }
  if (!keySet) {
    const url = new URL(jwksUrl);
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new TypeError('Invalid CSM JWKS URL');
    }
    keySet = createRemoteJWKSet(url, { timeoutDuration: 5000 });
  }

  return async function authenticate(request) {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return null;
    const token = authorization.slice(7);
    if (!token || /\s/.test(token)) return null;
    try {
      const { payload } = await jwtVerify(token, keySet, {
        issuer, audience, algorithms: ['RS256', 'ES256'],
        requiredClaims: ['sub', 'iat', 'exp'],
      });
      if (typeof payload.sub !== 'string' || !payload.sub) return null;
      return { issuer, subject: payload.sub };
    } catch (error) {
      if (error instanceof errors.JOSEError && INVALID_TOKEN_CODES.has(error.code)) return null;
      throw error;
    }
  };
}
