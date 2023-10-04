import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entity/comment.entity';
import { Reply } from './entity/reply.entity';
import { CommentService } from './comment.service';
import { User } from '../user/entity/user.entity';
import { Article } from '../article/entity/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Reply, User, Article])],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
