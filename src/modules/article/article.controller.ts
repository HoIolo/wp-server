import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/decorator/role.decorator';
import { code, roles } from 'src/constant';
import { ArticleService } from './article.service';
import { GetArticleDTO } from './dto/getArticles.dto';
import { CreateArticleDTO } from './dto/createArticle.dto';
import {
  CREATE_ARTICLE_RESPONSE,
  DEFAULT_RESOPNSE,
  DELETE_ARTICLE_RESPONSE,
  FIND_ARTICLE_RESPONSE,
} from './constant';
import { UserService } from '../user/user.service';
import { Redis } from 'ioredis';
import { isEmpty } from 'src/utils/common';
import { TagsService } from '../tags/tags.service';

@ApiTags('article')
@Controller()
@Role(roles.VISITOR)
export class ArticleController {
  private readonly cacheExpireTime: number = 60 * 60 * 24;

  constructor(
    private readonly articleService: ArticleService,
    private readonly userService: UserService,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly tagsService: TagsService,
  ) {}

  /**
   * 分页获取文章信息
   * @param getArticleDto
   * @returns
   */
  @Get('articles')
  async getArticle(@Query() getArticleDto: GetArticleDTO) {
    const { field, sorted, page, offset, keyword } = getArticleDto;
    // 过滤无效数据
    const sortedParamError = sorted && sorted !== 'DESC' && sorted !== 'ASC';
    const fieldParamError = field && field !== 'title' && field !== 'type';
    if (sortedParamError || fieldParamError) {
      throw new HttpException(
        {
          message: DEFAULT_RESOPNSE.PARAMS_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // 缓存文章数据
    const cacheKey = `articles_${sorted}_${page}_${offset}`;
    const articleCache = await this.redis.get(cacheKey);
    // 如果缓存中存在且没有关键字查询，则直接返回缓存
    if (articleCache && isEmpty(keyword)) {
      return JSON.parse(articleCache);
    }
    const [rows, count] = await this.articleService.find(getArticleDto);
    // 关键词查询不缓存
    if (isEmpty(keyword))
      this.redis.setex(
        cacheKey,
        this.cacheExpireTime,
        JSON.stringify({ rows, count }),
      );
    return {
      rows,
      count,
    };
  }

  /**
   * 查询文章时间轴
   * @returns
   */
  @Get('/article/timeline')
  async getArticleTimeline(@Query('order') order: 'DESC' | 'ASC' = 'ASC') {
    if (order !== 'DESC' && order !== 'ASC') {
      throw new HttpException(
        {
          message: DEFAULT_RESOPNSE.PARAMS_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // 存在缓存直接返回
    const cacheKey = `articles_timeline_${order}`;
    const timelineCache = await this.redis.get(cacheKey);
    if (timelineCache) {
      return JSON.parse(timelineCache);
    }
    const [rows, count] = await this.articleService.findTimeLine(order);
    this.redis.setex(
      cacheKey,
      this.cacheExpireTime,
      JSON.stringify({ rows, count }),
    );
    return {
      rows,
      count,
    };
  }

  /**
   * 根据id获取文章信息
   * @param id
   * @returns
   */
  @Get('article/:id')
  async getArticleById(@Param('id', ParseIntPipe) id: number) {
    const cacheKey = `article_${id}`;
    const articleCache = await this.redis.get(cacheKey);
    if (articleCache) {
      return JSON.parse(articleCache);
    }
    const article = await this.articleService.findById(id);
    if (!article) {
      throw new HttpException(
        {
          message: FIND_ARTICLE_RESPONSE.PARAMS_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    this.redis.setex(
      cacheKey,
      this.cacheExpireTime,
      JSON.stringify({ row: article }),
    );

    return {
      row: article,
    };
  }

  /**
   * 新增文章（需要登陆）
   * @param createArticleDto
   * @returns
   */
  @Post('article')
  @Role(roles.LOGGED)
  async createArticle(@Body() createArticleDto: CreateArticleDTO) {
    const { author_id, tags } = createArticleDto;
    const user = await this.userService.findProfileByUid(author_id as number);
    // 提供作者id为错误的
    if (!user) {
      throw new HttpException(
        {
          message: CREATE_ARTICLE_RESPONSE.PARAMS_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // 验证标签是否存在
    const tagsList = await this.tagsService.findByTagNameArray(tags);
    if (tagsList.length !== tags.length) {
      // 标签有一个不存在，或者都不存在
      throw new HttpException(
        {
          message: CREATE_ARTICLE_RESPONSE.TAGS_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.articleService.createArticle(
      createArticleDto,
      tagsList,
    );
    if (result === null) {
      throw new HttpException(
        {
          message: CREATE_ARTICLE_RESPONSE.FAIL,
          code: code.SYSTEM_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else {
      // 成功发布文章后，将文章的缓存删除
      const articleKeysMatch = 'articles*';
      const articleKeys = await this.redis.keys(articleKeysMatch);
      if (articleKeys && articleKeys.length > 0) this.redis.del(articleKeys);

      return {
        message: CREATE_ARTICLE_RESPONSE.SUCCESS,
      };
    }
  }

  /**
   * 删除文章（管理员）
   * @param id
   * @returns
   */
  @Delete('article/:id')
  @Role(roles.ADMIN)
  async deleteArticle(@Param('id', ParseIntPipe) id: number) {
    const result = await this.articleService.deleteArticle(id);
    if (result.affected < 1) {
      throw new HttpException(
        {
          message: DELETE_ARTICLE_RESPONSE.PARAMS_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // 成功删除文章后，将文章的缓存删除
    const articleKeysMatch = 'articles*';
    const articleKeys = await this.redis.keys(articleKeysMatch);
    if (articleKeys && articleKeys.length > 0) this.redis.del(articleKeys);

    return {
      row: result,
      message: DELETE_ARTICLE_RESPONSE.SUCCESS,
    };
  }
}
