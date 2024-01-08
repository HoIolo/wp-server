import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerFactory } from './config/mailer.config';
import { dbFactory } from './config/db.config';
import { RoleGuard } from './common/guard/role.guard';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ArticleModule } from './modules/article/article.module';
import LogsMiddleware from './common/middleware/logs.middleware';
import { OssModule } from './modules/oss/oss.module';
import { CommentModule } from './modules/comment/comment.module';
import { ChatModule } from './modules/chat/chat.module';
import { CacheModule } from './cache.module';
import { LoggerModule } from './modules/logger/logger.module';
import { AllExceptionFilter } from './common/filter/all-exception.filter';
import { AIModule } from './modules/ai/ai.module';
import { TagsModule } from './modules/tags/tags.module';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: mailerFactory,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: dbFactory,
    }),
    LoggerModule,
    CacheModule,
    UserModule,
    AuthModule,
    ArticleModule,
    OssModule,
    CommentModule,
    ChatModule,
    AIModule,
    TagsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogsMiddleware).forRoutes('*');
  }
}
