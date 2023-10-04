import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { PublishCommentDTO } from './dto/publishComment.dto';
import { code, roles } from 'src/constant';
import { PUBLISH_COMMENT_RESPONSE } from './constant';
import { Role } from 'src/common/decorator/role.decorator';

@Controller()
@Role(roles.VISITOR)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('/comment')
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
}
