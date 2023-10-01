import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import multer = require('multer');
import { OssService } from './oss.service';
import { roles } from 'src/constant';
import { Role } from 'src/common/decorator/role.decorator';
import { ConfigService } from '@nestjs/config';

@ApiBearerAuth() // Swagger 的 JWT 验证
@ApiTags('oss')
@Controller()
@Role(roles.LOGGED)
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
}
