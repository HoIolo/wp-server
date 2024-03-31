import { CommentService } from './modules/comment/comment.service';
import { ArticleService } from './modules/article/article.service';
import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, Injectable } from '@nestjs/common';
import { UserService } from './modules/user/user.service';
import { TagsService } from './modules/tags/tags.service';
import path = require('path');

@Injectable()
export class AppService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly userService: UserService,
    private readonly articleService: ArticleService,
    private readonly commentService: CommentService,
    private readonly tagService: TagsService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getBackStageDetail() {
    const userTotal = await this.userService.getTotal();
    const articleTotal = await this.articleService.getTotal();
    const commentTotal = await this.commentService.getTotal();
    const tagTotal = await this.tagService.getTotal();
    return {
      userTotal,
      articleTotal,
      commentTotal,
      tagTotal,
    };
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
        template: path.join(__dirname, '../public/template/validate.code.ejs'),
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
