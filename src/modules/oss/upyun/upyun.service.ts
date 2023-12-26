import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UPLOAD_RESPONSE } from '../constant';
import { code } from 'src/constant';
import upyun, { Service, Client } from 'upyun';
import fs = require('fs/promises');
import { CommonOssService } from '../interface/common.service';

@Injectable()
export class UpYunService implements CommonOssService {
  private client: upyun.Client;
  public constructor(private configService: ConfigService) {
    const service = new Service(
      this.configService.get('UPYUN_service'),
      this.configService.get('UPYUN_operator'),
      this.configService.get('UPYUN_password'),
    );
    this.client = new Client(service);
  }

  // 上传文件到又拍云 并返回  图片地址
  public async putOssFile(
    reomotePath: string,
    localPath: string,
  ): Promise<boolean | string> {
    const localFile = await fs.readFile(localPath);
    const uploadResult = await this.client.putFile(reomotePath, localFile);
    if (uploadResult) {
      return this.configService.get('UPYUN_ACESS_URL') + '/' + reomotePath;
    }
    return uploadResult as boolean;
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
    const result = await this.client.getFile(filePath, null);
    if (result === false) {
      throw new HttpException(
        {
          message: UPLOAD_RESPONSE.UPLOAD_FAIL,
          code: code.SYSTEM_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return this.configService.get('UPYUN_ACESS_URL') + filePath;
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
      const putResult = await this.putOssFile(ossPath, localPath);
      if (putResult === false) {
        throw new HttpException(
          {
            message: UPLOAD_RESPONSE.UPLOAD_FAIL,
            code: code.SYSTEM_ERROR,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return putResult as string;
    }
  }

  /**
   * 获取目录中的文件列表
   * @param uri 目录
   * @returns
   */
  public async getFileList(uri: string) {
    const list = await this.client.listDir(uri);
    const files = (list as upyun.listDirResponse).files;
    const newFiles = files.map((item) => {
      const url =
        this.configService.get('UPYUN_ACESS_URL') +
        '/' +
        this.configService.get('OSS_UPLOAD_IMAGE_PATH') +
        item.name;
      return {
        name: item.name,
        size: item.size,
        type: item.type,
        time: item.time,
        url,
      };
    });
    return newFiles;
  }

  /**
   * 删除文件
   * @param filename
   * @returns
   */
  public async delFile(filename: string): Promise<boolean> {
    try {
      const result = await this.client.deleteFile(filename);
      return result;
    } catch (error) {
      throw error;
    }
  }
}
