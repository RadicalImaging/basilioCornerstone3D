import { IContour, IContourLoadObject } from '../types';

interface ICachedContour {
  contour?: IContour;
  contourId: string;
  contourLoadObject: IContourLoadObject;
  loaded: boolean;
  timeStamp: number;
  sizeInBytes: number;
}

export default ICachedContour;
