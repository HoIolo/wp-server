import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { OssService } from './oss.service';
import { OssController } from './oss.controller';
import { ConfigModule } from '@nestjs/config';
import { FileUploadMiddleware } from 'src/common/middleware/fileupload.middleware';

@Module({
  imports: [ConfigModule],
  controllers: [OssController],
  providers: [OssService],
})
export class OssModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(FileUploadMiddleware).forRoutes('/image');
  }
}
