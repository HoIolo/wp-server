import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { Article } from './entity/article.entity';
import { User } from '../user/entity/user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, User]),
    forwardRef(() => UserModule),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
