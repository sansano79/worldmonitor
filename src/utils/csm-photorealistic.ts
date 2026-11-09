/** Google Photorealistic 3D Tiles asset hosted by Cesium ion. */
export const CSM_PHOTOREALISTIC_ASSET_ID = 2275207;

export interface CsmRuntimeConfig {
  cesiumIonToken?: string;
}

/** Read the intentionally public, origin-restricted token injected by the Docker entrypoint. */
export function getCsmCesiumIonClientToken(config?: CsmRuntimeConfig | null): string | null {
  const runtimeConfig = config ?? (typeof window === 'undefined'
    ? undefined
    : (window as Window & { __WM_CSM_CONFIG__?: CsmRuntimeConfig }).__WM_CSM_CONFIG__);
  const token = runtimeConfig?.cesiumIonToken?.trim();
  return token || null;
}

/**
 * Load a Cesium ion asset with a user-supplied token without leaving it as the
 * application's default token after the request has been authorized.
 */
export async function loadIonAssetWithTemporaryToken<T>(
  ion: { defaultAccessToken: string },
  token: string,
  load: () => Promise<T>,
): Promise<T> {
  const previousToken = ion.defaultAccessToken;
  ion.defaultAccessToken = token;
  try {
    return await load();
  } finally {
    ion.defaultAccessToken = previousToken;
  }
}
