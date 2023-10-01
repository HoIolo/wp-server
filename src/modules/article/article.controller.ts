import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
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
import { CREATE_ARTICLE_RESPONSE, FIND_ARTICLE_RESPONSE } from './constant';
import { UserService } from '../user/user.service';

@ApiTags('article')
@Controller()
@Role(roles.VISITOR)
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly userService: UserService,
  ) {}

  /**
   * 分页获取文章信息
   * @param getArticleDto
   * @returns
   */
  @Get('articles')
  async getArticle(@Query() getArticleDto: GetArticleDTO) {
    const [rows, count] = await this.articleService.find(getArticleDto);
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
    const user = await this.userService.findProfileByUid(
      createArticleDto.author_id as number,
    );
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

    const result = await this.articleService.createArticle(createArticleDto);
    if (result === null) {
      throw new HttpException(
        {
          message: CREATE_ARTICLE_RESPONSE.FAIL,
          code: code.SYSTEM_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else {
      return {
        message: CREATE_ARTICLE_RESPONSE.SUCCESS,
      };
    }
  }
}
