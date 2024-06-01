import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
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
import { Repository } from 'typeorm';
import { SessionEntity } from './modules/session/entity/session.entity';
import * as ExpressSession from 'express-session';
import { TypeormStore } from 'connect-typeorm';
import { WebsiteModule } from './modules/website/website.module';

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
    TypeOrmModule.forFeature([SessionEntity]),
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
    WebsiteModule,
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
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        ExpressSession({
          secret: 'my-secret',
          resave: false,
          saveUninitialized: true,
          cookie: {
            secure: true,
            maxAge: 1000 * 60 * 30,
          },
          store: new TypeormStore({
            ttl: 1000 * 60 * 30,
          }).connect(this.sessionRepository),
        }),
      )
      .forRoutes('*');
    consumer.apply(LogsMiddleware).forRoutes('*');
  }
}
