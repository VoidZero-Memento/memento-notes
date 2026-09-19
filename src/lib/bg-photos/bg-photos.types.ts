export type OssImageMeta = {
  name: string;
  url: string;
  size: number;
};

export type BgPhotoSlot = {
  url: string;
  /** PC 并排竖图；缺省时按单张 `url` 渲染 */
  urls?: string[];
  visible: boolean;
};
