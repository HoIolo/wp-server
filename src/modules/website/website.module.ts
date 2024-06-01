import { Module } from '@nestjs/common';
import { WebsiteSetting } from './entity/websiteSetting.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';
import { CommonService } from 'src/common/service/common.service';

@Module({
  imports: [TypeOrmModule.forFeature([WebsiteSetting])],
  providers: [WebsiteService, CommonService],
  controllers: [WebsiteController],
  exports: [WebsiteService],
})
export class WebsiteModule {}
