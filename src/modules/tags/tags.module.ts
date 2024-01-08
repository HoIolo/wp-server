import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tags } from './entity/tags.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tags])],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [],
})
export class TagsModule {}
