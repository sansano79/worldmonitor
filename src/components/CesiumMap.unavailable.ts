/** Build-time placeholder so non-CSM editions do not bundle the Cesium engine. */
export class CesiumMap {
  public static async create(): Promise<never> {
    throw new Error('The Cesium renderer is available only in the CSM edition.');
  }
}
