import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { Article } from './entity/article.entity';
import { User } from '../user/entity/user.entity';
import { UserModule } from '../user/user.module';
import { CacheModule } from 'src/cache.module';
import { TagsModule } from '../tags/tags.module';
import { ArticleType } from './entity/articleType.entity';
import { ArticleTypeService } from './articleType.service';
import { ArticleTypeController } from './articleType.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, User, ArticleType]),
    forwardRef(() => UserModule),
    CacheModule,
    TagsModule,
  ],
  controllers: [ArticleTypeController, ArticleController],
  providers: [ArticleService, ArticleTypeService],
  exports: [ArticleService],
})
export class ArticleModule {}
