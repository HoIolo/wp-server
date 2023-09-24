import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/decorator/role.decorator';
import { roles } from 'src/constant';
import { ArticleService } from './article.service';
import { GetArticleDTO } from './dto/getArticles.dto';

@ApiTags('article')
@Controller()
@Role(roles.VISITOR)
export class ArticleController {
  constructor(private readonly articleServer: ArticleService) {}

  @Get('articles')
  async getArticle(@Query() getArticleDto: GetArticleDTO) {
    const [rows, count] = await this.articleServer.find(getArticleDto);
    return {
      rows,
      count,
    };
  }
}
