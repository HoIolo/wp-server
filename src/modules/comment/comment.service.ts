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
import { GetCommentDto } from './dto/getComment.dto';

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

  getTotal() {
    return this.commentRepository.count();
  }

  /**
   * 查询所以评论（分页）
   * @param getCommentDto
   * @returns
   */
  async findAllByPage(getCommentDto: GetCommentDto) {
    const { skip, offset } = handlePage(getCommentDto);
    const { sorted, keyword, field } = getCommentDto;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .skip(skip)
      .take(offset as number)
      .leftJoinAndSelect('comment.replys', 'replys')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .orderBy('comment.createTime', sorted);

    if (keyword && field) {
      queryBuilder.andWhere(`comment.${field} like :keyword`, {
        keyword: `%${keyword}%`,
      });
    }

    const [rows, count] = await queryBuilder.getManyAndCount();

    const newRows = rows.map((row) => {
      row.user = plainToClass(User, row.user);
      row.replys?.map((reply) => {
        reply.user = plainToClass(User, reply.user);
        return reply;
      });
      return row;
    });

    return [newRows, count];
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
      .leftJoin('comment.likes', 'commentLikes')
      .leftJoinAndSelect('comment.replys', 'replys')
      .addSelect(['commentLikes.id', 'commentLikes.account'])
      .leftJoinAndSelect('replys.user', 'replyUser')
      .leftJoinAndSelect('replyUser.profile', 'replyUserProfile')
      .leftJoin('replys.likes', 'replyLikes')
      .addSelect(['replyLikes.id', 'replyLikes.account'])
      .addOrderBy('replys.id', 'DESC')
      .orderBy('comment.id', 'DESC')
      .getManyAndCount();

    const newRows = rows.map((row) => {
      row.user = plainToClass(User, row.user);
      row.replys?.map((reply) => {
        reply.user = plainToClass(User, reply.user);
        return reply;
      });
      return row;
    });
    return [newRows, count];
  }

  /**
   * 根据评论id查询回复
   * @param commentId
   * @param pageDto
   * @returns
   */
  async findReplyByCommentId(commentId: number, pageDto: PageDTO) {
    const { skip, offset } = handlePage(pageDto);
    const [rows, count] = await this.replyRepository
      .createQueryBuilder('reply')
      .skip(skip)
      .take(offset as number)
      .where('comment_id = :commentId', {
        commentId,
      })
      .leftJoinAndSelect('reply.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .getManyAndCount();
    const newRows = rows.map((row) => {
      row.user = plainToClass(User, row.user);
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
      // 文章评论数 + 1
      await queryRunner.manager
        .createQueryBuilder()
        .update(Article)
        .set({ comment_num: article.comment_num + 1 })
        .where('id = :id', { id: article_id })
        .execute();
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
   * 删除评论
   * @param commentId 评论id
   * @returns
   */
  async deleteComment(commentId: number, type: 'reply' | 'comment') {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const Entry = type === 'reply' ? Reply : Comment;
      const result = await queryRunner.manager.softDelete(Entry, commentId);
      await queryRunner.commitTransaction();
      return result;
    } catch (e) {
      await queryRunner.rollbackTransaction();
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
