import { Module } from '@nestjs/common';
import { WebsiteSetting } from './entity/websiteSetting.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';
import { CommonService } from 'src/common/service/common.service';
import { DailyVisitor } from './entity/visitor.entity';
import { VisitorController } from './visitor.controller';
import { VisitorService } from './visitor.service';

@Module({
  imports: [TypeOrmModule.forFeature([WebsiteSetting, DailyVisitor])],
  providers: [WebsiteService, CommonService, VisitorService],
  controllers: [WebsiteController, VisitorController],
  exports: [WebsiteService, VisitorService],
})
export class WebsiteModule {}
