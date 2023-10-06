import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PublishCommentDTO } from './dto/publishComment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entity/comment.entity';
import { User } from '../user/entity/user.entity';
import { Article } from '../article/entity/article.entity';
import { PageDTO } from 'src/common/dto/page.dto';
import { handlePage } from 'src/utils/common';
import { ReplyCommentDto } from '../article/dto/replyComment.dto';
import { Reply } from './entity/reply.entity';
import { plainToClass } from 'class-transformer';
import { LikesDTO } from './dto/likes.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Reply)
    private readonly replyRepository: Repository<Reply>,
    private dataSource: DataSource,
  ) {}

  /**
   * 查询所以评论（分页）
   * @param pageDto
   * @returns
   */
  async findAllByPage(pageDto: PageDTO) {
    const { skip, offset } = handlePage(pageDto);

    return this.commentRepository
      .createQueryBuilder('comment')
      .skip(skip)
      .take(offset as number)
      .leftJoinAndSelect('comment.replys', 'replys')
      .getManyAndCount();
  }

  /**
   * 根据文章id查询
   * @param articleId
   * @param pageDto
   * @returns
   */
  async findByArticleId(articleId: number, pageDto: PageDTO) {
    const { skip, offset } = handlePage(pageDto);
    const [rows, count] = await this.commentRepository
      .createQueryBuilder('comment')
      .skip(skip)
      .take(offset as number)
      .where('article_id = :articleId', {
        articleId,
      })
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('comment.replys', 'replys')
      .leftJoinAndSelect('replys.user', 'replyUser')
      .leftJoinAndSelect('replyUser.profile', 'replyUserProfile')
      .leftJoin('comment.likes', 'commentLikes')
      .addSelect(['commentLikes.id', 'commentLikes.account'])
      .leftJoin('replys.likes', 'replyLikes')
      .addSelect(['replyLikes.id', 'replyLikes.account'])
      .orderBy('comment.id', 'DESC')
      .addOrderBy('replys.id', 'DESC')
      .getManyAndCount();

    const newRows = rows.map((row) => {
      row.user = plainToClass(User, row.user);
      row.replys.map((reply) => {
        reply.user = plainToClass(User, reply.user);
        return reply;
      });
      return row;
    });
    return [newRows, count];
  }

  /**
   * 创建评论
   * @param publishCommentDto
   * @returns
   */
  async createComment(publishCommentDto: PublishCommentDTO) {
    const { user_id, article_id } = publishCommentDto;
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    if (!user) {
      return null;
    }
    const article = await this.articleRepository.findOne({
      where: { id: article_id },
    });
    if (!article) {
      return null;
    }
    const comment = new Comment();
    const mergeComment = Object.assign(comment, publishCommentDto, {
      user,
      article,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const saveComment = await queryRunner.manager.save(mergeComment);
      if (!saveComment) return null;

      await queryRunner.commitTransaction();
      return saveComment;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      Logger.error(e);
      return null;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 创建回复
   * @param replyCommentDto
   * @returns
   */
  async createReply(replyCommentDto: ReplyCommentDto) {
    const { user_id, comment_id } = replyCommentDto;
    const user = await this.userRepository.findOneBy({ id: user_id });
    if (!user) {
      return null;
    }
    const comment = await this.commentRepository.findOneBy({ id: comment_id });
    if (!comment) {
      return null;
    }
    const reply = new Reply();
    const mergeReply = Object.assign(reply, replyCommentDto, { user, comment });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let saveReply = null;
    try {
      saveReply = await queryRunner.manager.save(mergeReply);
      if (!saveReply) {
        return null;
      }

      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      Logger.error(e);
    } finally {
      await queryRunner.release();
    }

    return saveReply;
  }

  /**
   * 更新评论点赞
   * @param commentId
   * @param likesDto
   * @returns
   */
  async updateCommentLikes(commentId: number, likesDto: LikesDTO) {
    const { flag = true, isReply = false, userId } = likesDto;
    const user = await this.userRepository.findOneBy({ id: userId });
    // 不存在这个用户
    if (!user) {
      return null;
    }

    const querRunner = this.dataSource.createQueryRunner();
    await querRunner.connect();
    await querRunner.startTransaction();

    let result = null;

    try {
      const comment = isReply
        ? await this.replyRepository.findOne({
            where: { id: commentId },
          })
        : await this.commentRepository.findOne({
            where: { id: commentId },
          });
      // 不存在这条评论
      if (!comment) {
        return null;
      }

      const relationBuilder = querRunner.manager
        .createQueryBuilder()
        .relation(isReply ? Reply : Comment, 'likes')
        .of(comment);

      if (flag) {
        result = await relationBuilder.add(user);
      } else {
        result = await relationBuilder.remove(user);
      }

      await querRunner.commitTransaction();
      return result;
    } catch (e) {
      await querRunner.rollbackTransaction();
    } finally {
      await querRunner.release();
    }

    return result;
  }
}
