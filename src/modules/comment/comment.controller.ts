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
import { CommentService } from './comment.service';
import { PublishCommentDTO } from './dto/publishComment.dto';
import { code, roles } from 'src/constant';
import { PUBLISH_COMMENT_RESPONSE } from './constant';
import { Role } from 'src/common/decorator/role.decorator';
import { PageDTO } from 'src/common/dto/page.dto';

@Controller()
@Role(roles.VISITOR)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('comments')
  async getComments(@Query() pageDto: PageDTO) {
    const [rows, count] = await this.commentService.findAllByPage(pageDto);

    return {
      rows,
      count,
    };
  }

  @Post('comment')
  async publishComment(@Body() publishCommentDto: PublishCommentDTO) {
    const result = await this.commentService.createComment(publishCommentDto);
    if (!result) {
      throw new HttpException(
        {
          message: PUBLISH_COMMENT_RESPONSE.PUBLISH_ERROR,
          code: code.SYSTEM_ERROR,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return {
      row: result,
      message: PUBLISH_COMMENT_RESPONSE.PUBLISH_SUCCESS,
    };
  }

  @Get('/comment/:articleId')
  async getCommentByArticle(
    @Param('articleId', ParseIntPipe) articleId: number,
    @Query() pageDto: PageDTO,
  ) {
    const [rows, count] = await this.commentService.findByArticleId(
      articleId,
      pageDto,
    );

    return {
      rows,
      count,
    };
  }
}
