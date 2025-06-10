import { TagsService } from './../tags/tags.service';
import { UserService } from './../user/user.service';
import { Injectable, Logger } from '@nestjs/common';
import { GetArticleDTO } from './dto/getArticles.dto';
import { handlePage } from 'src/utils/common';
import { DataSource, Repository } from 'typeorm';
import { Article } from './entity/article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateArticleDTO } from './dto/createArticle.dto';
import * as dayjs from 'dayjs';
import { User } from '../user/entity/user.entity';
import { Tags } from '../tags/entity/tags.entity';
import { ADD_ARTICLE_ERROR, ARTICLE_APPROVAL_STATUS } from './constant';
import { ArticleType } from './entity/articleType.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private dataSource: DataSource,
    private readonly userService: UserService,
    private readonly tagsService: TagsService,
  ) {}

  getTotal() {
    return this.articleRepository.count();
  }

  /**
   * 分页查询
   * @param getArticleDto
   * @returns
   */
  async find(getArticleDto: GetArticleDTO) {
    const { field, keyword, sorted = 'DESC', is_approved } = getArticleDto;
    const { skip, offset } = handlePage(getArticleDto);
    const queryBuild = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.type', 'type')
      .skip(skip)
      .take(offset as number)
      .orderBy('article.id', sorted);

    // 按审核状态过滤
    if (is_approved !== undefined) {
      queryBuild.andWhere('article.is_approved = :is_approved', {
        is_approved,
      });
    }

    if (field === 'type' && keyword) {
      const keywordArray = keyword.split(',');
      for (const item of keywordArray) {
        queryBuild.andWhere(`article.${field} = :type`, { type: item });
      }
    } else if (field && keyword) {
      queryBuild.andWhere(`article.${field} like :keyword`, {
        keyword: `%${keyword}%`,
      });
    }

    return queryBuild.getManyAndCount();
  }

  /**
   * 根据文章ID查询文章
   * @param article_id
   * @returns
   */
  async findById(article_id: number, isEdit?: 0 | 1) {
    const article = await this.articleRepository.findOneBy({ id: article_id });
    if (!article) {
      return null;
    }
    if (isEdit === 0) {
      // 文章浏览量 + 1
      await this.articleRepository
        .createQueryBuilder()
        .update()
        .set({ watch_num: article.watch_num + 1 })
        .where('id = :id', { id: article_id })
        .execute();
    }
    return this.articleRepository
      .createQueryBuilder('article')
      .leftJoin('article.author', 'author')
      .addSelect(['author.id', 'author.account'])
      .leftJoinAndSelect('author.profile', 'profile')
      .leftJoinAndSelect('article.type', 'type')
      .where('article.id = :id', { id: article_id })
      .getOne();
  }

  /**
   * 根据标签ID查询文章
   * @param tag_id
   * @param order
   * 可选 DESC 或者 ASC, 默认为 DESC
   * @param skip
   * @param offset
   * @param is_approved 审核状态过滤
   * @returns
   */
  findArticleByTagId(
    tag_id: number,
    order: 'DESC' | 'ASC' = 'DESC',
    skip: number,
    offset: number,
    is_approved?: number,
  ) {
    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.tagsEntity', 'tags')
      .leftJoinAndSelect('article.type', 'type')
      .where('tags.id = :tag_id', { tag_id })
      .orderBy('article.id', order)
      .skip(skip)
      .take(offset as number);

    // 按审核状态过滤
    if (is_approved !== undefined) {
      queryBuilder.andWhere('article.is_approved = :is_approved', {
        is_approved,
      });
    }

    return queryBuilder.getManyAndCount();
  }

  /**
   * 根据用户ID查询文章
   * @param user_id
   * @param order
   * 可选 DESC 或者 ASC, 默认为 DESC
   * @param skip
   * @param offset
   * @param is_approved 审核状态过滤
   * @returns
   */
  findArticleByUserId(
    user_id: number,
    order: 'DESC' | 'ASC' = 'DESC',
    skip: number,
    offset: number,
    is_approved?: number,
  ) {
    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoin('article.author', 'author')
      .addSelect(['author.id', 'author.account'])
      .leftJoinAndSelect('author.profile', 'profile')
      .leftJoinAndSelect('article.type', 'type')
      .where('author.id = :user_id', { user_id })
      .orderBy('article.id', order)
      .skip(skip)
      .take(offset as number);

    // 按审核状态过滤
    if (is_approved !== undefined) {
      queryBuilder.andWhere('article.is_approved = :is_approved', {
        is_approved,
      });
    }

    return queryBuilder.getManyAndCount();
  }

  /**
   * 新增文章
   * @param createArticleDto
   * @returns
   */
  async createArticle(
    createArticleDto: CreateArticleDTO,
    tagsList: Tags[],
    articleType: ArticleType,
  ) {
    const { author_id } = createArticleDto;
    const article = new Article();
    const user = new User();
    user.id = author_id as number;
    article.publish_date = dayjs().format('YYYY-MM-DD HH:mm:ss');
    article.author = user;
    article.tagsEntity = tagsList;
    article.type = articleType;
    const mergeArticle = Object.assign(article, createArticleDto) as Article;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');

    try {
      const saveArticle = await queryRunner.manager.save(mergeArticle);
      if (!saveArticle) {
        throw ADD_ARTICLE_ERROR.ARTICE_SAVE_ERROR;
      }

      await queryRunner.commitTransaction();
      return saveArticle;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      Logger.error(e);
      return null;
    } finally {
      queryRunner.release();
    }
  }

  /**
   * 根据年份和日期查询
   * @param year
   * @param month
   * @param is_approved 审核状态过滤
   * @returns
   */
  async findByYearAndMonth(year: number, month: number, is_approved?: number) {
    const queryBuilder = this.articleRepository
      .createQueryBuilder()
      .where('YEAR(publish_date) = :year and MONTH(publish_date) = :month', {
        year: year,
        month,
      });

    // 按审核状态过滤
    if (is_approved !== undefined) {
      queryBuilder.andWhere('is_approved = :is_approved', { is_approved });
    }

    return queryBuilder.orderBy('id', 'DESC').getManyAndCount();
  }

  /**
   * 获取时间轴
   * @param order 排序方式
   * @param is_approved 审核状态过滤
   */
  async findTimeLine(order: 'DESC' | 'ASC', is_approved?: number) {
    const queryBuilder = this.articleRepository.createQueryBuilder('article');

    // 按审核状态过滤
    if (is_approved !== undefined) {
      queryBuilder.where('article.is_approved = :is_approved', { is_approved });
    }

    const data = await queryBuilder
      .select('YEAR(publish_date)', 'year')
      .addSelect('MONTH(publish_date)', 'month')
      .groupBy('year, month')
      .orderBy('month', order)
      .getRawMany();

    for (const item of data) {
      const [child, count] = await this.findByYearAndMonth(
        item.year,
        item.month,
        is_approved,
      );
      item.child = {
        rows: child,
        count,
      };
    }

    const groupQueryBuilder = this.articleRepository.createQueryBuilder();

    // 按审核状态过滤
    if (is_approved !== undefined) {
      groupQueryBuilder.where('is_approved = :is_approved', { is_approved });
    }

    const gruop = await groupQueryBuilder
      .select(
        'COUNT(DISTINCT CONCAT(YEAR(publish_date), MONTH(publish_date)))',
        'count',
      )
      .getRawOne();
    return [data, gruop.count];
  }

  /**
   * 删除文章（软删除）
   * @param article_id
   * @returns
   */
  async deleteArticle(article_id: number) {
    const result = await this.articleRepository
      .createQueryBuilder()
      .useTransaction(true)
      .softDelete()
      .where('id = :id', { id: article_id })
      .execute();
    return result;
  }

  /**
   * 更新文章审核状态
   * @param articleId 文章ID
   * @param approvalStatus 审核状态：0-待审核，1-审核中，2-审核通过
   * @param rejectReason 拒绝原因（可选）
   * @param onSuccess 状态更新成功后的回调函数（可选）
   * @returns
   */
  async updateArticleApprovalStatus(
    articleId: number,
    approvalStatus: number,
    rejectReason?: string,
    onSuccess?: (result: any) => Promise<void>,
  ) {
    const updateData: any = { is_approved: approvalStatus };

    // 如果有拒绝原因，则更新拒绝原因字段
    if (approvalStatus !== ARTICLE_APPROVAL_STATUS.APPROVED && rejectReason) {
      updateData.reject_reason = rejectReason;
    }

    const result = await this.articleRepository
      .createQueryBuilder()
      .update()
      .set(updateData)
      .where('id = :id', { id: articleId })
      .execute();

    // 如果更新成功且状态为"审核通过"，则增加标签引用数和用户文章数
    if (
      result.affected > 0 &&
      approvalStatus === ARTICLE_APPROVAL_STATUS.APPROVED
    ) {
      await this.incrementCountsAfterApproval(articleId);
    }

    // 如果更新成功且提供了回调函数，则执行回调
    if (result.affected > 0 && onSuccess) {
      await onSuccess(result);
    }

    return result;
  }

  /**
   * 在文章审核通过后增加相关计数
   * @param articleId 文章ID
   */
  private async incrementCountsAfterApproval(articleId: number) {
    try {
      // 查询文章详情，获取作者ID和标签
      const article = await this.articleRepository
        .createQueryBuilder('article')
        .leftJoinAndSelect('article.author', 'author')
        .leftJoinAndSelect('article.tagsEntity', 'tags')
        .where('article.id = :id', { id: articleId })
        .getOne();

      if (!article) {
        Logger.error(
          `文章不存在，无法增加计数: ${articleId}`,
          'ArticleService',
        );
        return;
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction('READ COMMITTED');

      try {
        // 直接获取文章中保存的标签字符串数组
        const tagNames = article.tags;

        // 标签数 + 1
        const updateTagsResult = await this.tagsService.incrementTagsByNum(
          tagNames,
          queryRunner,
        );
        if (updateTagsResult.affected < 1) {
          throw ADD_ARTICLE_ERROR.TAG_SAVE_ERROR;
        }

        // 用户数 + 1
        const updateArticleResult = await this.userService.incrementArticleNum(
          article.author.id,
          queryRunner,
        );
        if (updateArticleResult.affected < 1) {
          throw ADD_ARTICLE_ERROR.USER_ARTICLE_NUM_ERROR;
        }

        await queryRunner.commitTransaction();
        Logger.log(
          `文章审核通过，已增加标签引用数和用户文章数: ${articleId}`,
          'ArticleService',
        );
      } catch (e) {
        await queryRunner.rollbackTransaction();
        Logger.error(`增加计数失败: ${e.message}`, 'ArticleService');
      } finally {
        queryRunner.release();
      }
    } catch (error) {
      Logger.error(
        `处理审核通过后的计数增加失败: ${error.message}`,
        'ArticleService',
      );
    }
  }

  /**
   * 更新文章
   * @param id 文章ID
   * @param updateArticleDto 更新数据
   * @param tags 标签列表
   * @param articleType 文章类型
   * @param approvalStatus 审核状态
   * @returns
   */
  async updateArticle(
    id: number,
    updateArticleDto: any,
    tags: Array<any>,
    articleType: any,
    approvalStatus: number,
  ) {
    try {
      const article = await this.articleRepository.findOne({
        where: { id },
        relations: ['type'],
      });

      if (!article) {
        return null;
      }

      // 更新基本字段
      if (updateArticleDto.title) article.title = updateArticleDto.title;
      if (updateArticleDto.content) article.content = updateArticleDto.content;
      if (updateArticleDto.description)
        article.description = updateArticleDto.description;

      // 更新文章类型
      if (articleType) {
        article.type = articleType;
      }

      // 更新标签
      if (tags && tags.length > 0) {
        article.tags = tags;
      }

      // 更新审核状态
      article.is_approved = approvalStatus;

      // 保存更新
      return await this.articleRepository.save(article);
    } catch (error) {
      console.error('更新文章失败:', error);
      return null;
    }
  }
}
