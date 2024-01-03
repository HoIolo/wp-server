import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Query,
  Delete,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import multer = require('multer');
import { code, roles } from 'src/constant';
import { Role } from 'src/common/decorator/role.decorator';
import { ConfigService } from '@nestjs/config';
import path = require('path');
import fs = require('fs');
import fsPm = require('fs/promises');
import { UPLOAD_RESPONSE } from './constant';
import { GetImageDto } from './dto/getImageDto';
import { UpYunService } from './upyun/upyun.service';

@ApiBearerAuth() // Swagger 的 JWT 验证
@ApiTags('oss')
@Controller()
export class OssController {
  constructor(
    private readonly ossService: UpYunService,
    private readonly configService: ConfigService,
  ) {}
  /**
   * 上传图片到 本地 和 oss
   * @param body
   */
  @Post('image')
  @Role(roles.LOGGED)
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
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('local') local: string = 'false',
  ): Promise<any> {
    let ossUrl = '';
    const destinationPath = `${this.configService.get('UPLOAD_IMAGE_PATH')}${
      file.originalname
    }`;
    if (local == 'true') {
      ossUrl = this.configService.get('API_HOST') + '/' + destinationPath;
    } else {
      // 验证并上传文件到OSS
      ossUrl = await this.ossService.validateFile(
        `${this.configService.get('OSS_UPLOAD_IMAGE_PATH')}${
          file.originalname
        }`,
        destinationPath,
        file.size,
      );
    }

    return {
      row: ossUrl,
    };
  }

  /**
   * 上传图片（批量， 最多5个）
   * @param files
   * @returns
   */
  @Post('images')
  @Role(roles.LOGGED)
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
      rows: ossUrls,
    };
  }

  /**
   * 获取图片列表
   * @param local 是否获取本地储存
   * @returns
   */
  @Get('images')
  @Role(roles.ADMIN)
  async getImages(@Query() getImageDto: GetImageDto) {
    const { local = 'false', keyword } = getImageDto;
    let images = null;
    if (local === 'true') {
      const UPLOAD_IMAGE_PATH = 'UPLOAD_IMAGE_PATH';
      const dirPath = this.configService.get(UPLOAD_IMAGE_PATH);
      const files = await fsPm.readdir(dirPath);
      images = files.map((file) => {
        const fileSize = fs.statSync(path.join(dirPath, file)).size;
        return {
          name: file,
          url:
            this.configService.get('API_HOST') + '/' + path.join(dirPath, file),
          size: fileSize,
        };
      });
    } else {
      images = await this.ossService.getFileList('image/');
    }
    if (keyword) {
      images = images.filter((image) => {
        return image.name.includes(keyword);
      });
    }

    return {
      rows: images,
    };
  }

  /**
   * 删除图片
   * @param filename
   * @param local
   * @returns
   */
  @Delete('/image')
  @Role(roles.ADMIN)
  async deleteImage(
    @Body('filename') filename: string,
    @Body('local') local: string = 'false',
  ) {
    if (local === 'true') {
      const filePath = path.join(
        this.configService.get('UPLOAD_IMAGE_PATH'),
        filename,
      );
      await fsPm.unlink(filePath);
      return null;
    }
    await this.ossService.delFile(filename);
    return null;
  }
}
