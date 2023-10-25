import * as OSS from 'ali-oss';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UPLOAD_RESPONSE } from './constant';
import { code } from 'src/constant';

@Injectable()
export class OssService {
  private client: any;
  public constructor(private configService: ConfigService) {
    this.client = new OSS({
      accessKeyId: this.configService.get('accessKeyId'),
      accessKeySecret: this.configService.get('accessKeySecret'),
      region: this.configService.get('region'),
      bucket: this.configService.get('bucket'),
    });
  }
  // 创建存储空间。
  private async putBucket(bucketName: string) {
    try {
      const options = {
        storageClass: 'Archive', // 存储空间的默认存储类型为标准存储，即Standard。如果需要设置存储空间的存储类型为归档存储，请替换为Archive。
        acl: 'private', // 存储空间的默认读写权限为私有，即private。如果需要设置存储空间的读写权限为公共读，请替换为public-read。
        dataRedundancyType: 'ZRS', // 存储空间的默认数据容灾类型为本地冗余存储，即LRS。如果需要设置数据容灾类型为同城冗余存储，请替换为ZRS。
      };
      const result = await this.client.putBucket(bucketName);
      console.log(result);
    } catch (err) {
      console.log(err);
    }
  }
  // 列举所有的存储空间
  private async listBuckets() {
    try {
      const result = await this.client.listBuckets();
      console.log(result);
    } catch (err) {
      console.log(err);
    }
  }
  // 上传文件到oss 并返回  图片oss 地址
  public async putOssFile(ossPath: string, localPath: string): Promise<string> {
    const res = await this.client.put(ossPath, localPath);
    // 将文件设置为公共可读
    await this.client.putACL(ossPath, 'public-read');

    return res.url;
  }
  /**
   * 获取文件的url
   * @param filePath
   */
  public async getFileSignatureUrl(filePath: string): Promise<string> {
    if (filePath == null) {
      console.log('get file signature failed: file name can not be empty');
      return null;
    }
    let result = '';
    try {
      result = this.client.signatureUrl(filePath, { expires: 36000 });
    } catch (err) {
      console.log(err);
    }
    return result;
  }
  /**
   * 上传文件大小校验
   * @param localPath
   * @param ossPath
   * @param size
   */
  public async validateFile(
    ossPath: string,
    localPath: string,
    size: number,
  ): Promise<string> {
    if (size > 5 * 1024 * 1024) {
      throw new HttpException(
        {
          message: UPLOAD_RESPONSE.FILE_SIZE_FAIL,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      return await this.putOssFile(ossPath, localPath);
    }
  }

  public async getImageList() {
    const list = await this.client.list();
    const images = list.objects;
    return images;
  }
}
