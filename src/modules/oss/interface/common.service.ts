/**
 *
 * @description: 公共服务
 *
 */
export interface CommonOssService {
  putOssFile(reomotePath: string, localPath: string): Promise<boolean | string>;
  getFileSignatureUrl(filePath: string): Promise<string>;
  validateFile(
    ossPath: string,
    localPath: string,
    size: number,
  ): Promise<string>;
  getFileList(uri: string);
  delFile(filename: string): Promise<boolean>;
}
