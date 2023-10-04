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
      .orderBy('id', 'DESC')
      .getManyAndCount();
  }

  /**
   * 根据文章ID查询文章
   * @param article_id
   * @returns
   */
  async findById(article_id: number) {
    return this.articleRepository.findOneBy({ id: article_id });
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

  /**
   * 获取时间轴
   * @param pageDto
   */
  async findTimeLine() {
    const data = await this.articleRepository
      .createQueryBuilder('article')
      .select([
        'YEAR(article.publish_date) as year',
        'MONTH(article.publish_date) as month',
        'COUNT(*) as count',
      ])
      .groupBy('year, month')
      .orderBy('year', 'DESC')
      .getRawMany();

    if (data === null || data === undefined) {
      return [null, 0];
    }

    // 创建一个映射对象以存储按年份分组的数据
    const groupedData = {};

    // 遍历原始数据并按年份分组
    data.forEach((item) => {
      const year = item.year;
      if (!groupedData[year]) {
        groupedData[year] = [];
      }
      // 将项目添加到对应年份的数组中
      groupedData[year].push({
        month: item.month,
        count: parseInt(item.count, 10), // 将count字段转化为整数
      });
    });

    // 将映射对象转化为数组
    const result = Object.entries(groupedData).map(([year, items]) => ({
      year: parseInt(year, 10), // 将年份字段转化为整数
      child: items,
    }));

    return [result, result?.length || 0];
  }
}
