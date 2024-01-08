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

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private dataSource: DataSource,
    private readonly userService: UserService,
    private readonly tagsService: TagsService,
  ) {}

  /**
   * 分页查询
   * @param getArticleDto
   * @returns
   */
  async find(getArticleDto: GetArticleDTO) {
    const { field, keyword, sorted = 'DESC' } = getArticleDto;
    const { skip, offset } = handlePage(getArticleDto);
    const queryBuild = this.articleRepository
      .createQueryBuilder()
      .skip(skip)
      .take(offset as number)
      .orderBy('id', sorted);
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
  async findById(article_id: number) {
    const article = await this.articleRepository.findOneBy({ id: article_id });
    if (!article) {
      return null;
    }
    // 文章浏览量 + 1
    await this.articleRepository
      .createQueryBuilder()
      .update()
      .set({ watch_num: article.watch_num + 1 })
      .where('id = :id', { id: article_id })
      .execute();
    return this.articleRepository
      .createQueryBuilder('article')
      .leftJoin('article.author', 'author')
      .addSelect(['author.id', 'author.account'])
      .leftJoinAndSelect('author.profile', 'profile')
      .where('article.id = :id', { id: article_id })
      .getOne();
  }

  /**
   * 新增文章
   * @param createArticleDto
   * @returns
   */
  async createArticle(createArticleDto: CreateArticleDTO) {
    const { author_id, tags } = createArticleDto;
    const article = new Article();
    const user = new User();
    user.id = author_id as number;
    article.publish_date = dayjs().format('YYYY-MM-DD HH:mm:ss');
    article.author = user;
    const mergeArticle = Object.assign(article, createArticleDto) as Article;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const saveArticle = queryRunner.manager.save(mergeArticle);
      if (!saveArticle) {
        return null;
      }
      // 用户数 + 1
      const updateArticleResult =
        await this.userService.incrementArticleNum(author_id);
      if (updateArticleResult.affected < 1) {
        return null;
      }
      // 标签数 + 1
      const updateTagsResult = await this.tagsService.incrementTagsByNum(tags);
      if (updateTagsResult.affected < 1) {
        return null;
      }

      await queryRunner.commitTransaction();
      return saveArticle;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      Logger.error(e);
      return null;
    }
  }

  /**
   * 根据年份和日期查询
   * @param year
   * @param month
   * @returns
   */
  async findByYearAndMonth(year: number, month: number) {
    return this.articleRepository
      .createQueryBuilder()
      .where('YEAR(publish_date) = :year and MONTH(publish_date) = :month', {
        year: year,
        month,
      })
      .orderBy('id', 'DESC')
      .getManyAndCount();
  }

  /**
   * 获取时间轴
   * @param pageDto
   */
  async findTimeLine(order: 'DESC' | 'ASC') {
    const data = await this.articleRepository
      .createQueryBuilder('article')
      .select('YEAR(publish_date)', 'year')
      .addSelect('MONTH(publish_date)', 'month')
      .groupBy('year, month')
      .orderBy('month', order)
      .getRawMany();

    for (const item of data) {
      const [child, count] = await this.findByYearAndMonth(
        item.year,
        item.month,
      );
      item.child = {
        rows: child,
        count,
      };
    }

    const gruop = await this.articleRepository
      .createQueryBuilder()
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
}
