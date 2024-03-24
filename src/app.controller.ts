/* eslint-disable prettier/prettier */
import { MailerService } from '@nestjs-modules/mailer';
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { AppService } from './app.service';
import { Role } from './common/decorator/role.decorator';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { isEmpty } from './utils/common';
import { code } from 'src/constant';

class EmailDTO {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;
}

class CheckEmailDTO {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @ApiProperty()
  checkCode: string;
}

@ApiTags('')
@Role(0)
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailerService: MailerService,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  @Get('/backstage/home')
  async getBackstageHome() {
    const detail = await this.appService.getBackStageDetail();
    return {
      row: detail,
    };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/email/send')
  async sendEmail(@Body() emailDTO: EmailDTO) {
    const { email } = emailDTO;

    const code = await this.appService.sendEmail(email);

    if (code) {
      // 设置过期时间 5min
      this.redis.set(email, code, 'EX', 60 * 5);
      return {
        message: '发送成功',
      };
    }
    return {
      message: '发送失败，请稍后再试',
    };
  }

  /**
   * 验证邮箱是否通过
   * @param checkEmailDTO
   * @returns
   */
  @Post('/email/check')
  async emailCheck(@Body() checkEmailDTO: CheckEmailDTO) {
    const { email, checkCode } = checkEmailDTO;
    const checkCodeCache = await this.redis.get(email);

    // 验证码缓存为空
    if (isEmpty(checkCodeCache)) {
      throw new HttpException(
        {
          message: '验证码已过期！',
          status: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // 验证码错误
    if (checkCodeCache !== checkCode) {
      throw new HttpException(
        {
          message: '验证码错误！',
          status: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      return {
        message: '验证成功！',
      };
    }
  }
}
