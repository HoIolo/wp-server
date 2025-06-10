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
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/decorator/role.decorator';
import { code, roles, GUARD_RESPONSE } from 'src/constant';
import { ArticleService } from './article.service';
import { GetArticleDTO } from './dto/getArticles.dto';
import { CreateArticleDTO } from './dto/createArticle.dto';
import { UpdateArticleDTO } from './dto/updateArticle.dto';
import {
  CREATE_ARTICLE_RESPONSE,
  UPDATE_ARTICLE_RESPONSE,
  DEFAULT_RESOPNSE,
  DELETE_ARTICLE_RESPONSE,
  FIND_ARTICLE_BY_USER_ID_RESPONSE,
  FIND_ARTICLE_RESPONSE,
  ARTICLE_APPROVAL_STATUS,
  CACHE_CONSTANTS,
  REVIEW_MESSAGES,
} from './constant';
import { UserService } from '../user/user.service';
import { Redis } from 'ioredis';
import { handlePage, isEmpty } from 'src/utils/common';
import { TagsService } from '../tags/tags.service';
import { GetArticleByTagIdDto } from './dto/getArticleByTagId.dto';
import { GetArticleByUidDto } from './dto/getArticleByUid.dto';
import { ArticleTypeService } from './articleType.service';
import { AIService } from '../ai/ai.service';
import { Logger } from '@nestjs/common';
import { GetArticleByIdDto } from './dto/getArticleById.dto';
import { Profile } from '../user/entity/profile.entity';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('article')
@Controller()
@Role(roles.VISITOR)
export class ArticleController {
  private readonly cacheExpireTime: number = CACHE_CONSTANTS.EXPIRE_TIME;

  constructor(
    private readonly articleService: ArticleService,
    private readonly articleTypeService: ArticleTypeService,
    private readonly userService: UserService,
    private readonly tagsService: TagsService,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly aiService: AIService,
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
    const cacheKey = `${CACHE_CONSTANTS.ARTICLE_DETAIL_PREFIX}list_${sorted}_${page}_${offset}`;
    const articleCache = await this.redis.get(cacheKey);
    // 如果缓存中存在且没有关键字查询，则直接返回缓存
    if (articleCache && isEmpty(keyword)) {
      return JSON.parse(articleCache);
    }

    // 获取文章列表时，只返回审核通过的文章（状态为2）
    getArticleDto.is_approved = ARTICLE_APPROVAL_STATUS.APPROVED;
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
    const cacheKey = `${CACHE_CONSTANTS.ARTICLE_DETAIL_PREFIX}timeline_${order}`;
    const timelineCache = await this.redis.get(cacheKey);
    if (timelineCache) {
      return JSON.parse(timelineCache);
    }

    // 只查询审核通过的文章
    const [rows, count] = await this.articleService.findTimeLine(
      order,
      ARTICLE_APPROVAL_STATUS.APPROVED,
    );

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
   * 根据标签id获取文章信息
   * @param tagid
   * @param order
   * @returns
   */
  @Get('/article/tag/:tagid')
  async getArticleByTagId(
    @Param('tagid', ParseIntPipe) tagid: number,
    @Query() getArticleByTagDto: GetArticleByTagIdDto,
  ) {
    const { order } = getArticleByTagDto;
    const { skip, offset } = handlePage(getArticleByTagDto);

    // 只查询审核通过的文章
    const [rows, count] = await this.articleService.findArticleByTagId(
      tagid,
      order,
      skip,
      +offset,
      ARTICLE_APPROVAL_STATUS.APPROVED,
    );

    return {
      rows,
      count,
    };
  }

  /**
   * 根据用户id获取文章信息
   * @param uid 用户ID
   * @param getArticleByUid DTO包含分页参数和审核状态
   * @returns
   */
  @Get('/article/user/:uid')
  async getArticleByUserId(
    @Param('uid', ParseIntPipe) uid: number,
    @Query() getArticleByUid: GetArticleByUidDto,
  ) {
    const { order, is_approved } = getArticleByUid;
    const { skip, offset } = handlePage(getArticleByUid);

    // 确定查询的审核状态
    // 如果未指定is_approved，默认查询审核通过的文章
    // 如果指定is_approved为-1，则查询所有状态的文章
    // 否则查询指定状态的文章
    const approvalStatus =
      is_approved === undefined
        ? ARTICLE_APPROVAL_STATUS.APPROVED
        : Number(is_approved) === ARTICLE_APPROVAL_STATUS.ALL
        ? undefined
        : Number(is_approved);

    const [rows, count] = await this.articleService.findArticleByUserId(
      uid,
      order,
      skip,
      +offset,
      approvalStatus,
    );

    if (count < 1) {
      // 未查询到文章数据
      throw new HttpException(
        {
          message: FIND_ARTICLE_BY_USER_ID_RESPONSE.USER_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
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
  async getArticleById(
    @Param('id', ParseIntPipe) id: number,
    @Query() getArticleById: GetArticleByIdDto,
  ) {
    const { isEdit } = getArticleById;
    const cacheKey = `${CACHE_CONSTANTS.ARTICLE_DETAIL_PREFIX}${id}`;
    const articleCache = await this.redis.get(cacheKey);
    if (articleCache) {
      return JSON.parse(articleCache);
    }

    const article = await this.articleService.findById(id, isEdit);
    if (!article) {
      throw new HttpException(
        {
          message: FIND_ARTICLE_RESPONSE.PARAMS_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // 如果是编辑模式，直接返回文章信息，不判断审核状态
    if (Number(isEdit) === 1) {
      return { row: article };
    }

    // 使用状态映射处理不同审核状态的返回
    const statusHandlers = {
      [ARTICLE_APPROVAL_STATUS.APPROVED]: () => {
        this.redis.setex(
          cacheKey,
          this.cacheExpireTime,
          JSON.stringify({ row: article }),
        );
        return { row: article };
      },
      [ARTICLE_APPROVAL_STATUS.REVIEWING]: () => ({
        row: {
          status: ARTICLE_APPROVAL_STATUS.REVIEWING,
          message: REVIEW_MESSAGES.REVIEWING,
        },
      }),
      [ARTICLE_APPROVAL_STATUS.REJECTED]: () => ({
        row: {
          status: ARTICLE_APPROVAL_STATUS.REJECTED,
          message: REVIEW_MESSAGES.REJECTED,
          reason:
            article.reject_reason || REVIEW_MESSAGES.DEFAULT_REJECT_REASON,
        },
      }),
      [ARTICLE_APPROVAL_STATUS.PENDING]: () => ({
        row: {
          status: ARTICLE_APPROVAL_STATUS.PENDING,
          message: REVIEW_MESSAGES.PENDING,
        },
      }),
    };

    const handler =
      statusHandlers[article.is_approved] ||
      statusHandlers[ARTICLE_APPROVAL_STATUS.PENDING];
    return handler();
  }

  /**
   * 新增文章（需要登陆）
   * @param createArticleDto
   * @returns
   */
  @Post('article')
  @Role(roles.LOGGED)
  async createArticle(@Body() createArticleDto: CreateArticleDTO) {
    const { author_id, tags, type_id } = createArticleDto;
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
    // 验证分类是否存在
    const articleType = await this.articleTypeService.findById(Number(type_id));
    if (!articleType) {
      throw new HttpException(
        {
          message: CREATE_ARTICLE_RESPONSE.TYPEID_ERROR,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.articleService.createArticle(
      createArticleDto,
      tagsList,
      articleType,
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
      const articleKeysMatch = CACHE_CONSTANTS.ARTICLE_LIST_PATTERN;
      const articleKeys = await this.redis.keys(articleKeysMatch);
      if (articleKeys && articleKeys.length > 0) this.redis.del(articleKeys);

      // 异步调用AI审核
      this.aiReviewArticle(
        result.id,
        createArticleDto.title,
        createArticleDto.description,
        createArticleDto.content,
      );

      return {
        message: CREATE_ARTICLE_RESPONSE.SUCCESS,
      };
    }
  }

  /**
   * 更新文章（需要登陆）
   * @param id 文章ID
   * @param updateArticleDto 更新信息
   * @returns
   */
  @Put('article/:id')
  @UseGuards(AuthGuard('jwt'))
  @Role(roles.LOGGED)
  async updateArticle(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDTO,
    @Req() req: Request,
  ) {
    // 查找文章
    const article = await this.articleService.findById(id);
    if (!article) {
      throw new HttpException(
        {
          message: UPDATE_ARTICLE_RESPONSE.ARTICLE_NOT_FOUND,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = req.user as Profile;
    // 验证当前用户是否是文章作者
    const currentUserId = user.id;
    if (!currentUserId || article.author.id !== currentUserId) {
      throw new HttpException(
        {
          message: GUARD_RESPONSE.NOT_PERMISSION,
          code: code.INVALID_PARAMS,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // 验证标签是否存在（如果提供了标签）
    let tagsList = [];
    if (updateArticleDto.tags && updateArticleDto.tags.length > 0) {
      const tagsObjectList = await this.tagsService.findByTagNameArray(
        updateArticleDto.tags,
      );
      tagsList = tagsObjectList.map((tag) => tag.tagName);

      if (tagsList.length !== updateArticleDto.tags.length) {
        throw new HttpException(
          {
            message: UPDATE_ARTICLE_RESPONSE.TAGS_ERROR,
            code: code.INVALID_PARAMS,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 验证分类是否存在（如果提供了分类）
    let articleType = null;
    if (updateArticleDto.type_id) {
      articleType = await this.articleTypeService.findById(
        Number(updateArticleDto.type_id),
      );
      if (!articleType) {
        throw new HttpException(
          {
            message: UPDATE_ARTICLE_RESPONSE.TYPEID_ERROR,
            code: code.INVALID_PARAMS,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 更新文章，状态改为审核中
    const updatedArticle = await this.articleService.updateArticle(
      id,
      updateArticleDto,
      tagsList,
      articleType,
      ARTICLE_APPROVAL_STATUS.REVIEWING,
    );
    if (!updatedArticle) {
      throw new HttpException(
        {
          message: UPDATE_ARTICLE_RESPONSE.FAIL,
          code: code.SYSTEM_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 清除文章缓存
    const articleDetailCacheKey = `${CACHE_CONSTANTS.ARTICLE_DETAIL_PREFIX}${id}`;
    await this.redis.del(articleDetailCacheKey);

    // 清除文章列表缓存
    const articleKeysMatch = CACHE_CONSTANTS.ARTICLE_LIST_PATTERN;
    const articleKeys = await this.redis.keys(articleKeysMatch);
    if (articleKeys && articleKeys.length > 0) this.redis.del(articleKeys);

    // 异步调用AI审核
    this.aiReviewArticle(
      id,
      updateArticleDto.title || article.title,
      updateArticleDto.description || article.description,
      updateArticleDto.content || article.content,
    );

    return {
      message: UPDATE_ARTICLE_RESPONSE.SUCCESS,
    };
  }

  /**
   * 异步调用AI审核文章
   * @param articleId 文章ID
   * @param title 文章标题
   * @param description 文章描述
   * @param content 文章内容
   */
  private async aiReviewArticle(
    articleId: number,
    title: string,
    description: string,
    content: string,
  ) {
    try {
      // 先将文章状态设置为"审核中"
      await this.articleService.updateArticleApprovalStatus(
        articleId,
        ARTICLE_APPROVAL_STATUS.REVIEWING,
        null,
      );

      // 调用AI审核服务
      const reviewResult = await this.aiService.reviewArticle(
        title,
        description,
        content,
      );

      const successCallback = async () => {
        // 如果审核通过，清除相关缓存，确保最新数据可见
        if (reviewResult.approved === ARTICLE_APPROVAL_STATUS.APPROVED) {
          // 清除文章列表相关缓存
          const articleKeysMatch = CACHE_CONSTANTS.ARTICLE_LIST_PATTERN;
          const articleKeys = await this.redis.keys(articleKeysMatch);
          if (articleKeys && articleKeys.length > 0) {
            await this.redis.del(articleKeys);
            Logger.log(
              REVIEW_MESSAGES.APPROVED_CACHE_CLEARED,
              'ArticleController',
            );
          }
        }
      };

      // 根据AI审核结果更新文章状态
      await this.articleService.updateArticleApprovalStatus(
        articleId,
        reviewResult.approved,
        reviewResult.reason,
        successCallback,
      );
    } catch (error) {
      // 记录错误但不影响用户体验
      Logger.error(
        `${REVIEW_MESSAGES.REVIEW_FAILED}: ${error.message}`,
        'ArticleController',
      );

      // 审核出错时，将状态恢复为待审核
      await this.articleService.updateArticleApprovalStatus(
        articleId,
        ARTICLE_APPROVAL_STATUS.PENDING,
        REVIEW_MESSAGES.SYSTEM_ERROR,
      );
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
    const articleKeysMatch = CACHE_CONSTANTS.ARTICLE_LIST_PATTERN;
    const articleKeys = await this.redis.keys(articleKeysMatch);
    if (articleKeys && articleKeys.length > 0) this.redis.del(articleKeys);

    return {
      row: result,
      message: DELETE_ARTICLE_RESPONSE.SUCCESS,
    };
  }
}
