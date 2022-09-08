import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly mailerService: MailerService) {}

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * 发送邮件
   * @param email
   * @returns
   */
  async sendEmail(email: string) {
    const code = Math.random().toString().slice(-6);
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: '邮箱验证',
        template: './validate.code.ejs',
        context: {
          code, //验证码
          date: new Date().toLocaleString(), //日期
          sign: '系统邮件,回复无效。', //发送的签名,当然也可以不要
        },
      });

      return code;
    } catch (err) {
      throw new HttpException(err, 500);
    }
  }
}
