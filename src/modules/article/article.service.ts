import { Injectable, Logger } from '@nestjs/common';
import { GetArticleDTO } from './dto/getArticles.dto';
import { handlePage } from 'src/utils/common';
import { DataSource, Repository } from 'typeorm';
import { Article } from './entity/article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateArticleDTO } from './dto/createArticle.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private dataSource: DataSource,
  ) {}

  /**
   * 分页查询
   * @param getArticleDto
   * @returns
   */
  async find(getArticleDto: GetArticleDTO) {
    const { skip, offset } = handlePage(getArticleDto);
    return this.articleRepository
      .createQueryBuilder()
      .skip(skip)
      .take(offset as number)
      .getManyAndCount();
  }

  /**
   * 新增文章
   * @param createArticleDto
   * @returns
   */
  async createArticle(createArticleDto: CreateArticleDTO) {
    const article = new Article();

    article.publish_date = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const mergeArticle = Object.assign(article, createArticleDto) as Article;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const saveArticle = queryRunner.manager.save(mergeArticle);
      if (!saveArticle) {
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
}
