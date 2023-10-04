import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PublishCommentDTO } from './dto/publishComment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entity/comment.entity';
import { User } from '../user/entity/user.entity';
import { Article } from '../article/entity/article.entity';
import { PageDTO } from 'src/common/dto/page.dto';
import { handlePage } from 'src/utils/common';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
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
    return await this.commentRepository
      .createQueryBuilder('comment')
      .skip(skip)
      .take(offset as number)
      .where('article_id', [articleId])
      .leftJoinAndSelect('comment.replys', 'replys')
      .getManyAndCount();
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
}
