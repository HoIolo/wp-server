import { Module } from '@nestjs/common';
import { OssService } from './oss.service';
import { OssController } from './oss.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [OssController],
  providers: [OssService],
})
export class OssModule {}
