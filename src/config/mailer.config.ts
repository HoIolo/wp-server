import { ConfigService } from '@nestjs/config';
import { MailerOptions } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

export const mailerFactory = (config: ConfigService) => {
  return {
    transport: {
      host: 'smtp.qq.com',
      ignoreTLS: true,
      secure: true,
      auth: {
        user: config.get('MAIL_USER'),
        pass: config.get('MAIL_PASS'),
      },
    },
    defaults: {
      from: config.get('MAIL_DEFAULT_FROM'),
    },
    template: {
      dir: path.join(process.cwd(), './src/template'),
      adapter: new EjsAdapter(),
      options: {
        strict: true, //严格模式
      },
    },
  } as MailerOptions;
};
