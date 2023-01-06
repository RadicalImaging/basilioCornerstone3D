import IImageVolume from './IImageVolume';

/**
 * Cornerstone Image interface, it is used for both CPU and GPU rendering
 */
interface ICountour {
  contourId: string;
  contourData;
  sharedCacheKey?: string;
  referenceImageVolume?: IImageVolume;
  sizeInBytes: number;
}

export default ICountour;
