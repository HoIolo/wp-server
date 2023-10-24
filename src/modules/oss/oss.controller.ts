import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import multer = require('multer');
import { OssService } from './oss.service';
import { code, roles } from 'src/constant';
import { Role } from 'src/common/decorator/role.decorator';
import { ConfigService } from '@nestjs/config';
import path = require('path');
import fs = require('fs');
import { UPLOAD_RESPONSE } from './constant';

@ApiBearerAuth() // Swagger 的 JWT 验证
@ApiTags('oss')
@Controller()
@Role(roles.VISITOR)
export class OssController {
  constructor(
    private readonly ossService: OssService,
    private readonly configService: ConfigService,
  ) {}
  /**
   * 上传图片到 本地 和 oss
   * @param body
   */
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, new ConfigService().get('UPLOAD_IMAGE_PATH'));
        },
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<any> {
    const ossUrl = await this.ossService.validateFile(
      `${this.configService.get('OSS_UPLOAD_IMAGE_PATH')}${file.originalname}`,
      `${this.configService.get('UPLOAD_IMAGE_PATH')}${file.originalname}`,
      file.size,
    );

    return {
      imageUrl: ossUrl,
    };
  }

  /**
   * 上传图片（批量， 最多5个）
   * @param files
   * @returns
   */
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('local') local: string = 'false',
  ): Promise<any> {
    const ossUrls = [];
    if (!files) {
      throw new HttpException(
        {
          message: UPLOAD_RESPONSE.PARAMS_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    for (const file of files) {
      // 为每个文件生成唯一的文件名，可以使用UUID或其他方法
      const uniqueFileName = file.originalname;

      // 存储文件到目标文件夹
      const destinationPath = path.join(
        this.configService.get('UPLOAD_IMAGE_PATH'),
        uniqueFileName,
      );

      // 存储文件
      fs.writeFileSync(destinationPath, file.buffer);

      // 构建OSS上传路径
      const ossPath = `${this.configService.get(
        'OSS_UPLOAD_IMAGE_PATH',
      )}${uniqueFileName}`;
      const localPath = `${this.configService.get(
        'UPLOAD_IMAGE_PATH',
      )}${uniqueFileName}`;
      let ossUrl = '';
      ossUrl = destinationPath;
      if (local == 'true') {
        ossUrl = destinationPath;
      } else {
        // 验证并上传文件到OSS
        ossUrl = await this.ossService.validateFile(
          ossPath,
          localPath,
          file.size,
        );
      }
      ossUrls.push(ossUrl);
    }

    return {
      imageUrls: ossUrls,
    };
  }
}
